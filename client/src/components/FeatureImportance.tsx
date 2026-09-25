import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain } from "lucide-react";

interface Levers {
  ev_adoption_pct: number;
  solar_adoption_pct: number;
  trees_planted_pct: number;
  plastic_recycling_pct: number;
  public_transport_usage_pct: number;
}

interface Props {
  levers: Levers;
  baselineLevers: Levers;
}

// Mirrors server COEFF weights for CO₂ impact
const IMPORTANCE = {
  ev_adoption_pct:             { label: "EV Adoption",       co2: 9,  aqi: 3.5 },
  public_transport_usage_pct:  { label: "Public Transport",  co2: 7,  aqi: 2.5 },
  solar_adoption_pct:          { label: "Solar Adoption",    co2: 4,  aqi: 0.5 },
  trees_planted_pct:           { label: "Trees Planted",     co2: 3,  aqi: 1.8 },
  plastic_recycling_pct:       { label: "Plastic Recycling", co2: 1,  aqi: 0.3 },
};

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export function FeatureImportance({ levers, baselineLevers }: Props) {
  const totalCo2Weight = Object.values(IMPORTANCE).reduce((s, v) => s + v.co2, 0);
  const totalAqiWeight = Object.values(IMPORTANCE).reduce((s, v) => s + v.aqi, 0);

  const data = Object.entries(IMPORTANCE).map(([key, meta], i) => {
    const delta = Math.max(0, (levers as any)[key] - (baselineLevers as any)[key]);
    const co2Contribution = (meta.co2 / totalCo2Weight) * 100;
    const aqiContribution = (meta.aqi / totalAqiWeight) * 100;
    const leverActivity = delta > 0 ? 1 : 0.3; // dim inactive levers
    return {
      name: meta.label,
      "CO₂ Impact": Math.round(co2Contribution * leverActivity),
      "AQI Impact": Math.round(aqiContribution * leverActivity),
      color: COLORS[i],
    };
  }).sort((a, b) => b["CO₂ Impact"] - a["CO₂ Impact"]);

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-indigo-600" /> Explainable AI — Factor Importance
        </CardTitle>
        <p className="text-xs text-slate-500">Why did the model predict this? Top drivers of CO₂ &amp; AQI change.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">CO₂ Reduction Drivers</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Bar dataKey="CO₂ Impact" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AQI Improvement Drivers</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Bar dataKey="AQI Impact" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.75} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-slate-400 italic">
          Importance scores reflect model coefficients. Levers not moved from baseline are shown dimmed.
        </p>
      </CardContent>
    </Card>
  );
}
