export async function startAnalysis(
  businessDescription: string,
  demoProfileId?: string
): Promise<{ session_id: string; ws_url: string }> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_description: businessDescription,
      demo_profile_id: demoProfileId || undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export interface TariffRow {
  hs_code: string;
  description?: string;
  mfn_rate?: number;
  us_retaliatory_rate?: number;
  effective_rate: number;
  category?: string;
  effective_date?: string;
  notes?: string;
}

/** Response from /api/tariffs — includes CBSA source attribution. */
export interface TariffsResponse {
  tariffs: TariffRow[];
  source?: string;
  source_name?: string;
  source_description?: string;
  source_url?: string;
  effective_date?: string;
}

export async function fetchTariffs(): Promise<TariffRow[]> {
  const res = await fetch("/api/tariffs");
  if (!res.ok) return [];
  const data: TariffsResponse = await res.json();
  return data?.tariffs ?? [];
}

export interface SearchResult {
  hs_code: string;
  description: string;
  category: string;
  similarity: number;
  mfn_rate: number;
  us_retaliatory_rate: number;
  effective_rate: number;
  effective_date: string;
}

/** Response from /api/search — results from CBSA tariff vector store. */
export interface SearchResponse {
  results: SearchResult[];
  query?: string;
  source?: string;
  source_name?: string;
  source_description?: string;
  source_url?: string;
  effective_date?: string;
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("CBSA_LOADING");
    throw new Error("CBSA_UNAVAILABLE");
  }
  const data: SearchResponse = await res.json();
  return data?.results ?? [];
}
