export type Numeric = number | string;

export type Bond = {
  id: number;
  isin: string;
  issuer: string;
  security_name: string;
  coupon_rate: Numeric;
  maturity_date: string;
  face_value: Numeric;
  currency: "INR";
  credit_rating: string | null;
  sector: string | null;
  bond_type: string | null;
  duration: Numeric | null;
  latest_price: Numeric | null;
  latest_yield: Numeric | null;
  price_source: string | null;
  provider_name: string | null;
};

export type BondSearchResult = Omit<Bond, "id"> & {
  market_data_updated_at?: string | null;
  provider_identifier?: string | null;
  raw_provider_data?: Record<string, unknown> | null;
};

export type Position = {
  id: number;
  portfolio_id: number;
  bond: Bond;
  quantity: Numeric;
  purchase_price: Numeric | null;
  purchase_date: string | null;
  manual_current_price: Numeric | null;
  valuation_price: Numeric;
  valuation_price_source: string;
  market_value: Numeric;
  portfolio_weight_percent: Numeric | null;
  created_at: string;
  updated_at: string;
};

export type Portfolio = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type PortfolioDetail = Portfolio & {
  positions: Position[];
};

export type MetricWithCoverage = {
  value: Numeric | null;
  coverage_percent: Numeric;
};

export type ExposureItem = {
  name: string;
  market_value: Numeric;
  percent: Numeric;
};

export type MaturityBucket = {
  bucket: string;
  market_value: Numeric;
  percent: Numeric;
};

export type TopPosition = {
  position_id: number;
  bond_id: number;
  isin: string;
  issuer: string;
  security_name: string;
  coupon_rate: Numeric;
  maturity_date: string;
  credit_rating: string | null;
  latest_yield: Numeric | null;
  duration: Numeric | null;
  market_value: Numeric;
  cost_basis: Numeric | null;
  unrealized_gain_loss: Numeric | null;
  unrealized_gain_loss_percent: Numeric | null;
  portfolio_weight_percent: Numeric;
  valuation_price_source: string;
};

export type GainLossSummary = {
  total_cost_basis: Numeric;
  unrealized_gain_loss: Numeric;
  unrealized_gain_loss_percent: Numeric | null;
  coverage_percent: Numeric;
};

export type GainLossItem = {
  position_id: number;
  isin: string;
  issuer: string;
  security_name: string;
  market_value: Numeric;
  cost_basis: Numeric;
  unrealized_gain_loss: Numeric;
  unrealized_gain_loss_percent: Numeric;
};

export type PortfolioAnalytics = {
  portfolio_id: number;
  position_count: number;
  portfolio_value: Numeric;
  weighted_coupon: Numeric | null;
  weighted_yield: MetricWithCoverage;
  weighted_duration: MetricWithCoverage;
  portfolio_dv01: Numeric;
  gain_loss: GainLossSummary;
  nearest_maturity: string | null;
  furthest_maturity: string | null;
  rating_exposure: ExposureItem[];
  sector_exposure: ExposureItem[];
  issuer_exposure: ExposureItem[];
  maturity_distribution: MaturityBucket[];
  gain_loss_contributors: GainLossItem[];
  top_positions: TopPosition[];
};

export type ScenarioImpact = {
  bond_id: number;
  isin: string;
  security_name: string;
  current_value: Numeric;
  estimated_change: Numeric;
  estimated_change_percent: Numeric;
};

export type InterestRateScenario = {
  scenario_bps: number;
  current_portfolio_value: Numeric;
  estimated_portfolio_value: Numeric;
  estimated_change: Numeric;
  estimated_change_percent: Numeric;
  eligible_portfolio_value: Numeric;
  coverage_percent: Numeric;
  largest_impacts: ScenarioImpact[];
};

export type ImportResult = {
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
  errors: Array<{ row: number; field: string; message: string }>;
};
