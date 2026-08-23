"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ExposureChart } from "@/components/charts/ExposureChart";
import { GainLossChart } from "@/components/charts/GainLossChart";
import { MaturityChart } from "@/components/charts/MaturityChart";
import { AddBondDrawer } from "@/components/bonds/AddBondDrawer";
import { CsvImportDialog } from "@/components/portfolio/CsvImportDialog";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { Button } from "@/components/ui/button";
import { deletePosition, getPortfolio, updatePortfolio } from "@/lib/api/portfolios";
import { getAnalytics } from "@/lib/api/analytics";
import { formatDate, formatInr, formatInrCompact, formatPercent } from "@/lib/formatting/numbers";
import type { TopPosition } from "@/types/api";

export function PortfolioDashboard({ portfolioId }: { portfolioId: number }) {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");

  const portfolioQuery = useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => getPortfolio(portfolioId)
  });
  const analyticsQuery = useQuery({
    queryKey: ["analytics", portfolioId],
    queryFn: () => getAnalytics(portfolioId)
  });
  const removeMutation = useMutation({
    mutationFn: (positionId: number) => deletePosition(portfolioId, positionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["analytics", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["scenario", portfolioId] });
    }
  });
  const renameMutation = useMutation({
    mutationFn: (name: string) => updatePortfolio(portfolioId, name),
    onSuccess: () => {
      setEditingName(false);
      void queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
    }
  });

  const portfolio = portfolioQuery.data;
  const analytics = analyticsQuery.data;

  useEffect(() => {
    if (portfolio && !editingName) {
      setPortfolioName(portfolio.name);
    }
  }, [editingName, portfolio]);

  if (portfolioQuery.isLoading || analyticsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (portfolioQuery.isError || analyticsQuery.isError || !portfolio || !analytics) {
    return (
      <main className="min-h-screen bg-paper px-6 py-8">
        <div className="mx-auto max-w-7xl rounded-md border border-line bg-panel p-6 shadow-panel">
          <h1 className="text-xl font-semibold">Unable to load portfolio analytics.</h1>
          <p className="mt-2 text-sm text-muted">Try again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-md bg-night p-5 text-panel shadow-desk md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-sm border border-panel/15 bg-panel/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b9d8d2]">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                YieldLens
              </div>
              {editingName ? (
                <form className="mt-4 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleRenameSubmit}>
                  <label className="sr-only" htmlFor="portfolio-name">
                    Portfolio name
                  </label>
                  <input
                    id="portfolio-name"
                    className="h-12 min-w-0 flex-1 rounded-md border border-panel/25 bg-panel px-3 text-xl font-semibold text-night shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:text-2xl"
                    value={portfolioName}
                    onChange={(event) => setPortfolioName(event.target.value)}
                    maxLength={200}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button className="h-10 px-3" variant="onDark" disabled={renameMutation.isPending || portfolioName.trim().length < 2}>
                      <Check size={16} />
                      Save
                    </Button>
                    <Button
                      className="h-10 px-3"
                      type="button"
                      variant="onDarkGhost"
                      onClick={() => {
                        setEditingName(false);
                        setPortfolioName(portfolio.name);
                      }}
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">{portfolio.name}</h1>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-panel/20 text-[#d7ddcf] transition hover:bg-panel/15 hover:text-panel"
                    onClick={() => {
                      setPortfolioName(portfolio.name);
                      setEditingName(true);
                    }}
                    aria-label="Edit portfolio name"
                    title="Edit portfolio name"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
              {renameMutation.isError ? (
                <p className="mt-2 text-sm text-[#ffbeb7]">
                  {renameMutation.error instanceof Error ? renameMutation.error.message : "Unable to rename portfolio"}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[#bfc6bd]">
                {analytics.position_count} bonds • Last updated {formatDate(portfolio.updated_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="onDark" onClick={() => setDrawerOpen(true)}>
                <Plus size={17} />
                Add Bond
              </Button>
              <Button variant="onDarkGhost" onClick={() => setImportOpen(true)}>
                <Upload size={17} />
                Import CSV
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-2 border-t border-panel/10 pt-4 text-xs text-[#bfc6bd] sm:grid-cols-3">
            <p>Valuation lens: market price per unit</p>
            <p>Risk lens: duration and DV01</p>
            <p>Return lens: unrealized gain/loss</p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Portfolio Value" value={formatInr(analytics.portfolio_value)} detail={`Across ${analytics.position_count} positions`} />
          <MetricCard
            label="Unrealized Gain/Loss"
            value={formatInr(analytics.gain_loss.unrealized_gain_loss)}
            detail={`Return on cost: ${formatPercent(analytics.gain_loss.unrealized_gain_loss_percent)} • Coverage: ${formatPercent(analytics.gain_loss.coverage_percent)}`}
          />
          <MetricCard label="Weighted Yield" value={formatPercent(analytics.weighted_yield.value)} detail={`${formatPercent(analytics.weighted_yield.coverage_percent)} coverage`} />
          <MetricCard label="Avg Duration" value={analytics.weighted_duration.value ? `${analytics.weighted_duration.value} yrs` : "Not available"} detail={`${formatPercent(analytics.weighted_duration.coverage_percent)} coverage`} />
          <MetricCard label="Portfolio DV01" value={formatInrCompact(analytics.portfolio_dv01)} detail="Approximate 1 bp sensitivity" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-line bg-panel p-5 shadow-panel">
            <div className="grid gap-5 lg:grid-cols-2">
              <ExposureChart title="Credit Rating Exposure" data={analytics.rating_exposure} />
              <ExposureChart title="Sector Exposure" data={analytics.sector_exposure} />
            </div>
            <div className="mt-6">
              <MaturityChart data={analytics.maturity_distribution} />
            </div>
          </div>
          <ScenarioPanel portfolioId={portfolioId} />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <GainLossChart data={analytics.gain_loss_contributors} />
          <div className="rounded-md border border-line bg-panel p-5 shadow-panel">
            <h2 className="text-base font-semibold">Issuer Exposure</h2>
            <div className="mt-4 space-y-4">
              {analytics.issuer_exposure.map((issuer) => (
                <div key={issuer.name}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="font-medium">{issuer.name}</span>
                    <span className="text-muted">{formatPercent(issuer.percent)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-paper">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${issuer.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <PositionsTable
            positions={analytics.top_positions}
            onDelete={(positionId) => removeMutation.mutate(positionId)}
            deletingId={removeMutation.variables}
          />
        </section>

        <footer className="py-8 text-xs leading-5 text-muted">
          Scenario results are simplified estimates based on duration sensitivity and are not a full
          bond-pricing or institutional risk model. YieldLens is not affiliated with BlackRock, NSE,
          BSE, or any bond-data provider.
        </footer>
      </div>

      <AddBondDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} portfolioId={portfolioId} />
      <CsvImportDialog open={importOpen} onClose={() => setImportOpen(false)} portfolioId={portfolioId} />
    </main>
  );

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!portfolio) return;
    const trimmed = portfolioName.trim();
    if (trimmed.length < 2 || trimmed === portfolio.name) {
      setEditingName(false);
      setPortfolioName(portfolio.name);
      return;
    }
    renameMutation.mutate(trimmed);
  }
}

function PositionsTable({
  positions,
  onDelete,
  deletingId
}: {
  positions: TopPosition[];
  onDelete: (positionId: number) => void;
  deletingId?: number;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel shadow-panel">
      <div className="flex flex-col gap-2 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Bond Positions</h2>
        <span className="text-xs text-muted">Gain/Loss = market value - purchase cost</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-night text-xs uppercase text-[#c9d0c6]">
            <tr>
              <th className="px-4 py-3">Bond</th>
              <th className="px-4 py-3">Coupon</th>
              <th className="px-4 py-3">Maturity</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Gain/Loss</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {positions.map((position) => (
              <tr key={position.position_id} className="transition hover:bg-paper/70">
                <td className="max-w-[320px] px-4 py-4">
                  <div className="font-medium">{position.security_name}</div>
                  <div className="mt-1 text-xs text-muted">
                    {position.issuer} • {position.isin}
                  </div>
                </td>
                <td className="px-4 py-4">{formatPercent(position.coupon_rate)}</td>
                <td className="px-4 py-4">{formatDate(position.maturity_date)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-sm border border-line bg-paper px-2 py-1 text-xs font-semibold">
                    {position.credit_rating ?? "Unrated"}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold">{formatInr(position.market_value)}</td>
                <td className={`px-4 py-4 font-semibold ${gainLossClass(position.unrealized_gain_loss)}`}>
                  {position.unrealized_gain_loss === null
                    ? "Not available"
                    : `${formatInr(position.unrealized_gain_loss)} (${formatPercent(position.unrealized_gain_loss_percent)})`}
                </td>
                <td className="px-4 py-4">{formatPercent(position.portfolio_weight_percent)}</td>
                <td className="px-4 py-4">{position.duration ?? "Not available"}</td>
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="danger"
                    className="h-8 px-3"
                    onClick={() => onDelete(position.position_id)}
                    disabled={deletingId === position.position_id}
                  >
                    {deletingId === position.position_id ? "Removing" : "Remove"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function gainLossClass(value: TopPosition["unrealized_gain_loss"]) {
  if (value === null) return "text-muted";
  return Number(value) >= 0 ? "text-accent" : "text-loss";
}

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-paper px-4 py-5 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-20 animate-pulse rounded-md bg-night" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-md bg-panel" />
          ))}
        </div>
        <div className="mt-6 h-96 animate-pulse rounded-md bg-panel" />
      </div>
    </main>
  );
}
