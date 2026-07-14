"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { progress } from "@/data/catalog";

export function ProgressChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={progress}>
          <defs>
            <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F87AA2" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FDC7D7" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,122,162,.18)" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid #FDC7D7" }} />
          <Area type="monotone" dataKey="weight" stroke="#F87AA2" strokeWidth={3} fill="url(#glow)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
