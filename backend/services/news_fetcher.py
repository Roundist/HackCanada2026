from __future__ import annotations

import asyncio
import os
import time
from datetime import datetime, timedelta
from urllib.parse import quote

import feedparser
import httpx

_cache: dict[str, tuple[float, list[dict]]] = {}
CACHE_TTL = 3600  # 1 hour


async def fetch_trade_news(
    industries: list[str], materials: list[str]
) -> list[dict]:
    """Fetch trade war news from the last 24 hours via Google News RSS."""
    cache_key = "|".join(sorted(industries + materials))
    if cache_key in _cache:
        ts, articles = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return articles

    queries = [
        "Canada tariff",
        "US Canada trade war",
    ]
    for industry in industries:
        if industry:
            queries.append(f"Canada {industry} tariff")
    for material in materials[:3]:
        queries.append(f"Canada {material} tariff")

    all_articles: list[dict] = []
    seen_titles: set[str] = set()

    for query in queries:
        try:
            articles = await _fetch_google_news_rss(query)
            for article in articles:
                title_lower = article["title"].lower()
                if title_lower not in seen_titles:
                    seen_titles.add(title_lower)
                    all_articles.append(article)
        except Exception:
            continue

    # Fallback to NewsAPI if Google News returns nothing
    if not all_articles:
        newsapi_key = os.getenv("NEWSAPI_KEY")
        if newsapi_key:
            try:
                all_articles = await _fetch_newsapi(queries[0], newsapi_key)
            except Exception:
                pass

    _cache[cache_key] = (time.time(), all_articles)
    return all_articles


async def _fetch_google_news_rss(query: str) -> list[dict]:
    """Parse Google News RSS for a query."""
    url = f"https://news.google.com/rss/search?q={quote(query)}+when:1d&hl=en-CA&gl=CA&ceid=CA:en"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    feed = await asyncio.to_thread(feedparser.parse, resp.text)
    articles = []
    for entry in feed.entries[:5]:
        articles.append({
            "title": entry.get("title", ""),
            "source": entry.get("source", {}).get("title", "Unknown"),
            "published": entry.get("published", ""),
            "url": entry.get("link", ""),
            "snippet": entry.get("summary", "")[:300],
        })
    return articles


async def _fetch_newsapi(query: str, api_key: str) -> list[dict]:
    """Fallback: fetch from NewsAPI.org."""
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "from": yesterday,
        "sortBy": "relevancy",
        "pageSize": 10,
        "apiKey": api_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    return [
        {
            "title": a.get("title", ""),
            "source": a.get("source", {}).get("name", "Unknown"),
            "published": a.get("publishedAt", ""),
            "url": a.get("url", ""),
            "snippet": (a.get("description") or "")[:300],
        }
        for a in data.get("articles", [])[:10]
    ]
