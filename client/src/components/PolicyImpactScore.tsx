import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

interface Props {
  co2Delta: number;       // negative = reduction (good)
  co2Baseline: number;
  aqiDelta: number;       // negative = improvement (good)
  aqiBaseline: number;
  greenDelta: number;     // positive = improvement (good)
  elecDelta: number;      // negative = reduction (good)
  elecBaseline: number;
}

function grade(score: number): { label: string; emoji: string; color: string; ring: string } {
  if (score >= 80) return { label: "Excellent", emoji: "🟢", color: "text-primary",     ring: "ring-primary" };
  if (score >= 60) return { label: "Good",      emoji: "🔵", color: "text-primary/80",   ring: "ring-primary/60" };
  if (score >= 40) return { label: "Moderate",  emoji: "🟡", color: "text-yellow-600",   ring: "ring-yellow-400" };
  return              { label: "Poor",      emoji: "🔴", color: "text-destructive",  ring: "ring-destructive" };
}

export function PolicyImpactScore({ co2Delta, co2Baseline, aqiDelta, aqiBaseline, greenDelta, elecDelta, elecBaseline }: Props) {
  // Each factor scored 0–100 (higher = better policy impact)
  const co2Score  = Math.min(100, Math.max(0, (-co2Delta / co2Baseline) * 100 * 3));
  const aqiScore  = Math.min(100, Math.max(0, (-aqiDelta / aqiBaseline) * 100 * 3));
  const greenScore = Math.min(100, Math.max(0, greenDelta * 2));
  const elecScore = Math.min(100, Math.max(0, (-elecDelta / elecBaseline) * 100 * 3));

  const overall = Math.round(co2Score * 0.35 + aqiScore * 0.30 + greenScore * 0.25 + elecScore * 0.10);
  const g = grade(overall);

  const factors = [
    { label: "CO₂ Reduction",      score: Math.round(co2Score),  weight: "35%" },
    { label: "AQI Improvement",     score: Math.round(aqiScore),  weight: "30%" },
    { label: "Green Score Gain",    score: Math.round(greenScore),weight: "25%" },
    { label: "Energy Efficiency",   score: Math.round(elecScore), weight: "10%" },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base serif-heading">
          <Award className="h-5 w-5 text-primary" /> Policy Impact Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big score */}
        <div className="flex items-center gap-4">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ring-4 ${g.ring} bg-white shadow-sm`}>
            <span className={`text-3xl font-black ${g.color}`}>{overall}</span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">out of 100</p>
            <p className={`text-xl font-bold ${g.color}`}>{g.emoji} {g.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Based on all 4 climate metrics</p>
          </div>
        </div>

        {/* Factor bars */}
        <div className="space-y-2">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{f.label} <span className="text-muted-foreground/60">({f.weight})</span></span>
                <span className="font-semibold text-foreground">{f.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${f.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
