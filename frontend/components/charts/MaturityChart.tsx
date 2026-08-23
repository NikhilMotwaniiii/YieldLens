"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MaturityBucket } from "@/types/api";
import { asNumber, formatInrCompact } from "@/lib/formatting/numbers";

export function MaturityChart({ data }: { data: MaturityBucket[] }) {
  const chartData = data.map((item) => ({
    bucket: item.bucket,
    value: asNumber(item.market_value) ?? 0
  }));
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Maturity Distribution</h2>
        <span className="rounded-sm bg-paper px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Time ladder
        </span>
      </div>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#ded9cb" vertical={false} />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={formatInrCompact} />
            <Tooltip formatter={(value) => formatInrCompact(Number(value))} />
            <Bar dataKey="value" fill="#00897b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
