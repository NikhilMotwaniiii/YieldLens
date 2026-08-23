import type { Numeric } from "@/types/api";

export function asNumber(value: Numeric | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatInr(value: Numeric | null | undefined) {
  const parsed = asNumber(value);
  if (parsed === null) return "Not available";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(parsed);
}

export function formatInrCompact(value: Numeric | null | undefined) {
  const parsed = asNumber(value);
  if (parsed === null) return "Not available";
  const abs = Math.abs(parsed);
  if (abs >= 10_000_000) return `₹${(parsed / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `₹${(parsed / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(parsed / 1_000).toFixed(1)}K`;
  return formatInr(parsed);
}

export function formatPercent(value: Numeric | null | undefined, suffix = "%") {
  const parsed = asNumber(value);
  if (parsed === null) return "Not available";
  return `${parsed.toFixed(2)}${suffix}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

