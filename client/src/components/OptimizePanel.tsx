import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

const GOALS = [
  { value: "co2", label: "Reduce CO₂ Emissions" },
  { value: "aqi", label: "Improve Air Quality" },
  { value: "energy", label: "Reduce Energy Consumption" },
  { value: "green", label: "Maximize Green Score" },
  { value: "balanced", label: "Balanced Sustainability" },
] as const;

type Goal = (typeof GOALS)[number]["value"];

interface Props {
  city: string;
  onApply: (levers: Record<string, number>) => void;
}

export function OptimizePanel({ city, onApply }: Props) {
  const [goal, setGoal] = useState<Goal>("balanced");
  const [result, setResult] = useState<any>(null);

  const optimizeMutation = trpc.simulation.optimize.useMutation({
    onSuccess: setResult,
  });

  const pct = (a: number, b: number) => (((a - b) / b) * 100).toFixed(1);

  return (
    <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg serif-heading">
          <Sparkles className="h-5 w-5 text-primary" /> AI Policy Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">What is your priority?</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                  goal === g.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => optimizeMutation.mutate({ city, goal })}
          disabled={optimizeMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {optimizeMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimizing...</>
          ) : (
            "✨ Optimize My City"
          )}
        </Button>

        {result && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Recommended Policy Plan</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["EV Adoption", result.recommended_levers.ev_adoption_pct],
                ["Solar Adoption", result.recommended_levers.solar_adoption_pct],
                ["Trees Planted", result.recommended_levers.trees_planted_pct],
                ["Plastic Recycling", result.recommended_levers.plastic_recycling_pct],
                ["Public Transport", result.recommended_levers.public_transport_usage_pct],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between rounded-lg bg-card px-3 py-2 text-sm border border-border">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold text-primary">{val}%</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Expected Results</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "CO₂", base: result.baseline.co2_emissions, pred: result.predicted.co2_emissions, lower: true },
                { label: "AQI", base: result.baseline.aqi, pred: result.predicted.aqi, lower: true },
                { label: "Electricity", base: result.baseline.electricity_demand, pred: result.predicted.electricity_demand, lower: true },
                { label: "Green Score", base: result.baseline.green_score, pred: result.predicted.green_score, lower: false },
              ].map(({ label, base, pred, lower }) => {
                const delta = parseFloat(pct(pred, base));
                const good = lower ? delta < 0 : delta > 0;
                return (
                  <div key={label} className="rounded-lg bg-card px-3 py-2 border border-border">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {good ? <TrendingDown className="h-3 w-3 text-primary" /> : <TrendingUp className="h-3 w-3 text-destructive" />}
                      <span className={`text-sm font-bold ${good ? "text-primary" : "text-destructive"}`}>
                        {delta > 0 ? "+" : ""}{delta}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{Math.round(base)} → {Math.round(pred)}</p>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => onApply(result.recommended_levers)}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/5"
            >
              Apply These Levers
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
