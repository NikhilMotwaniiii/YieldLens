"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { runInterestRateScenario } from "@/lib/api/analytics";
import { formatInr, formatInrCompact, formatPercent } from "@/lib/formatting/numbers";

const SHOCKS = [-200, -100, -50, 50, 100, 200];

export function ScenarioPanel({ portfolioId }: { portfolioId: number }) {
  const [shock, setShock] = useState(100);
  const scenario = useQuery({
    queryKey: ["scenario", portfolioId, shock],
    queryFn: () => runInterestRateScenario(portfolioId, shock)
  });
  const data = scenario.data;
  const positive = data ? Number(data.estimated_change) >= 0 : false;

  return (
    <section className="rounded-md border border-night/20 bg-night p-5 text-panel shadow-desk">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Interest Rate Scenario</h2>
          <p className="mt-1 text-xs text-[#bfc6bd]">100 basis points = 1 percentage point</p>
        </div>
        {positive ? <TrendingUp className="text-[#7ce0c6]" size={20} /> : <TrendingDown className="text-[#ff9c91]" size={20} />}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {SHOCKS.map((item) => (
          <button
            key={item}
            onClick={() => setShock(item)}
            className={`h-9 rounded-md border px-3 text-sm font-semibold transition ${
              shock === item
                ? "border-panel bg-panel text-night"
                : "border-panel/15 bg-night-soft text-[#d7ddcf] hover:border-panel/30"
            }`}
          >
            {item > 0 ? `+${item}` : item} bps
          </button>
        ))}
      </div>

      {scenario.isLoading ? (
        <div className="mt-6 h-44 animate-pulse rounded-md bg-night-soft" />
      ) : scenario.isError || !data ? (
        <p className="mt-6 rounded-md border border-[#ff9c91]/40 bg-[#3a1f1c] p-3 text-sm text-[#ffbeb7]">
          Unable to run scenario.
        </p>
      ) : (
        <>
          <div className="mt-6 rounded-md border border-panel/10 bg-night-soft p-4">
            <p className="text-sm text-[#bfc6bd]">
              Rates {shock > 0 ? "+" : ""}
              {shock} bps
            </p>
            <p className={`tabular mt-2 text-4xl font-semibold ${positive ? "text-[#7ce0c6]" : "text-[#ff9c91]"}`}>
              {formatInr(data.estimated_change)}
            </p>
            <p className="mt-1 text-sm text-[#bfc6bd]">{formatPercent(data.estimated_change_percent)} estimated portfolio impact</p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[#bfc6bd]">Portfolio Value</p>
                <p className="font-semibold">
                  {formatInrCompact(data.current_portfolio_value)} to {formatInrCompact(data.estimated_portfolio_value)}
                </p>
              </div>
              <div>
                <p className="text-[#bfc6bd]">Coverage</p>
                <p className="font-semibold">{formatPercent(data.coverage_percent)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">Largest Contributors</h3>
            <div className="mt-3 space-y-3">
              {data.largest_impacts.map((impact) => (
                <div key={impact.bond_id} className="rounded-md border border-panel/10 bg-night-soft p-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="line-clamp-1 font-medium">{impact.security_name}</span>
                    <span className={Number(impact.estimated_change) >= 0 ? "text-[#7ce0c6]" : "text-[#ff9c91]"}>
                      {formatInr(impact.estimated_change)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#bfc6bd]">
                    {impact.isin} • {formatPercent(impact.estimated_change_percent)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="mt-5 text-xs leading-5 text-[#bfc6bd]">
        Approximation: estimated percentage price change is roughly negative duration multiplied by
        yield change. Bonds without duration are excluded and reported through coverage.
      </p>
    </section>
  );
}
