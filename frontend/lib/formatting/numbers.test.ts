import { describe, expect, it } from "vitest";
import { formatInr, formatInrCompact, formatPercent } from "@/lib/formatting/numbers";

describe("number formatting", () => {
  it("formats INR using Indian separators", () => {
    expect(formatInr(125000)).toBe("₹1,25,000");
    expect(formatInr(12000000)).toBe("₹1,20,00,000");
  });

  it("formats compact dashboard values", () => {
    expect(formatInrCompact(2480000)).toBe("₹24.8L");
    expect(formatInrCompact(21000000)).toBe("₹2.1Cr");
  });

  it("formats missing percentages as unavailable", () => {
    expect(formatPercent(null)).toBe("Not available");
  });
});

