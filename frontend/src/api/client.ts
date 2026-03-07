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

export async function fetchTariffs(): Promise<TariffRow[]> {
  const res = await fetch("/api/tariffs");
  if (!res.ok) return [];
  const data = await res.json();
  return data?.tariffs ?? [];
}
