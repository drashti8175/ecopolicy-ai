import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ComposedChart, Area, Line, ReferenceLine
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface ChartMetrics {
  co2_emissions: number;
  aqi: number;
  electricity_demand: number;
}

interface SimulationChartProps {
  baseline: ChartMetrics;
  predicted: ChartMetrics;
}

function DeltaBadge({ baseline, predicted, lowerIsBetter = true }: { baseline: number; predicted: number; lowerIsBetter?: boolean }) {
  const delta = predicted - baseline;
  const pct = baseline !== 0 ? ((delta / baseline) * 100).toFixed(1) : "0.0";
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const unchanged = Math.abs(delta) < 0.01;

  if (unchanged) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><Minus className="h-3 w-3" /> No change</span>;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${improved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
      {improved ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {improved ? "" : "+"}{pct}%
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-3 text-xs">
        <p className="font-bold text-white mb-2 drop-shadow-sm">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 font-medium">{entry.name}:</span>
            <span className="font-bold text-white">{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SimulationChart({ baseline, predicted }: SimulationChartProps) {
  const barData = [
    {
      name: "CO₂ (Mt)",
      Baseline: +baseline.co2_emissions.toFixed(2),
      Predicted: +predicted.co2_emissions.toFixed(2),
    },
    {
      name: "AQI",
      Baseline: +baseline.aqi.toFixed(1),
      Predicted: +predicted.aqi.toFixed(1),
    },
    {
      name: "Electricity (GWh)",
      Baseline: +(baseline.electricity_demand / 1000).toFixed(1),
      Predicted: +(predicted.electricity_demand / 1000).toFixed(1),
    },
  ];

  // Radar: normalise 0-100 for each metric (lower = worse for CO2/AQI, higher = better)
  const co2Max = Math.max(baseline.co2_emissions, predicted.co2_emissions) * 1.2;
  const aqiMax = Math.max(baseline.aqi, predicted.aqi) * 1.2;
  const elecMax = Math.max(baseline.electricity_demand, predicted.electricity_demand) * 1.2;

  const radarData = [
    {
      metric: "Air Quality",
      Baseline: +(100 - (baseline.aqi / aqiMax) * 100).toFixed(1),
      Predicted: +(100 - (predicted.aqi / aqiMax) * 100).toFixed(1),
    },
    {
      metric: "Low CO₂",
      Baseline: +(100 - (baseline.co2_emissions / co2Max) * 100).toFixed(1),
      Predicted: +(100 - (predicted.co2_emissions / co2Max) * 100).toFixed(1),
    },
    {
      metric: "Energy Efficiency",
      Baseline: +(100 - (baseline.electricity_demand / elecMax) * 100).toFixed(1),
      Predicted: +(100 - (predicted.electricity_demand / elecMax) * 100).toFixed(1),
    },
    {
      metric: "Sustainability",
      Baseline: 42,
      Predicted: Math.min(100, 42 + Math.max(0, (baseline.co2_emissions - predicted.co2_emissions) / baseline.co2_emissions * 100)),
    },
  ];

  // Waterfall delta data
  const deltaData = [
    { name: "CO₂", delta: +(predicted.co2_emissions - baseline.co2_emissions).toFixed(2), unit: "Mt" },
    { name: "AQI", delta: +(predicted.aqi - baseline.aqi).toFixed(1), unit: "pts" },
    { name: "Electricity", delta: +((predicted.electricity_demand - baseline.electricity_demand) / 1000).toFixed(1), unit: "GWh" },
  ];

  return (
    <div className="mt-6 space-y-4">
      {/* Top row: bar comparison + radar */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-[#111827]/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 hover:-translate-y-1 transition-transform duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Metrics Comparison</CardTitle>
                <CardDescription className="text-slate-500">Baseline vs Predicted values</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <DeltaBadge baseline={baseline.co2_emissions} predicted={predicted.co2_emissions} />
                <span className="text-xs text-slate-500 font-medium">CO₂ change</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#e2e8f0' }} />
                <Bar dataKey="Baseline" fill="#475569" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Predicted" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111827]/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 hover:-translate-y-1 transition-transform duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sustainability Radar</CardTitle>
                <CardDescription className="text-slate-500">Multi-dimensional impact view</CardDescription>
              </div>
              <DeltaBadge baseline={baseline.aqi} predicted={predicted.aqi} />
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#475569" }} />
                <Radar name="Baseline" dataKey="Baseline" stroke="#475569" fill="#475569" fillOpacity={0.2} dot />
                <Radar name="Predicted" dataKey="Predicted" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} dot />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 4, color: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: change delta chart */}
      <Card className="border-white/10 bg-[#111827]/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Policy Impact Δ (Change from Baseline)</CardTitle>
          <CardDescription className="text-slate-500">Positive = increase · Negative = reduction (green = improvement)</CardDescription>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={deltaData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
              <Bar
                dataKey="delta"
                maxBarSize={60}
                radius={[6, 6, 0, 0]}
                label={{ position: "top", fontSize: 11, fill: "#94a3b8", formatter: (v: number) => (v > 0 ? `+${v}` : v) }}
                fill="#6366f1"
              >
              </Bar>
              <Line dataKey="delta" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
