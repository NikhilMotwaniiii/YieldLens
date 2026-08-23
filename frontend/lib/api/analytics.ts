import { apiRequest } from "@/lib/api/client";
import type { InterestRateScenario, PortfolioAnalytics } from "@/types/api";

export function getAnalytics(portfolioId: number) {
  return apiRequest<PortfolioAnalytics>(`/api/v1/portfolios/${portfolioId}/analytics`);
}

export function runInterestRateScenario(portfolioId: number, shockBps: number) {
  return apiRequest<InterestRateScenario>(`/api/v1/portfolios/${portfolioId}/scenarios/interest-rate`, {
    method: "POST",
    body: JSON.stringify({ shock_bps: shockBps })
  });
}

