"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { GainLossItem } from "@/types/api";
import { asNumber, formatInr, formatInrCompact, formatPercent } from "@/lib/formatting/numbers";

type ChartDatum = {
  name: string;
  isin: string;
  value: number;
  percent: GainLossItem["unrealized_gain_loss_percent"];
  fill: string;
};

export function GainLossChart({ data }: { data: GainLossItem[] }) {
  const chartData: ChartDatum[] = data.map((item) => ({
    name: item.issuer,
    isin: item.isin,
    value: asNumber(item.unrealized_gain_loss) ?? 0,
    percent: item.unrealized_gain_loss_percent,
    fill: (asNumber(item.unrealized_gain_loss) ?? 0) >= 0 ? "#00897b" : "#c8463f"
  }));

  if (!chartData.length) {
    return (
      <div className="rounded-md border border-line bg-panel p-5 shadow-panel">
        <h2 className="text-base font-semibold">Gain/Loss Contributors</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Add purchase price per unit for positions to see unrealized gain/loss contributors.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Gain/Loss Contributors</h2>
        <span className="rounded-sm bg-paper px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Return
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">Based on current value minus purchase cost for positions with purchase price.</p>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
            <CartesianGrid stroke="#ded9cb" horizontal={false} />
            <XAxis type="number" tickFormatter={formatInrCompact} fontSize={12} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              fontSize={12}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}...` : value)}
            />
            <ReferenceLine x={0} stroke="#8b8f86" />
            <Tooltip content={<GainLossTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.isin} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GainLossTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const datum = payload[0].payload as ChartDatum | undefined;
  if (!datum) return null;

  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2 text-xs shadow-panel">
      <div className="font-semibold text-ink">{datum.isin}</div>
      <div className="mt-1 text-muted">Unrealized gain/loss</div>
      <div className={datum.value >= 0 ? "font-semibold text-accent" : "font-semibold text-loss"}>
        {formatInr(datum.value)} ({formatPercent(datum.percent)})
      </div>
    </div>
  );
}
