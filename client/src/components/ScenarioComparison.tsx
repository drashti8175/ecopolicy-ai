import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Scenario } from "./ScenarioManager";

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  onClose: () => void;
}

export function ScenarioComparison({ scenarios, onClose }: ScenarioComparisonProps) {
  if (scenarios.length < 2) return null;

  const comparisonData = [
    {
      metric: "CO₂ Emissions",
      ...scenarios.reduce(
        (acc, s, i) => ({
          ...acc,
          [`Scenario ${i + 1}`]: s.results.co2_emissions,
        }),
        {}
      ),
    },
    {
      metric: "AQI",
      ...scenarios.reduce(
        (acc, s, i) => ({
          ...acc,
          [`Scenario ${i + 1}`]: s.results.aqi,
        }),
        {}
      ),
    },
    {
      metric: "Electricity",
      ...scenarios.reduce(
        (acc, s, i) => ({
          ...acc,
          [`Scenario ${i + 1}`]: s.results.electricity_demand,
        }),
        {}
      ),
    },
    {
      metric: "Green Score",
      ...scenarios.reduce(
        (acc, s, i) => ({
          ...acc,
          [`Scenario ${i + 1}`]: s.results.green_score,
        }),
        {}
      ),
    },
  ];

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>Side-by-side comparison of {scenarios.length} scenarios</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Details Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Scenario</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-700">CO₂ (MT)</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-700">AQI</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-700">Electricity (MWh)</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-700">Green Score</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, idx) => (
                <tr key={scenario.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div>
                      <p className="font-medium text-slate-900">{scenario.name}</p>
                      <p className="text-xs text-slate-500">{scenario.city}</p>
                    </div>
                  </td>
                  <td className="text-right py-3 px-3 text-slate-900 font-medium">
                    {scenario.results.co2_emissions.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-3 text-slate-900 font-medium">
                    {scenario.results.aqi.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-3 text-slate-900 font-medium">
                    {scenario.results.electricity_demand.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-3">
                    <Badge className="bg-blue-100 text-blue-800">{scenario.results.green_score.toFixed(1)}/100</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison Chart */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              {scenarios.map((_, idx) => (
                <Bar key={idx} dataKey={`Scenario ${idx + 1}`} fill={colors[idx % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Policy Levers Comparison */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Policy Levers Comparison</h3>
          <div className="space-y-3">
            {["ev_adoption_pct", "solar_adoption_pct", "trees_planted_pct", "plastic_recycling_pct", "public_transport_usage_pct"].map((lever) => (
              <div key={lever} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-sm text-slate-700 font-medium capitalize">
                  {lever.replace(/_pct$/, "").replace(/_/g, " ")}
                </span>
                <div className="flex gap-4">
                  {scenarios.map((scenario, idx) => (
                    <div key={scenario.id} className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {scenario.levers[lever as keyof typeof scenario.levers].toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-500">Scenario {idx + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
