import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Leaf } from "lucide-react";

interface Levers {
  ev_adoption_pct: number;
  solar_adoption_pct: number;
  trees_planted_pct: number;
  plastic_recycling_pct: number;
  public_transport_usage_pct: number;
}

interface Baseline extends Levers {}

interface Props {
  levers: Levers;
  baselineLevers: Baseline; // the lever values at simulation time (from simulationResult)
  greenScore: number;
  co2Reduction: number; // absolute MT reduction
  aqiReduction: number;
}

// Cost per 1% increase in each lever (₹ Crore)
const COST_PER_PCT = {
  ev: 1.1,
  solar: 0.9,
  trees: 0.15,
  recycling: 0.35,
  transport: 0.8,
};

const SDG_LIST = [
  { id: 7, label: "Affordable & Clean Energy", icon: "⚡", keys: ["solar_adoption_pct"] },
  { id: 11, label: "Sustainable Cities", icon: "🏙", keys: ["public_transport_usage_pct", "trees_planted_pct"] },
  { id: 12, label: "Responsible Consumption", icon: "♻️", keys: ["plastic_recycling_pct"] },
  { id: 13, label: "Climate Action", icon: "🌍", keys: ["ev_adoption_pct", "solar_adoption_pct", "public_transport_usage_pct"] },
];

function sdgScore(keys: string[], levers: Levers): number {
  const avg = keys.reduce((s, k) => s + (levers as any)[k], 0) / keys.length;
  return Math.min(100, Math.round(avg));
}

export function EconomicPanel({ levers, baselineLevers, greenScore, co2Reduction, aqiReduction }: Props) {
  const delta = {
    ev: Math.max(0, levers.ev_adoption_pct - baselineLevers.ev_adoption_pct),
    solar: Math.max(0, levers.solar_adoption_pct - baselineLevers.solar_adoption_pct),
    trees: Math.max(0, levers.trees_planted_pct - baselineLevers.trees_planted_pct),
    recycling: Math.max(0, levers.plastic_recycling_pct - baselineLevers.plastic_recycling_pct),
    transport: Math.max(0, levers.public_transport_usage_pct - baselineLevers.public_transport_usage_pct),
  };

  const costs = {
    "EV Infrastructure": Math.round(delta.ev * COST_PER_PCT.ev),
    "Solar Installation": Math.round(delta.solar * COST_PER_PCT.solar),
    "Urban Tree Program": Math.round(delta.trees * COST_PER_PCT.trees),
    "Recycling Infrastructure": Math.round(delta.recycling * COST_PER_PCT.recycling),
    "Public Transport": Math.round(delta.transport * COST_PER_PCT.transport),
  };
  const total = Object.values(costs).reduce((s, v) => s + v, 0);

  const sdgOverall = Math.round(
    SDG_LIST.reduce((s, sdg) => s + sdgScore(sdg.keys, levers), 0) / SDG_LIST.length
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Economic Cost */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base serif-heading">
            <IndianRupee className="h-4 w-4 text-primary" /> Estimated Investment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-bold text-primary">₹{total} Cr</p>
          <div className="space-y-1 pt-1">
            {Object.entries(costs).map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">₹{val} Cr</span>
              </div>
            ))}
          </div>
          {total > 0 && (
            <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
              CO₂ saved: <strong>{Math.abs(co2Reduction).toFixed(0)} MT</strong> ·
              AQI improved: <strong>{Math.abs(aqiReduction).toFixed(0)} pts</strong>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SDG Alignment */}
      <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base serif-heading">
            <Leaf className="h-4 w-4 text-primary" /> SDG Alignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-primary">{sdgOverall}</p>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="space-y-2 pt-1">
            {SDG_LIST.map((sdg) => {
              const score = sdgScore(sdg.keys, levers);
              return (
                <div key={sdg.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{sdg.icon} SDG {sdg.id} · {sdg.label}</span>
                    <span className="font-semibold text-primary">{score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
