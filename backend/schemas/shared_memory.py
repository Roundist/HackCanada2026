from __future__ import annotations

from pydantic import BaseModel


class SupplyChainInput(BaseModel):
    name: str
    description: str
    country_of_origin: str
    hs_code: str | None = None
    estimated_annual_spend: float
    is_us_sourced: bool
    criticality: str  # low / medium / high


class Product(BaseModel):
    name: str
    inputs_used: list[str]
    estimated_annual_revenue: float
    primary_market: str  # Canada / US / Both


class SupplyChainMap(BaseModel):
    business_name: str
    industry: str
    annual_revenue_estimate: float
    inputs: list[SupplyChainInput]
    products: list[Product]


class InputImpact(BaseModel):
    input_name: str
    hs_code: str
    current_tariff_rate: float
    annual_spend: float
    annual_tariff_cost: float
    pct_of_total_exposure: float


class ProductImpact(BaseModel):
    product_name: str
    current_margin_pct: float
    margin_after_tariff_pct: float
    margin_erosion_pct: float
    break_even_price_increase_pct: float
    break_even_tariff_rate_pct: float
    is_profitable_after_tariff: bool


class TariffScenario(BaseModel):
    tariff_rate_pct: float
    total_tariff_cost: float
    total_margin_erosion_pct: float
    products_unprofitable: int


class TariffImpact(BaseModel):
    total_tariff_exposure: float
    total_margin_erosion_pct: float
    risk_level: str  # low / medium / high / critical
    input_impacts: list[InputImpact]
    product_impacts: list[ProductImpact]
    scenarios: list[TariffScenario]


class CanadianAlternative(BaseModel):
    supplier_category: str
    region: str
    estimated_cost: float
    cost_vs_us_pretariff_pct: float
    cost_vs_us_posttariff_pct: float
    switching_feasibility: str
    lead_time_weeks: int
    notes: str
    directory_to_search: str = ""


class InternationalAlternative(BaseModel):
    country: str
    supplier_category: str
    estimated_cost: float
    notes: str


class SupplierAlternative(BaseModel):
    for_input: str
    current_us_cost: float
    current_us_cost_with_tariff: float
    canadian_alternatives: list[CanadianAlternative]
    international_alternatives: list[InternationalAlternative]
    recommendation: str


class AlternativeSuppliers(BaseModel):
    alternatives: list[SupplierAlternative]
    total_potential_savings: float
    priority_switches: list[str]


class TariffChangeSignal(BaseModel):
    direction: str
    magnitude_estimate_pct: float | None = None
    timeline: str
    probability: str


class RelevantArticle(BaseModel):
    title: str
    source: str
    published: str
    url: str
    relevance_to_business: str
    affected_inputs: list[str]
    affected_hs_codes: list[str]
    sentiment: str
    tariff_change_signal: TariffChangeSignal | None = None


class IndustryRiskAdjustment(BaseModel):
    industry: str
    base_risk: str
    adjusted_risk: str
    reason: str


class ActionableAlert(BaseModel):
    urgency: str
    alert: str
    source_article: str
    deadline: str | None = None


class GeopoliticalContext(BaseModel):
    analysis_timestamp: str
    news_window: str
    overall_escalation_risk: str
    risk_trend: str
    headline_summary: str
    relevant_articles: list[RelevantArticle]
    industry_risk_adjustments: list[IndustryRiskAdjustment]
    actionable_alerts: list[ActionableAlert]
    trade_agreement_updates: list[str]
    government_program_updates: list[str]


class PriorityAction(BaseModel):
    rank: int
    action: str
    description: str
    estimated_savings: float
    implementation_effort: str
    timeline_days: int
    category: str


class PriceIncrease(BaseModel):
    product: str
    increase_pct: float
    rationale: str


class PricingStrategy(BaseModel):
    recommendation: str
    explanation: str
    suggested_price_increases: list[PriceIncrease]


class MarketDiversification(BaseModel):
    current_us_export_pct: float
    recommendations: list[str]
    government_programs: list[str]


class Timeline(BaseModel):
    days_30: list[str]
    days_60: list[str]
    days_90: list[str]


class Risk(BaseModel):
    risk: str
    probability: str
    mitigation: str


class ExecutiveSummary(BaseModel):
    business_name: str
    total_tariff_exposure: float
    risk_level: str
    headline: str
    key_finding: str


class SurvivalPlan(BaseModel):
    executive_summary: ExecutiveSummary
    priority_actions: list[PriorityAction]
    pricing_strategy: PricingStrategy
    market_diversification: MarketDiversification
    timeline: Timeline
    risks: list[Risk]
