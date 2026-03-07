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
