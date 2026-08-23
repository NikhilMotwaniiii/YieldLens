"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ExposureItem } from "@/types/api";
import { asNumber, formatInr, formatPercent } from "@/lib/formatting/numbers";

const COLORS = ["#00897b", "#b8852f", "#4e6d79", "#a95f3d", "#6e7f4f", "#c8463f", "#6a5f8a"];

export function ExposureChart({ title, data }: { title: string; data: ExposureItem[] }) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: asNumber(item.market_value) ?? 0,
    percent: item.percent
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="rounded-sm bg-paper px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Exposure
        </span>
      </div>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatInr(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid gap-2 text-xs text-muted">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm shadow-[0_0_0_2px_rgba(255,250,240,0.9)]" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span>{formatPercent(item.percent)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
