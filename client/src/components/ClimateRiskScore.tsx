import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface Props {
  co2: number;       // predicted
  co2Baseline: number;
  aqi: number;       // predicted
  aqiBaseline: number;
  greenScore: number; // predicted
  electricityDemand: number;
  electricityBaseline: number;
}

function getRiskLevel(score: number): { label: string; color: string; bg: string; bar: string } {
  if (score >= 75) return { label: "CRITICAL", color: "text-destructive", bg: "bg-destructive/5 border-destructive/30", bar: "bg-destructive" };
  if (score >= 55) return { label: "HIGH RISK", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", bar: "bg-orange-500" };
  if (score >= 35) return { label: "MODERATE",  color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", bar: "bg-yellow-500" };
  return { label: "LOW RISK",  color: "text-primary", bg: "bg-primary/5 border-primary/20", bar: "bg-primary" };
}

export function ClimateRiskScore({ co2, co2Baseline, aqi, aqiBaseline, greenScore, electricityDemand, electricityBaseline }: Props) {
  // Normalise each factor 0–100 (higher = worse risk)
  const co2Risk = Math.min(100, (co2 / co2Baseline) * 50);
  const aqiRisk = Math.min(100, (aqi / aqiBaseline) * 50);
  const greenRisk = Math.max(0, 100 - greenScore);
  const elecRisk = Math.min(100, (electricityDemand / electricityBaseline) * 40);

  const score = Math.round((co2Risk * 0.35 + aqiRisk * 0.30 + greenRisk * 0.25 + elecRisk * 0.10));
  const risk = getRiskLevel(score);

  const factors = [
    { label: "CO₂ Emissions", value: Math.round(co2Risk), weight: "35%" },
    { label: "Air Quality (AQI)", value: Math.round(aqiRisk), weight: "30%" },
    { label: "Green Coverage", value: Math.round(greenRisk), weight: "25%" },
    { label: "Energy Demand", value: Math.round(elecRisk), weight: "10%" },
  ];

  return (
    <Card className={`border ${risk.bg}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base serif-heading">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" /> Climate Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score + label */}
        <div className="flex items-end gap-3">
          <span className={`text-5xl font-black ${risk.color}`}>{score}</span>
          <div className="mb-1">
            <span className="text-slate-400 text-sm">/ 100</span>
            <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500">
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-md bg-slate-700 transition-all duration-700"
            style={{ left: `calc(${score}% - 10px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/60">
          <span>LOW</span><span>MODERATE</span><span>HIGH</span><span>CRITICAL</span>
        </div>

        {/* Factor breakdown */}
        <div className="space-y-2 pt-1">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{f.label} <span className="text-muted-foreground/60">({f.weight})</span></span>
                <span className="font-semibold text-foreground">{f.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className={`h-1.5 rounded-full ${risk.bar} transition-all duration-500`} style={{ width: `${f.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
