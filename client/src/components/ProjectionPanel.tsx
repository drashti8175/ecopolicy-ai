import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Levers {
  ev_adoption_pct: number;
  solar_adoption_pct: number;
  trees_planted_pct: number;
  plastic_recycling_pct: number;
  public_transport_usage_pct: number;
}

interface Props {
  city: string;
  levers: Levers;
}

export function ProjectionPanel({ city, levers }: Props) {
  const { data, isLoading } = trpc.simulation.projection.useQuery({ city, levers });

  const chartData = data
    ? data.years.map((y, i) => ({
        year: y,
        "Business as Usual CO₂": data.baseline_co2[i],
        "With Policy CO₂": data.policy_co2[i],
        "Business as Usual AQI": data.baseline_aqi[i],
        "With Policy AQI": data.policy_aqi[i],
      }))
    : [];

  const co2Saved = data ? data.baseline_co2[data.baseline_co2.length - 1] - data.policy_co2[data.policy_co2.length - 1] : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 serif-heading">
          <TrendingDown className="h-5 w-5 text-primary" /> Future Climate Projection
        </CardTitle>
        <CardDescription>2026 – 2040 · Business-as-usual vs. proposed policy</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">Loading projection...</div>
        ) : (
          <>
            <div className="mb-4 flex gap-4">
              <div className="rounded-lg bg-primary/10 px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">CO₂ Avoided by 2040</p>
                <p className="text-xl font-bold text-primary">{co2Saved} MT</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">CO₂ Emissions (MT)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,90%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Business as Usual CO₂" stroke="#f87171" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="With Policy CO₂" stroke="hsl(180,70%,30%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4">AQI Trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,90%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Business as Usual AQI" stroke="#fb923c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="With Policy AQI" stroke="hsl(220,50%,20%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
