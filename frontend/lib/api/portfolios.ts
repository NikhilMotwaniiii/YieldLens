import { apiRequest } from "@/lib/api/client";
import type { ImportResult, Portfolio, PortfolioDetail, Position } from "@/types/api";

export type PositionPayload = {
  isin?: string;
  bond?: Record<string, unknown>;
  quantity: number;
  purchase_price?: number | null;
  purchase_date?: string | null;
  manual_current_price?: number | null;
};

export function listPortfolios() {
  return apiRequest<Portfolio[]>("/api/v1/portfolios");
}

export function createPortfolio(name: string) {
  return apiRequest<Portfolio>("/api/v1/portfolios", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function ensureDemoPortfolio() {
  return apiRequest<Portfolio>("/api/v1/portfolios/demo", { method: "POST" });
}

export function getPortfolio(id: number) {
  return apiRequest<PortfolioDetail>(`/api/v1/portfolios/${id}`);
}

export function updatePortfolio(id: number, name: string) {
  return apiRequest<Portfolio>(`/api/v1/portfolios/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name })
  });
}

export function addPosition(portfolioId: number, payload: PositionPayload) {
  return apiRequest<Position>(`/api/v1/portfolios/${portfolioId}/positions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePosition(portfolioId: number, positionId: number, payload: Partial<PositionPayload>) {
  return apiRequest<Position>(`/api/v1/portfolios/${portfolioId}/positions/${positionId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePosition(portfolioId: number, positionId: number) {
  return apiRequest<void>(`/api/v1/portfolios/${portfolioId}/positions/${positionId}`, {
    method: "DELETE"
  });
}

export function importCsv(portfolioId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<ImportResult>(`/api/v1/portfolios/${portfolioId}/import`, {
    method: "POST",
    body: formData
  });
}

export function csvTemplateUrl(portfolioId: number) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/v1/portfolios/${portfolioId}/import/template`;
}
