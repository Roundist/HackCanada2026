import { jsPDF } from "jspdf";

/** Build and download a professionally formatted survival plan PDF. */
export function downloadSurvivalPlanPdf(
  result: Record<string, unknown>,
  filename = "tariff-triage-survival-plan.pdf"
): void {
  const plan = (result.survival_plan || result) as Record<string, unknown>;
  const summary = plan.executive_summary as Record<string, unknown> | undefined;
  const actions = (plan.priority_actions || []) as Record<string, unknown>[];
  const timeline = plan.timeline as Record<string, string[]> | undefined;
  const risks = (plan.risks || []) as Record<string, unknown>[];
  const tariffImpact = result.tariff_impact as Record<string, unknown> | undefined;

  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = 210;
  const pageH = 297;
  const mL = 20; // left margin
  const mR = 20;
  const contentW = pageW - mL - mR;
  let y = 0;

  // --- Colors ---
  type RGB = [number, number, number];
  const navy: RGB = [12, 35, 64];
  const darkGray: RGB = [55, 65, 81];
  const midGray: RGB = [107, 114, 128];
  const lightGray: RGB = [229, 231, 235];
  const red: RGB = [185, 28, 28];
  const amber: RGB = [180, 83, 9];
  const green: RGB = [21, 128, 61];
  const blue: RGB = [30, 64, 175];
  const white: RGB = [255, 255, 255];

  // --- Helpers ---
  const checkPage = (needed: number) => {
    if (y + needed > pageH - 25) {
      addFooter();
      doc.addPage();
      y = 25;
    }
  };

  const addFooter = () => {
    doc.setDrawColor(...lightGray);
    doc.line(mL, pageH - 18, pageW - mR, pageH - 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...midGray);
    doc.text("TariffTriage  |  AI Trade Intelligence Platform", mL, pageH - 13);
    doc.text(
      `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      pageW - mR,
      pageH - 13,
      { align: "right" }
    );
    doc.text("CONFIDENTIAL", pageW / 2, pageH - 13, { align: "center" });
  };

  const sectionHeading = (title: string) => {
    checkPage(16);
    // Accent bar
    doc.setFillColor(...navy);
    doc.rect(mL, y, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...navy);
    doc.text(title.toUpperCase(), mL + 6, y + 5);
    y += 12;
    // Divider line
    doc.setDrawColor(...lightGray);
    doc.line(mL, y - 3, pageW - mR, y - 3);
  };

  const bodyText = (text: string, fontSize = 9.5, color = darkGray): number => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines: string[] = doc.splitTextToSize(text, contentW);
    const lineH = fontSize * 0.42;
    for (const line of lines) {
      checkPage(lineH + 1);
      doc.text(line, mL, y);
      y += lineH;
    }
    y += 1.5;
    return lines.length;
  };

  // ============================================================
  // COVER / HEADER BLOCK
  // ============================================================

  // Top brand bar
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 42, "F");

  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text("TARIFF TRIAGE", mL, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 200, 230);
  doc.text("AI Trade Intelligence Platform", mL + 42, 14);

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...white);
  doc.text("Trade War Survival Plan", mL, 30);

  // Subtitle line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 230);
  const businessName = summary?.business_name ? String(summary.business_name) : "Business Analysis";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`${businessName}  |  ${dateStr}`, mL, 38);

  y = 52;

  // ============================================================
  // KEY METRICS ROW
  // ============================================================
  if (tariffImpact || summary) {
    const metrics: { label: string; value: string; color: RGB }[] = [];

    if (tariffImpact) {
      const exposure = Number(tariffImpact.total_tariff_exposure ?? 0);
      metrics.push({ label: "TOTAL EXPOSURE", value: `$${exposure.toLocaleString()}`, color: red });
      const erosion = Number(tariffImpact.total_margin_erosion_pct ?? 0);
      metrics.push({ label: "MARGIN EROSION", value: `${erosion.toFixed(1)}%`, color: amber });
    }
    if (summary) {
      const riskLevel = String(summary.risk_level ?? "N/A").toUpperCase();
      const riskColor = riskLevel === "HIGH" || riskLevel === "CRITICAL" ? red : riskLevel === "MEDIUM" ? amber : green;
      metrics.push({ label: "RISK LEVEL", value: riskLevel, color: riskColor });
    }

    if (metrics.length > 0) {
      const boxW = contentW / metrics.length;
      const boxH = 18;
      checkPage(boxH + 6);

      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        const bx = mL + i * boxW;

        // Box background
        doc.setFillColor(245, 247, 250);
        doc.rect(bx + (i > 0 ? 1.5 : 0), y, boxW - (i > 0 ? 1.5 : 0) - (i < metrics.length - 1 ? 1.5 : 0), boxH, "F");

        // Top accent line
        doc.setFillColor(...m.color);
        doc.rect(bx + (i > 0 ? 1.5 : 0), y, boxW - 3, 1, "F");

        // Label
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...midGray);
        doc.text(m.label, bx + (i > 0 ? 4 : 2.5), y + 6.5);

        // Value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...m.color);
        doc.text(m.value, bx + (i > 0 ? 4 : 2.5), y + 14.5);
      }

      y += boxH + 8;
    }
  }

  // ============================================================
  // EXECUTIVE SUMMARY
  // ============================================================
  if (summary) {
    sectionHeading("Executive Summary");

    if (summary.headline) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...navy);
      const headlineLines: string[] = doc.splitTextToSize(String(summary.headline), contentW);
      for (const line of headlineLines) {
        checkPage(6);
        doc.text(line, mL, y);
        y += 5;
      }
      y += 2;
    }

    if (summary.key_finding) {
      bodyText(String(summary.key_finding));
    }
    y += 4;
  }

  // ============================================================
  // PRIORITY ACTIONS
  // ============================================================
  if (actions.length > 0) {
    sectionHeading("Priority Actions");

    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const rank = typeof a.rank === "number" ? a.rank : i + 1;
      const actionName = String(a.action ?? "");
      const desc = String(a.description ?? "");
      const savings = typeof a.estimated_savings === "number" ? a.estimated_savings : null;
      const effort = typeof a.implementation_effort === "string" ? a.implementation_effort : "";
      const days = typeof a.timeline_days === "number" ? a.timeline_days : null;

      checkPage(20);

      // Row background for alternating rows
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(mL, y - 2, contentW, desc ? 18 : 10, "F");
      }

      // Rank circle
      doc.setFillColor(...navy);
      doc.circle(mL + 4, y + 2, 3.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...white);
      doc.text(String(rank), mL + 4, y + 3, { align: "center" });

      // Action name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...navy);
      doc.text(actionName, mL + 11, y + 3);

      // Savings badge on right
      if (savings !== null) {
        const savingsText = `Save $${savings.toLocaleString()}`;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...green);
        doc.text(savingsText, pageW - mR, y + 3, { align: "right" });
      }

      y += 7;

      // Description
      if (desc) {
        bodyText(desc, 8.5, midGray);
      }

      // Meta tags
      const tags: string[] = [];
      if (days !== null) tags.push(`${days} days`);
      if (effort) tags.push(`Effort: ${effort}`);
      if (tags.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...midGray);
        doc.text(tags.join("   |   "), mL + 11, y);
        y += 4;
      }

      y += 3;
    }
    y += 4;
  }

  // ============================================================
  // IMPLEMENTATION TIMELINE
  // ============================================================
  if (timeline) {
    sectionHeading("Implementation Timeline");

    const periods = [
      { key: "days_30", label: "30 Days", color: green },
      { key: "days_60", label: "60 Days", color: amber },
      { key: "days_90", label: "90 Days", color: blue },
    ] as const;

    for (const period of periods) {
      const items = (timeline[period.key] as string[]) ?? [];
      if (items.length === 0) continue;

      checkPage(12);

      // Period label with colored accent
      doc.setFillColor(...period.color);
      doc.rect(mL, y, 2, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...navy);
      doc.text(period.label, mL + 5, y + 4);
      y += 8;

      for (const item of items) {
        checkPage(6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...darkGray);
        // Bullet
        doc.setFillColor(...midGray);
        doc.circle(mL + 4, y - 1, 0.8, "F");
        const itemLines: string[] = doc.splitTextToSize(item, contentW - 10);
        for (const line of itemLines) {
          checkPage(4.5);
          doc.text(line, mL + 8, y);
          y += 4;
        }
        y += 1;
      }
      y += 4;
    }
  }

  // ============================================================
  // RISK ASSESSMENT
  // ============================================================
  if (risks.length > 0) {
    sectionHeading("Risk Assessment");

    // Table header
    checkPage(10);
    doc.setFillColor(240, 242, 245);
    doc.rect(mL, y - 2, contentW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...midGray);
    doc.text("RISK", mL + 2, y + 2);
    doc.text("PROBABILITY", mL + 90, y + 2);
    doc.text("MITIGATION", mL + 115, y + 2);
    y += 9;

    for (const r of risks) {
      const riskName = String(r.risk ?? "");
      const prob = String(r.probability ?? "");
      const mitigation = String(r.mitigation ?? "");

      // Estimate height needed
      const mitigationLines: string[] = doc.splitTextToSize(mitigation, contentW - 115);
      const riskLines: string[] = doc.splitTextToSize(riskName, 85);
      const rowH = Math.max(riskLines.length, mitigationLines.length) * 4 + 4;
      checkPage(rowH);

      // Divider
      doc.setDrawColor(...lightGray);
      doc.line(mL, y - 1, pageW - mR, y - 1);

      // Risk name
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...darkGray);
      let ry = y + 2;
      for (const line of riskLines) {
        doc.text(line, mL + 2, ry);
        ry += 4;
      }

      // Probability badge
      const probColor = prob === "High" ? red : prob === "Medium" ? amber : green;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...probColor);
      doc.text(prob.toUpperCase(), mL + 90, y + 2);

      // Mitigation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...midGray);
      let my = y + 2;
      for (const line of mitigationLines) {
        doc.text(line, mL + 115, my);
        my += 4;
      }

      y += rowH;
    }
    y += 4;
  }

  // ============================================================
  // DISCLAIMER & FOOTER
  // ============================================================
  checkPage(20);
  doc.setDrawColor(...lightGray);
  doc.line(mL, y, pageW - mR, y);
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...midGray);
  const disclaimer =
    "This report was generated by TariffTriage AI and is intended for informational purposes only. " +
    "It does not constitute legal, financial, or trade compliance advice. Consult qualified professionals " +
    "before making business decisions based on this analysis.";
  const disclaimerLines: string[] = doc.splitTextToSize(disclaimer, contentW);
  for (const line of disclaimerLines) {
    doc.text(line, mL, y);
    y += 3.5;
  }

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter();
    // Page number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...midGray);
    doc.text(`Page ${p} of ${totalPages}`, pageW - mR, pageH - 8, { align: "right" });
  }

  doc.save(filename);
}
