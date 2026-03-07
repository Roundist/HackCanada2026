/**
 * Centralized business profiles — single source of truth for demo and dashboard.
 * Selecting a demo profile updates the entire dashboard state.
 */

export interface SupplyChainRoute {
  commodity: string;
  sourceCountry: string;
  sourceRegion?: string;
  transitPoint: string;
  hsCode?: string;
  tariffRatePct: number;
}

export interface AltSupplier {
  name: string;
  country: string;
  commodity: string;
  deltaMarginSavedPct: number;
  deltaAmountSaved: number;
  note?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  revenue: string;
  revenueNumeric: number; // for calculations (millions)
  imports: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  routes: SupplyChainRoute[];
  /** Base margin erosion at 25% tariff (for stress-test formula) */
  baseMarginErosionPct: number;
  /** Alt suppliers keyed by profile id (mock) */
  altSuppliers: AltSupplier[];
}

export const businessProfiles: BusinessProfile[] = [
  {
    id: "maple_furniture",
    name: "Maple Furniture Co.",
    industry: "Manufacturing",
    revenue: "$8M",
    revenueNumeric: 8,
    imports: "US — 65%",
    risk: "HIGH",
    description:
      "We are a mid-sized Canadian furniture manufacturer based in Ontario with $8M annual revenue. We import hardwood lumber (oak, maple, walnut) from mills in Michigan and Wisconsin, upholstery fabrics from North Carolina, steel hardware and hinges from Ohio, and finishing chemicals (stains, lacquers) from Pennsylvania. About 65% of our raw materials come from the US. We sell primarily in the Canadian market through retail partners, with 20% of sales exported back to the US. Our margins are typically 18-22% depending on the product line. We employ 45 people and operate one production facility.",
    baseMarginErosionPct: 8.4,
    routes: [
      { commodity: "Hardwood Lumber", sourceCountry: "USA", sourceRegion: "Michigan, WI", transitPoint: "Detroit–Windsor", hsCode: "4407", tariffRatePct: 25 },
      { commodity: "Upholstery Fabrics", sourceCountry: "USA", sourceRegion: "North Carolina", transitPoint: "Buffalo–Fort Erie", hsCode: "5907", tariffRatePct: 25 },
      { commodity: "Steel Hardware", sourceCountry: "USA", sourceRegion: "Ohio", transitPoint: "Detroit–Windsor", hsCode: "8302", tariffRatePct: 25 },
      { commodity: "Finishing Chemicals", sourceCountry: "USA", sourceRegion: "Pennsylvania", transitPoint: "Buffalo–Fort Erie", hsCode: "3209", tariffRatePct: 25 },
    ],
    altSuppliers: [
      { name: "Brazil Timber Corp", country: "Brazil", commodity: "Hardwood Lumber", deltaMarginSavedPct: 3.2, deltaAmountSaved: 145000, note: "CETA-equivalent 0% duty" },
      { name: "Vietnam Textiles Ltd", country: "Vietnam", commodity: "Upholstery Fabrics", deltaMarginSavedPct: 1.8, deltaAmountSaved: 42000, note: "CPTPP 0% duty" },
      { name: "Ontario Hardwood Mills", country: "Canada", commodity: "Hardwood Lumber", deltaMarginSavedPct: 4.1, deltaAmountSaved: 185000, note: "Domestic, no duty" },
    ],
  },
  {
    id: "northern_tech",
    name: "Northern Tech Solutions",
    industry: "Technology",
    revenue: "$12M",
    revenueNumeric: 12,
    imports: "US — 55%",
    risk: "MEDIUM",
    description:
      "We are a Canadian electronics company in Vancouver with $12M annual revenue. We import printed circuit boards and semiconductor components from suppliers in California and Texas, plastic housings from injection molding companies in Michigan, lithium batteries from US distributors (originally manufactured in China), and specialized testing equipment from Oregon. About 55% of our component costs are US-sourced. We assemble IoT devices for agricultural monitoring and sell 40% to US customers and 35% to Canadian customers. Margins run 25-30% but are under pressure from rising component costs. We have 60 employees.",
    baseMarginErosionPct: 6.2,
    routes: [
      { commodity: "PCB & Semiconductors", sourceCountry: "USA", sourceRegion: "California, TX", transitPoint: "Pacific Gateway", hsCode: "8542", tariffRatePct: 25 },
      { commodity: "Plastic Housings", sourceCountry: "USA", sourceRegion: "Michigan", transitPoint: "Detroit–Windsor", hsCode: "3926", tariffRatePct: 25 },
      { commodity: "Lithium Batteries", sourceCountry: "USA", sourceRegion: "US Distributors", transitPoint: "Pacific Gateway", hsCode: "8507", tariffRatePct: 25 },
    ],
    altSuppliers: [
      { name: "Taiwan Semiconductor Supply", country: "Taiwan", commodity: "PCB & Semiconductors", deltaMarginSavedPct: 2.8, deltaAmountSaved: 98000, note: "Diversified supply" },
      { name: "Mexico Plastics Inc", country: "Mexico", commodity: "Plastic Housings", deltaMarginSavedPct: 1.5, deltaAmountSaved: 52000, note: "CUSMA 0% duty" },
    ],
  },
  {
    id: "prairie_harvest",
    name: "Prairie Harvest Foods",
    industry: "Food & Beverage",
    revenue: "$5M",
    revenueNumeric: 5,
    imports: "US — 40%",
    risk: "MEDIUM",
    description:
      "We are a Canadian food processing company in Manitoba with $5M annual revenue. We import packaging materials (specialized food-grade containers and labels) from Wisconsin, flavoring extracts and food additives from US chemical companies in New Jersey, processing equipment parts from Illinois, and some specialty grains and ingredients from North Dakota. About 40% of our input costs are US-sourced. We produce organic snack foods and sell 70% domestically through major grocery chains, with 25% exported to the US. Margins are thin at 12-15%. We employ 30 people in our processing facility.",
    baseMarginErosionPct: 4.1,
    routes: [
      { commodity: "Packaging Materials", sourceCountry: "USA", sourceRegion: "Wisconsin", transitPoint: "Emerson–Pembina", hsCode: "3923", tariffRatePct: 25 },
      { commodity: "Flavoring Extracts", sourceCountry: "USA", sourceRegion: "New Jersey", transitPoint: "Buffalo–Fort Erie", hsCode: "2106", tariffRatePct: 25 },
      { commodity: "Specialty Grains", sourceCountry: "USA", sourceRegion: "North Dakota", transitPoint: "Emerson–Pembina", hsCode: "1001", tariffRatePct: 25 },
    ],
    altSuppliers: [
      { name: "EU Packaging Solutions", country: "Germany", commodity: "Packaging Materials", deltaMarginSavedPct: 1.2, deltaAmountSaved: 28000, note: "CETA 0% duty" },
      { name: "Canada Grains Co", country: "Canada", commodity: "Specialty Grains", deltaMarginSavedPct: 2.0, deltaAmountSaved: 45000, note: "Domestic" },
    ],
  },
];

/** Get alt suppliers for a profile (from central data) */
export function getAltSuppliersForProfile(profileId: string): AltSupplier[] {
  const profile = businessProfiles.find((p) => p.id === profileId);
  return profile?.altSuppliers ?? [];
}

/** Compute stress-test metrics from tariff rate (0–50) and base erosion at 25% */
export function computeStressTestMetrics(
  tariffRatePct: number,
  baseMarginErosionAt25: number
): { marginErosionPct: number; confidenceScore: number } {
  const factor = tariffRatePct / 25;
  const marginErosionPct = Math.min(35, Math.round((baseMarginErosionAt25 * factor) * 10) / 10);
  const confidenceScore = Math.max(0, Math.round(100 - tariffRatePct * 1.8));
  return { marginErosionPct, confidenceScore };
}
