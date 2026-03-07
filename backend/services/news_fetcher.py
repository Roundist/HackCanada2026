from __future__ import annotations

import asyncio
import logging
import os
import time
from datetime import datetime, timedelta
from urllib.parse import quote

import feedparser
import httpx

logger = logging.getLogger(__name__)

_cache: dict[str, tuple[float, list[dict]]] = {}
CACHE_TTL = 3600  # 1 hour

# Browser-like headers so Google News RSS is less likely to return 403
NEWS_HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "en-CA,en;q=0.9",
}


async def fetch_trade_news(
    industries: list[str], materials: list[str]
) -> list[dict]:
    """Fetch trade-related news. Uses Google News RSS, then NewsAPI, then CBC RSS. Never raises."""
    cache_key = "|".join(sorted(industries + materials))
    if cache_key in _cache:
        ts, articles = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return articles

    try:
        queries = [
            "Canada tariff",
            "US Canada trade",
        ]
        for industry in industries:
            if industry:
                queries.append(f"Canada {industry} tariff")
        for material in materials[:3]:
            if material:
                queries.append(f"Canada {material} tariff")

        all_articles: list[dict] = []
        seen_titles: set[str] = set()

        for query in queries:
            try:
                articles = await _fetch_google_news_rss(query)
                for article in articles:
                    title_lower = (article.get("title") or "").lower()
                    if title_lower and title_lower not in seen_titles:
                        seen_titles.add(title_lower)
                        all_articles.append(article)
            except Exception as e:
                logger.debug("Google News RSS query failed %s: %s", query, e)
                continue

        # Fallback 1: NewsAPI if Google returned nothing
        if not all_articles:
            newsapi_key = os.getenv("NEWSAPI_KEY")
            if newsapi_key:
                try:
                    all_articles = await _fetch_newsapi(queries[0], newsapi_key)
                except Exception as e:
                    logger.debug("NewsAPI fallback failed: %s", e)

        # Fallback 2: CBC Business/Canada RSS (no key required)
        if not all_articles:
            try:
                all_articles = await _fetch_cbc_rss()
            except Exception as e:
                logger.debug("CBC RSS fallback failed: %s", e)

        _cache[cache_key] = (time.time(), all_articles)
        return all_articles
    except Exception as e:
        logger.warning("fetch_trade_news failed: %s", e)
        _cache[cache_key] = (time.time(), [])
        return []


async def _fetch_google_news_rss(query: str) -> list[dict]:
    """Parse Google News RSS for a query. Uses browser-like headers to reduce 403s."""
    url = f"https://news.google.com/rss/search?q={quote(query)}+when:1d&hl=en-CA&gl=CA&ceid=CA:en"
    async with httpx.AsyncClient(timeout=12, follow_redirects=True, headers=NEWS_HTTP_HEADERS) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    feed = await asyncio.to_thread(feedparser.parse, resp.text)
    articles = []
    for entry in (feed.entries or [])[:8]:
        title = entry.get("title") or ""
        if not title:
            continue
        source = entry.get("source")
        source_name = source.get("title", "Unknown") if isinstance(source, dict) else "Unknown"
        articles.append({
            "title": title,
            "source": source_name,
            "published": entry.get("published", ""),
            "url": entry.get("link", ""),
            "snippet": (entry.get("summary") or "")[:300],
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
    async with httpx.AsyncClient(timeout=12) as client:
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


async def _fetch_cbc_rss() -> list[dict]:
    """Fallback: CBC Business and Canada RSS (no API key). Good for Canada/trade context."""
    all_articles: list[dict] = []
    urls = [
        "https://www.cbc.ca/webfeed/rss/rss-business",
        "https://www.cbc.ca/webfeed/rss/rss-topstories",
    ]
    async with httpx.AsyncClient(timeout=10, follow_redirects=True, headers=NEWS_HTTP_HEADERS) as client:
        for url in urls:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                feed = await asyncio.to_thread(feedparser.parse, resp.text)
                for entry in (feed.entries or [])[:5]:
                    title = entry.get("title") or ""
                    if not title:
                        continue
                    all_articles.append({
                        "title": title,
                        "source": "CBC News",
                        "published": entry.get("published", ""),
                        "url": entry.get("link", ""),
                        "snippet": (entry.get("summary", "") or "")[:300],
                    })
            except Exception as e:
                logger.debug("CBC RSS url %s failed: %s", url, e)
    return all_articles[:15]
