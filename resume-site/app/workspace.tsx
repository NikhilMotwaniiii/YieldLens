"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bond, bonds } from "@/lib/bonds";

type Portfolio = {
  id: number;
  clientId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Position = {
  id: number;
  portfolioId: number;
  isin: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string | null;
};

type PositionRow = Position & {
  bond: Bond;
  marketValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
};

type PortfolioState = {
  portfolio: Portfolio | null;
  positions: Position[];
};

const samplePositions = [
  ["INE001A08024", 2, 1002],
  ["INE733E07AA8", 4, 992],
  ["INE031B07AA9", 3, 999],
  ["INE414G07AA6", 2, 995],
] as const;

function getClientId() {
  const key = "yieldlens-hosted-client-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  window.localStorage.setItem(key, generated);
  return generated;
}

function formatInr(value: number) {
  return `INR ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPct(value: number) {
  return `${value.toFixed(2)}%`;
}

function maturityBucket(maturity: string) {
  const years = Math.max(0, (new Date(`${maturity}T00:00:00`).getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000));
  if (years < 1) return "< 1 year";
  if (years < 3) return "1-3 years";
  if (years < 5) return "3-5 years";
  if (years < 10) return "5-10 years";
  return "10+ years";
}

export function Workspace() {
  const [clientId, setClientId] = useState("");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [portfolioState, setPortfolioState] = useState<PortfolioState>({ portfolio: null, positions: [] });
  const [selectedBond, setSelectedBond] = useState(bonds[0]);
  const [query, setQuery] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [units, setUnits] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState(String(bonds[0].faceValue));
  const [currentPrice, setCurrentPrice] = useState(String(bonds[0].price));
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState("Loading your workspaces...");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-yieldlens-client": clientId,
    }),
    [clientId]
  );

  const rows = useMemo(
    () =>
      portfolioState.positions
        .map((position) => {
          const bond = bonds.find((item) => item.isin === position.isin);
          if (!bond) return null;
          const marketValue = position.units * position.currentPrice;
          const costBasis = position.units * position.purchasePrice;
          const gainLoss = marketValue - costBasis;
          return {
            ...position,
            bond,
            marketValue,
            costBasis,
            gainLoss,
            gainLossPercent: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
          };
        })
        .filter(Boolean) as PositionRow[],
    [portfolioState.positions]
  );

  const analytics = useMemo(() => {
    const totalValue = rows.reduce((sum, row) => sum + row.marketValue, 0);
    const costBasis = rows.reduce((sum, row) => sum + row.costBasis, 0);
    const gainLoss = rows.reduce((sum, row) => sum + row.gainLoss, 0);
    const weightedYield = totalValue ? rows.reduce((sum, row) => sum + row.marketValue * row.bond.yield, 0) / totalValue : 0;
    const duration = totalValue ? rows.reduce((sum, row) => sum + row.marketValue * row.bond.duration, 0) / totalValue : 0;
    return {
      totalValue,
      costBasis,
      gainLoss,
      gainLossPercent: costBasis ? (gainLoss / costBasis) * 100 : 0,
      weightedYield,
      duration,
      dv01: rows.reduce((sum, row) => sum + row.marketValue * row.bond.duration * 0.0001, 0),
    };
  }, [rows]);

  const filteredBonds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return bonds.slice(0, 12);
    return bonds
      .filter((bond) =>
        [bond.isin, bond.issuer, bond.securityName, bond.rating, bond.sector].some((value) =>
          value.toLowerCase().includes(normalized)
        )
      )
      .slice(0, 12);
  }, [query]);

  useEffect(() => {
    setClientId(getClientId());
  }, []);

  useEffect(() => {
    if (!clientId) return;
    void loadPortfolios();
  }, [clientId]);

  useEffect(() => {
    if (!clientId || activeId === null) return;
    void loadPortfolio(activeId);
  }, [activeId, clientId]);

  useEffect(() => {
    setPurchasePrice(String(selectedBond.faceValue));
    setCurrentPrice(String(selectedBond.price));
    setUnits("1");
  }, [selectedBond]);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, { ...init, headers: { ...headers, ...init?.headers } });
    const body = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(body.error || "Request failed");
    return body;
  }

  async function loadPortfolios() {
    try {
      const body = await api<{ portfolios: Portfolio[] }>("/api/portfolios");
      setPortfolios(body.portfolios);
      if (body.portfolios.length && activeId === null) {
        setActiveId(body.portfolios[0].id);
      } else if (!body.portfolios.length) {
        setStatus("Create a portfolio to begin.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load portfolios.");
    }
  }

  async function loadPortfolio(id: number) {
    try {
      const body = await api<PortfolioState>(`/api/portfolios/${id}/positions`);
      setPortfolioState(body);
      setNameDraft(body.portfolio?.name ?? "");
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load portfolio.");
    }
  }

  async function createPortfolio() {
    const body = await api<{ portfolio: Portfolio }>("/api/portfolios", {
      method: "POST",
      body: JSON.stringify({ name: "New Bond Workspace" }),
    });
    setPortfolios((current) => [body.portfolio, ...current]);
    setActiveId(body.portfolio.id);
  }

  async function renamePortfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!portfolioState.portfolio) return;
    const name = nameDraft.trim();
    if (name.length < 2) return;
    const body = await api<{ portfolio: Portfolio }>(`/api/portfolios/${portfolioState.portfolio.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setPortfolioState((current) => ({ ...current, portfolio: body.portfolio }));
    setPortfolios((current) => current.map((item) => (item.id === body.portfolio.id ? body.portfolio : item)));
  }

  async function deletePortfolio() {
    if (!portfolioState.portfolio) return;
    await api(`/api/portfolios/${portfolioState.portfolio.id}`, { method: "DELETE" });
    const remaining = portfolios.filter((item) => item.id !== portfolioState.portfolio?.id);
    setPortfolios(remaining);
    setPortfolioState({ portfolio: null, positions: [] });
    setActiveId(remaining[0]?.id ?? null);
  }

  async function addPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!portfolioState.portfolio) return;
    await api(`/api/portfolios/${portfolioState.portfolio.id}/positions`, {
      method: "POST",
      body: JSON.stringify({
        isin: selectedBond.isin,
        units: Number(units),
        purchasePrice: Number(purchasePrice),
        currentPrice: Number(currentPrice),
        purchaseDate,
      }),
    });
    await loadPortfolio(portfolioState.portfolio.id);
    await loadPortfolios();
  }

  async function loadSample() {
    if (!portfolioState.portfolio) {
      await createPortfolio();
      return;
    }
    for (const [isin, sampleUnits, samplePurchasePrice] of samplePositions) {
      const bond = bonds.find((item) => item.isin === isin);
      if (!bond) continue;
      await api(`/api/portfolios/${portfolioState.portfolio.id}/positions`, {
        method: "POST",
        body: JSON.stringify({ isin, units: sampleUnits, purchasePrice: samplePurchasePrice, currentPrice: bond.price }),
      });
    }
    await loadPortfolio(portfolioState.portfolio.id);
  }

  async function removePosition(id: number) {
    if (!portfolioState.portfolio) return;
    await api(`/api/portfolios/${portfolioState.portfolio.id}/positions/${id}`, { method: "DELETE" });
    await loadPortfolio(portfolioState.portfolio.id);
  }

  return (
    <main className="app-shell">
      <aside className="portfolio-rail">
        <div className="brand-block">
          <span>YieldLens</span>
          <strong>Bond analytics desk</strong>
        </div>
        <button className="primary-action" onClick={createPortfolio}>New portfolio</button>
        <div className="rail-list">
          {portfolios.map((portfolio) => (
            <button
              className={portfolio.id === activeId ? "rail-item active" : "rail-item"}
              key={portfolio.id}
              onClick={() => setActiveId(portfolio.id)}
            >
              <strong>{portfolio.name}</strong>
              <small>{new Date(portfolio.updatedAt).toLocaleDateString("en-IN")}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">Persisted hosted workspace</span>
            <h1>{portfolioState.portfolio?.name ?? "Create your first bond portfolio"}</h1>
            <p>Portfolios and positions are stored in the hosted backend database for this browser.</p>
          </div>
          <div className="header-actions">
            <button className="ghost-action" onClick={loadSample}>Load sample</button>
            <button className="danger-action" onClick={deletePortfolio} disabled={!portfolioState.portfolio}>Delete</button>
          </div>
        </header>

        {status ? <div className="status-card">{status}</div> : null}

        {portfolioState.portfolio ? (
          <>
            <section className="control-strip">
              <form className="name-form" onSubmit={renamePortfolio}>
                <label>
                  Portfolio name
                  <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
                </label>
                <button className="dark-action">Save name</button>
              </form>
              <form className="add-form" onSubmit={addPosition}>
                <label>
                  Search bond
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Issuer, ISIN, rating..." />
                </label>
                <div className="bond-picker">
                  {filteredBonds.map((bond) => (
                    <button
                      type="button"
                      className={bond.isin === selectedBond.isin ? "bond-choice selected" : "bond-choice"}
                      key={bond.isin}
                      onClick={() => setSelectedBond(bond)}
                    >
                      <strong>{bond.issuer}</strong>
                      <small>{bond.coupon.toFixed(2)}% • {bond.maturity} • {bond.rating}</small>
                    </button>
                  ))}
                </div>
                <div className="position-grid">
                  <label>Units<input type="number" min="0.0001" step="0.0001" value={units} onChange={(event) => setUnits(event.target.value)} /></label>
                  <label>Purchase Price per Unit<input type="number" min="0" step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} /></label>
                  <label>Current Price per Unit<input type="number" min="0" step="0.01" value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} /></label>
                  <label>Purchase Date<input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></label>
                </div>
                <p className="field-note">Current price is per unit and prefilled from demo reference data. Edit it if your market view is different.</p>
                <button className="primary-action">Add bond</button>
              </form>
            </section>

            <section className="metrics-grid">
              <Metric label="Portfolio Value" value={formatInr(analytics.totalValue)} note={`${rows.length} positions`} />
              <Metric label="Unrealized Gain/Loss" value={formatInr(analytics.gainLoss)} note={`Return on cost ${formatPct(analytics.gainLossPercent)}`} tone={analytics.gainLoss >= 0 ? "gain" : "loss"} />
              <Metric label="Weighted Yield" value={formatPct(analytics.weightedYield)} note="Market-value weighted" />
              <Metric label="Avg Duration" value={`${analytics.duration.toFixed(2)} yrs`} note="Duration-weighted risk" />
              <Metric label="DV01" value={formatInr(analytics.dv01)} note="Approx. 1 bp sensitivity" />
            </section>

            <section className="analysis-grid">
              <BarCard title="Credit Exposure" data={groupRows(rows, (row) => row.bond.rating)} />
              <BarCard title="Sector Exposure" data={groupRows(rows, (row) => row.bond.sector)} tone="brass" />
              <BarCard title="Maturity Buckets" data={groupRows(rows, (row) => maturityBucket(row.bond.maturity), ["< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"])} tone="copper" />
              <ScenarioCard value={analytics.totalValue} duration={analytics.duration} />
            </section>

            <section className="positions-card">
              <div className="section-title">
                <h2>Positions</h2>
                <span>Gain/Loss = market value - cost basis</span>
              </div>
              <Positions rows={rows} onRemove={removePosition} />
            </section>
          </>
        ) : (
          <button className="primary-action empty-create" onClick={createPortfolio}>Create portfolio</button>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "gain" | "loss" }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong className={tone ?? ""}>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function groupRows(rows: PositionRow[], labelFor: (row: PositionRow) => string, order?: string[]) {
  const total = rows.reduce((sum, row) => sum + row.marketValue, 0);
  const grouped = new Map<string, number>();
  rows.forEach((row) => grouped.set(labelFor(row), (grouped.get(labelFor(row)) ?? 0) + row.marketValue));
  const result = [...grouped.entries()].map(([label, value]) => ({ label, value, percent: total ? (value / total) * 100 : 0 }));
  if (order) return result.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return result.sort((a, b) => b.value - a.value);
}

function BarCard({ title, data, tone = "teal" }: { title: string; data: { label: string; percent: number }[]; tone?: string }) {
  return (
    <article className="chart-card">
      <h2>{title}</h2>
      {data.length ? data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="track"><i className={tone} style={{ width: `${Math.min(100, item.percent)}%` }} /></div>
          <strong>{formatPct(item.percent)}</strong>
        </div>
      )) : <p className="empty-copy">Add positions to populate this chart.</p>}
    </article>
  );
}

function ScenarioCard({ value, duration }: { value: number; duration: number }) {
  return (
    <article className="chart-card">
      <h2>Rate Scenarios</h2>
      <div className="scenario-list">
        {[-100, -50, 50, 100].map((bps) => {
          const change = -(value * duration * (bps / 10000));
          return (
            <div className="scenario-item" key={bps}>
              <span>{bps > 0 ? "+" : ""}{bps} bps</span>
              <strong className={change >= 0 ? "gain" : "loss"}>{formatInr(change)}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function Positions({ rows, onRemove }: { rows: PositionRow[]; onRemove: (id: number) => void }) {
  if (!rows.length) return <p className="empty-copy">No positions yet. Add a bond or load the sample portfolio.</p>;

  const total = rows.reduce((sum, row) => sum + row.marketValue, 0);
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Bond</th>
            <th>Units</th>
            <th>Market Value</th>
            <th>Gain/Loss</th>
            <th>Weight</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td><strong>{row.bond.securityName}</strong><small>{row.bond.isin} • {row.bond.rating} • {row.bond.sector}</small></td>
              <td>{row.units}</td>
              <td>{formatInr(row.marketValue)}<small>{formatInr(row.currentPrice)} / unit</small></td>
              <td className={row.gainLoss >= 0 ? "gain" : "loss"}>{formatInr(row.gainLoss)}<small>{formatPct(row.gainLossPercent)}</small></td>
              <td>{formatPct(total ? (row.marketValue / total) * 100 : 0)}</td>
              <td><button className="remove-action" onClick={() => onRemove(row.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
