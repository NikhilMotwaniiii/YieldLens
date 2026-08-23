import { apiRequest } from "@/lib/api/client";
import type { BondSearchResult } from "@/types/api";

export function searchBonds(query: string) {
  return apiRequest<BondSearchResult[]>(`/api/v1/bonds/search?q=${encodeURIComponent(query)}`);
}

export function suggestBonds() {
  return apiRequest<BondSearchResult[]>("/api/v1/bonds/suggestions");
}
