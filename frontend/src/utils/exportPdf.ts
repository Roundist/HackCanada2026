import { jsPDF } from "jspdf";

/** Build and download a survival plan PDF from result data (demo or any result). */
export function downloadSurvivalPlanPdf(result: Record<string, unknown>, filename = "tariff-triage-survival-plan.pdf"): void {
  const plan = (result.survival_plan || result) as Record<string, unknown>;
  const summary = plan.executive_summary as Record<string, unknown> | undefined;
  const actions = (plan.priority_actions || []) as Record<string, unknown>[];
  const timeline = plan.timeline as Record<string, string[]> | undefined;
  const risks = (plan.risks || []) as Record<string, unknown>[];
  const tariffImpact = result.tariff_impact as Record<string, unknown> | undefined;

  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 18;
  const pageW = 210;
  const pageH = 297;
  const maxW = pageW - margin * 2;
  let y = margin;

  const pushText = (text: string, fontSize = 11) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxW);
    if (y + lines.length * (fontSize * 0.4) > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * (fontSize * 0.4) + 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 52, 96);
  doc.text("Trade War Survival Plan", margin, y);
  y += 10;

  if (summary?.business_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(String(summary.business_name), margin, y);
    y += 6;
  }

  doc.setTextColor(0, 0, 0);
  if (summary?.headline) {
    doc.setFont("helvetica", "bold");
    pushText(String(summary.headline), 12);
  }
  if (summary?.key_finding) {
    doc.setFont("helvetica", "normal");
    pushText(String(summary.key_finding), 10);
    y += 4;
  }

  if (tariffImpact) {
    const exposure = Number(tariffImpact.total_tariff_exposure ?? 0);
    const erosion = Number(tariffImpact.total_margin_erosion_pct ?? 0);
    const risk = String(tariffImpact.risk_level ?? "—").toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total exposure: $${exposure.toLocaleString()}  |  Margin erosion: ${erosion.toFixed(1)}%  |  Risk: ${risk}`, margin, y);
    y += 10;
  }

  if (actions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Priority Actions", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    for (const a of actions) {
      const rank = typeof a.rank === "number" ? a.rank : 0;
      const action = String(a.action ?? "");
      const desc = String(a.description ?? "");
      const savings = typeof a.estimated_savings === "number" ? a.estimated_savings : 0;
      pushText(`${rank}. ${action}  —  Save $${savings.toLocaleString()}`, 10);
      if (desc) pushText(desc, 9);
      y += 2;
    }
    y += 4;
  }

  if (timeline) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Timeline", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const period of ["days_30", "days_60", "days_90"] as const) {
      const items = (timeline[period] as string[]) ?? [];
      if (items.length === 0) continue;
      doc.setFontSize(10);
      doc.text(period.replace("days_", "") + " days:", margin, y);
      y += 5;
      for (const item of items) {
        doc.text(`  • ${item}`, margin, y);
        y += 5;
      }
      y += 2;
    }
    y += 4;
  }

  if (risks.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Risks & Mitigation", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const r of risks) {
      doc.setFontSize(9);
      pushText(`${String(r.risk ?? "")} (${String(r.probability ?? "")}) — ${String(r.mitigation ?? "")}`, 9);
      y += 2;
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`TariffTriage · Generated ${new Date().toLocaleDateString()}`, margin, pageH - 12);

  doc.save(filename);
}
