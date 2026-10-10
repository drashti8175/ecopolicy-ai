import React, { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, TrendingDown, TrendingUp, Minus, Leaf, Sparkles, Download, Clock,
  RotateCcw, Zap, Wind, Thermometer, TreePine, Bus, Car, Recycle, Sun,
  Activity, Target, Brain, BarChart3, AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { trpc } from "@/lib/trpc";
import { ScenarioManager, type Scenario } from "@/components/ScenarioManager";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { OptimizePanel } from "@/components/OptimizePanel";
import { EconomicPanel } from "@/components/EconomicPanel";
import { ProjectionPanel } from "@/components/ProjectionPanel";
import { ClimateRiskScore } from "@/components/ClimateRiskScore";
import { FeatureImportance } from "@/components/FeatureImportance";
import { PolicyImpactScore } from "@/components/PolicyImpactScore";
import { AIPolicyAssistant } from "@/components/AIPolicyAssistant";
import { DataMethodology } from "@/components/DataMethodology";
import { ThemeToggle } from "@/components/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CityBaseline {
  city: string;
  ev_adoption_pct: number;
  solar_adoption_pct: number;
  trees_planted_pct: number;
  plastic_recycling_pct: number;
  public_transport_usage_pct: number;
  co2_emissions: number;
  aqi: number;
  electricity_demand: number;
  green_score: number;
  population?: number;
}

type SimHistoryItem = {
  id: string;
  city: string;
  levers: Record<string, number>;
  result: any;
  timestamp: number;
};

function readStored<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; }
  catch { return fallback; }
}

// ─── Lever configs ────────────────────────────────────────────────────────────
const LEVER_CONFIG = [
  { key: "ev_adoption_pct",          label: "EV Adoption",       unit: "%", icon: Car,     color: "hsl(var(--metric-cyan))", desc: "Electric vehicles as % of total fleet" },
  { key: "solar_adoption_pct",       label: "Solar Energy",      unit: "%", icon: Sun,     color: "hsl(var(--metric-yellow))", desc: "Rooftop & utility solar share of grid" },
  { key: "trees_planted_pct",        label: "Urban Forestry",    unit: "%", icon: TreePine,color: "hsl(var(--metric-green))", desc: "Green cover as % of city area" },
  { key: "plastic_recycling_pct",    label: "Plastic Recycling", unit: "%", icon: Recycle, color: "hsl(var(--metric-purple))", desc: "Waste diverted from landfill" },
  { key: "public_transport_usage_pct", label: "Public Transit", unit: "%", icon: Bus,     color: "hsl(var(--status-warning))", desc: "Commuters using public transport" },
];

// ─── Animated gauge component ─────────────────────────────────────────────────
function GaugeRing({ value, max, color, size = 80 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1s cubic-bezier(.34,1.56,.64,1)" }}
      />
    </svg>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ title, baseline, predicted, unit, delta, direction, icon: Icon, color, basis, higherIsBetter = false }:
  { title: string; baseline: number; predicted: number; unit: string; delta: number; direction: string; icon: any; color: string; basis: string; higherIsBetter?: boolean }) {
  const isGood = higherIsBetter ? direction === "up" : direction === "down";
  const isNeutral = direction === "same";
  const pctChange = baseline !== 0 ? Math.abs(((predicted - baseline) / baseline) * 100) : 0;

  return (
    <div className="glass-bright rounded-2xl p-5 card-3d group relative overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${color} 10%, transparent), transparent 70%)` }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">{title}</div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-black text-foreground" style={{ fontFamily: "Orbitron, sans-serif", color }}>
                {Math.round(predicted * 10) / 10}
              </span>
              <span className="text-xs text-muted-foreground mb-1">{unit}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 mb-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((predicted / (baseline * 1.5)) * 100, 100)}%`, background: color, boxShadow: `0 0 8px color-mix(in srgb, ${color} 40%, transparent)` }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Baseline: <span className="text-foreground font-semibold">{Math.round(baseline * 10) / 10}</span></div>
          {isNeutral ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> No change</div>
          ) : (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isGood ? "text-[#00ff88] bg-[#00ff88]/10" : "text-[#ff4444] bg-[#ff4444]/10"}`}>
              {isGood ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {pctChange.toFixed(1)}% {isGood ? "↓ better" : "↑ worse"}
            </div>
          )}
        </div>
        <div className="mt-2 text-[10px] leading-4 text-muted-foreground">{basis}</div>
      </div>
    </div>
  );
}

function LeverSlider({ config, value, baseline, onChange }: { config: typeof LEVER_CONFIG[0]; value: number; baseline: number; onChange: (v: number) => void }) {
  const changed = Math.abs(value - baseline) > 0.5;
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}18`, border: `1px solid ${config.color}30` }}>
            <config.icon className="h-3.5 w-3.5" style={{ color: config.color }} />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground leading-tight">{config.label}</div>
            <div className="text-[10px] text-muted-foreground">{config.desc}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {changed && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}>
              {value > baseline ? `+${Math.round(value - baseline)}` : Math.round(value - baseline)}
            </span>
          )}
          <div className="text-sm font-black tabular-nums" style={{ color: config.color, fontFamily: "Orbitron, sans-serif" }}>
            {Math.round(value)}%
          </div>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-white/5 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onChange(Math.round(Math.max(0, Math.min(100, pct * 100))));
        }}>
        <div className="h-full rounded-full transition-all duration-150"
          style={{ width: `${value}%`, background: config.color, boxShadow: `0 0 8px color-mix(in srgb, ${config.color} 40%, transparent)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-background shadow-lg transition-all duration-150 cursor-grab active:cursor-grabbing"
          style={{ left: `calc(${value}% - 8px)`, borderColor: config.color, boxShadow: `0 0 8px ${config.color}` }}
          onMouseDown={(e) => {
            const el = e.currentTarget.parentElement!;
            const move = (ev: MouseEvent) => {
              const rect = el.getBoundingClientRect();
              const pct = (ev.clientX - rect.left) / rect.width;
              onChange(Math.round(Math.max(0, Math.min(100, pct * 100))));
            };
            const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
          }} />
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 border border-primary/20 text-xs">
      <div className="font-bold text-foreground mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState<string>("Delhi");
  const [customCity, setCustomCity] = useState("");
  const [customCities, setCustomCities] = useState<string[]>(() => readStored("ecopolicy-custom-cities", []));
  const [levers, setLevers] = useState({
    ev_adoption_pct: 32,           // Delhi baseline 12 + 20
    solar_adoption_pct: 28,        // Delhi baseline 8 + 20
    trees_planted_pct: 43,         // Delhi baseline 23 + 20
    plastic_recycling_pct: 65,     // Delhi baseline 55 + 10
    public_transport_usage_pct: 65, // Delhi baseline 45 + 20
  });
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulatedBaselineLevers, setSimulatedBaselineLevers] = useState<typeof levers | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(() => readStored("ecopolicy-scenarios", []));
  const [simulationHistory, setSimulationHistory] = useState<SimHistoryItem[]>(() => readStored("ecopolicy-history", []));
  const [comparisonScenarios, setComparisonScenarios] = useState<Scenario[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [duplicateCityMsg, setDuplicateCityMsg] = useState("");

  // tRPC hooks
  const pdfReportMutation = trpc.pdfReport.generate.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdfBase64}`;
      link.download = `EcoPolicy_AI_Report_${selectedCity}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error) => {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report: " + error.message);
    },
  });

  const { data: cityBaselines, isLoading: baselinesLoading } = trpc.simulation.cities.useQuery();

  const simulateMutation = trpc.simulation.simulate.useMutation({
    onSuccess: (data) => {
      setSimulationResult(data);
      setSimulationHistory(prev =>
        [{ id: `run-${Date.now()}`, city: selectedCity, levers: { ...levers }, result: data, timestamp: Date.now() }, ...prev].slice(0, 20)
      );
      setActiveTab("overview");
    },
  });

  useEffect(() => { localStorage.setItem("ecopolicy-scenarios", JSON.stringify(scenarios)); }, [scenarios]);
  useEffect(() => { localStorage.setItem("ecopolicy-custom-cities", JSON.stringify(customCities)); }, [customCities]);
  useEffect(() => { localStorage.setItem("ecopolicy-history", JSON.stringify(simulationHistory)); }, [simulationHistory]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (cityBaselines) {
      const b = cityBaselines.find((c) => c.city === city);
      const base = b ?? { ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15, plastic_recycling_pct: 55, public_transport_usage_pct: 35 };
      // Start sliders 20% above baseline so first Run Simulation always shows real deltas
      setLevers({
        ev_adoption_pct:            Math.min(100, base.ev_adoption_pct + 20),
        solar_adoption_pct:         Math.min(100, base.solar_adoption_pct + 20),
        trees_planted_pct:          Math.min(100, base.trees_planted_pct + 20),
        plastic_recycling_pct:      Math.min(100, base.plastic_recycling_pct + 10),
        public_transport_usage_pct: Math.min(100, base.public_transport_usage_pct + 20),
      });
    }
    setSimulationResult(null);
  };

  const handleAddCustomCity = () => {
    const city = customCity.trim().replace(/\s+/g, " ");
    if (city.length < 2) return;
    // Check duplicate
    const allCities = [...(cityBaselines || []).map(c => c.city), ...customCities];
    if (allCities.some(c => c.toLowerCase() === city.toLowerCase())) {
      setDuplicateCityMsg(`"${city}" already exists in the city list.`);
      setTimeout(() => setDuplicateCityMsg(""), 3000);
      setCustomCity("");
      handleCityChange(allCities.find(c => c.toLowerCase() === city.toLowerCase()) || city);
      return;
    }
    setCustomCities(prev => [...prev, city].sort((a, b) => a.localeCompare(b)));
    setCustomCity("");
    handleCityChange(city);
  };

  const handleSimulate = () => {
    const cityBaseline = cityBaselines?.find((c) => c.city === selectedCity);
    const baselineSnapshot = cityBaseline
      ? { ev_adoption_pct: cityBaseline.ev_adoption_pct, solar_adoption_pct: cityBaseline.solar_adoption_pct, trees_planted_pct: cityBaseline.trees_planted_pct, plastic_recycling_pct: cityBaseline.plastic_recycling_pct, public_transport_usage_pct: cityBaseline.public_transport_usage_pct }
      : { ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15, plastic_recycling_pct: 55, public_transport_usage_pct: 35 };
    setSimulatedBaselineLevers(baselineSnapshot);
    simulateMutation.mutate({ city: selectedCity, levers });
  };

  const handleApplyAndRun = (rec: Record<string, number>) => {
    const newLevers = rec as typeof levers;
    const cityBaseline = cityBaselines?.find((c) => c.city === selectedCity);
    const baselineSnapshot = cityBaseline
      ? { ev_adoption_pct: cityBaseline.ev_adoption_pct, solar_adoption_pct: cityBaseline.solar_adoption_pct, trees_planted_pct: cityBaseline.trees_planted_pct, plastic_recycling_pct: cityBaseline.plastic_recycling_pct, public_transport_usage_pct: cityBaseline.public_transport_usage_pct }
      : { ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15, plastic_recycling_pct: 55, public_transport_usage_pct: 35 };
    setLevers(newLevers);
    setSimulatedBaselineLevers(baselineSnapshot);
    simulateMutation.mutate({ city: selectedCity, levers: newLevers });
  };

  const handleSaveScenario = (s: Scenario) => setScenarios(prev => [...prev, s]);
  const handleDeleteScenario = (id: string) => setScenarios(prev => prev.filter(s => s.id !== id));
  const handleCompareScenarios = (ids: string[]) => setComparisonScenarios(scenarios.filter(s => ids.includes(s.id)));

  const handleDownloadReport = () => {
    if (!simulationResult) return;
    pdfReportMutation.mutate({
      city: selectedCity, levers,
      baseline_metrics: {
        co2_emissions: Number(simulationResult.co2_emissions.baseline),
        aqi: Number(simulationResult.aqi.baseline),
        electricity_demand: Number(simulationResult.electricity_demand.baseline),
        green_score: Number(simulationResult.green_score.baseline),
      },
      predicted_metrics: {
        co2_emissions: Number(simulationResult.co2_emissions.predicted),
        aqi: Number(simulationResult.aqi.predicted),
        electricity_demand: Number(simulationResult.electricity_demand.predicted),
        green_score: Number(simulationResult.green_score.predicted),
      },
      ai_explanation: simulationResult.ai_explanation || "",
      population: 1000000,
      data_provenance: simulationResult.data_provenance,
    });
  };

  const baseline = cityBaselines?.find((c) => c.city === selectedCity);

  // Chart data
  const barChartData = useMemo(() => {
    if (!simulationResult) return [];
    return [
      { name: "CO₂ (MT)", Baseline: simulationResult.co2_emissions.baseline, Simulated: simulationResult.co2_emissions.predicted },
      { name: "AQI", Baseline: simulationResult.aqi.baseline, Simulated: simulationResult.aqi.predicted },
      { name: "Electricity", Baseline: simulationResult.electricity_demand.baseline / 1000, Simulated: simulationResult.electricity_demand.predicted / 1000 },
      { name: "Green Score", Baseline: simulationResult.green_score.baseline, Simulated: simulationResult.green_score.predicted },
    ];
  }, [simulationResult]);

  const radarData = useMemo(() => {
    if (!simulationResult) return [];
    const sr = simulationResult;
    return [
      { subject: "CO₂ Reduction", A: 100 - (sr.co2_emissions.predicted / sr.co2_emissions.baseline) * 100 },
      { subject: "AQI Improvement", A: 100 - (sr.aqi.predicted / sr.aqi.baseline) * 100 },
      { subject: "Green Score", A: sr.green_score.predicted },
      { subject: "Energy Efficiency", A: 100 - (sr.electricity_demand.predicted / sr.electricity_demand.baseline) * 100 },
      { subject: "Policy Intensity", A: (Object.values(levers).reduce((a, b) => a + b, 0) / 5 / 100) * 100 },
    ];
  }, [simulationResult, levers]);

  const allCitiesSorted = useMemo(() => {
    const base = (cityBaselines || []).map(c => c.city);
    const custom = customCities.filter(name => !base.includes(name));
    return [...base, ...custom].sort((a, b) => a.localeCompare(b));
  }, [cityBaselines, customCities]);

  const baselineAQI = simulationResult?.aqi?.baseline ?? baseline?.aqi ?? 100;
  const aqiCategory = baselineAQI <= 50 ? "Good" : baselineAQI <= 100 ? "Satisfactory" : baselineAQI <= 200 ? "Moderate" : baselineAQI <= 300 ? "Poor" : baselineAQI <= 400 ? "Very Poor" : "Severe";
  const aqiColor = baselineAQI <= 50 ? "hsl(var(--metric-green))" : baselineAQI <= 100 ? "hsl(var(--metric-cyan))" : baselineAQI <= 200 ? "hsl(var(--metric-yellow))" : baselineAQI <= 300 ? "hsl(var(--status-warning))" : "hsl(var(--status-danger))";
  const airQualityKind = simulationResult?.data_provenance?.kind ?? "planning-baseline";
  const airQualityLive = airQualityKind === "station-observation";
  const airQualityLabel = airQualityLive ? "CPCB" : airQualityKind === "model-estimate" ? "Live estimate" : "Baseline";

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>

      {/* ── TOP NAV BAR ────────────────────────────────── */}
      <header className="app-nav sticky top-0 z-50 backdrop-blur-xl border-b border-border/70">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center pulse-ring">
              <Leaf className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-black text-foreground tracking-tight text-sm hidden sm:block" style={{ fontFamily: "Orbitron, sans-serif" }}>
              EcoPolicy<span className="text-primary">Platform</span>
            </span>
            <div className="h-4 w-px bg-border/60 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:block">Urban Climate Intelligence Platform</span>
          </div>

          {/* City badge in nav */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: aqiColor, boxShadow: `0 0 6px ${aqiColor}` }} />
              <span className="text-foreground font-semibold">{selectedCity}</span>
              <span className="text-muted-foreground">·</span>
              <span style={{ color: aqiColor }}>{airQualityLabel} {Math.round(baselineAQI)} · {aqiCategory}</span>
            </div>
            {simulationResult && (
              <button
                onClick={handleDownloadReport}
                disabled={pdfReportMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                style={{ background: "rgba(0,255,255,0.1)", border: "1px solid rgba(0,255,255,0.3)", color: "hsl(180,100%,50%)" }}
              >
                {pdfReportMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Report
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* ── CITY HEADER ────────────────────────────────── */}
        <div className="theme-hero relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8 grid-overlay">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="section-label mb-2" style={{ fontSize: "0.6rem" }}>Urban Climate Decision Studio · India</div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground" style={{ fontFamily: "Orbitron, sans-serif" }}>
                <span className="glow-text">{selectedCity}</span> <span className="text-muted-foreground text-lg font-medium">Climate Simulator</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Model CO₂, AQI, Energy & Green Score · Transparent scenario assumptions · Data-driven recommendations
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {baseline && [
                { label: "CO₂ plan baseline", val: `${Number(baseline.co2_emissions).toFixed(1)} MT`, color: "hsl(var(--status-danger))" },
                { label: airQualityKind === "model-estimate" ? "Live AQI estimate" : airQualityKind === "station-observation" ? "CPCB station AQI" : "AQI baseline", val: `${Math.round(Number(baselineAQI))}`, color: aqiColor },
                { label: "Model score", val: `${Math.round(Number(baseline.green_score))}/100`, color: "hsl(var(--metric-green))" },
              ].map(s => (
                <div key={s.label} className="glass rounded-xl px-3 py-2 text-center hidden md:block">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{s.label}</div>
                  <div className="text-lg font-black" style={{ color: s.color, fontFamily: "Orbitron, sans-serif" }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
          {simulationResult?.data_provenance && (
            <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              airQualityLive ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
              airQualityKind === "model-estimate" ? "bg-sky-500/15 text-sky-300 border border-sky-500/30" :
              "bg-amber-500/15 text-amber-300 border border-amber-500/30"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                airQualityLive ? "bg-emerald-400" : airQualityKind === "model-estimate" ? "bg-sky-400" : "bg-amber-400"
              }`} />
              AQI source: {airQualityLive ? "CPCB station observation" : airQualityKind === "model-estimate" ? "Open-Meteo live PM2.5 estimate" : "Planning baseline (no live data for this city)"}
            </div>
          )}
        </div>

        {/* ── MAIN LAYOUT ────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">

          {/* ── LEFT: CONTROLS PANEL ───────────────────── */}
          <div className="xl:sticky xl:top-20 xl:self-start space-y-4 max-h-[calc(100vh-6rem)] xl:overflow-y-auto scrollbar-thin">

            {/* City selector */}
            <div className="glass rounded-2xl p-5">
              <div className="section-label mb-4" style={{ fontSize: "0.6rem" }}>Select City</div>
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="bg-card/60 border-border/60 text-foreground h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60 text-foreground">
                  {allCitiesSorted.map(city => (
                    <SelectItem key={city} value={city} className="text-sm hover:bg-primary/10 focus:bg-primary/10">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add custom city */}
              <div className="mt-3 flex gap-2">
                <input
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddCustomCity()}
                  placeholder="Add any city…"
                  className="theme-input flex-1 min-w-0 px-3 py-2 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/80 outline-none focus:ring-1 ring-primary/40 transition-all border"
                />
                <button onClick={handleAddCustomCity}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
                  style={{ background: "rgba(0,255,255,0.12)", border: "1px solid rgba(0,255,255,0.3)", color: "hsl(180,100%,50%)" }}>
                  Add
                </button>
              </div>
              {duplicateCityMsg && (
                <div className="mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.2)", color: "#ffc800" }}>
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />{duplicateCityMsg}
                </div>
              )}
            </div>

            {/* Policy Levers */}
            <div className="glass rounded-2xl p-5">
              <div className="section-label mb-4" style={{ fontSize: "0.6rem" }}>Policy Levers</div>
              <div className="space-y-5">
                {LEVER_CONFIG.map(config => {
                  const baselineVal = (cityBaselines?.find(c => c.city === selectedCity) ?? { ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15, plastic_recycling_pct: 55, public_transport_usage_pct: 35 })[config.key as keyof typeof levers] as number;
                  return (
                    <LeverSlider
                      key={config.key}
                      config={config}
                      value={levers[config.key as keyof typeof levers]}
                      baseline={baselineVal}
                      onChange={v => setLevers(prev => ({ ...prev, [config.key]: v }))}
                    />
                  );
                })}
              </div>
              {simulationResult && LEVER_CONFIG.some(c => Math.abs(levers[c.key as keyof typeof levers] - (simulatedBaselineLevers?.[c.key as keyof typeof levers] ?? levers[c.key as keyof typeof levers])) > 0.5) && (
                <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(0,255,255,0.06)", border: "1px solid rgba(0,255,255,0.2)", color: "hsl(180,100%,60%)" }}>
                  <Activity className="h-3 w-3 flex-shrink-0" /> Levers changed — click Run Simulation to update results
                </div>
              )}
            </div>

            {/* AI Optimizer */}
            <div className="glass rounded-2xl p-5">
              <OptimizePanel city={selectedCity} onApply={(rec) => setLevers(rec as typeof levers)} onApplyAndRun={handleApplyAndRun} />
            </div>

            {/* Run button */}
            <button
              onClick={handleSimulate}
              disabled={simulateMutation.isPending}
              className="w-full py-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
              style={{
                background: simulateMutation.isPending
                  ? "rgba(0,255,255,0.1)"
                  : "linear-gradient(135deg, hsl(180,100%,50%), hsl(220,80%,60%))",
                color: simulateMutation.isPending ? "hsl(180,100%,50%)" : "#020b14",
                boxShadow: simulateMutation.isPending ? "none" : "0 0 30px rgba(0,255,255,0.3)",
                border: simulateMutation.isPending ? "1px solid rgba(0,255,255,0.3)" : "none",
                fontFamily: "Orbitron, sans-serif",
              }}
            >
              {simulateMutation.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Running Simulation…</>
              ) : (
                <><Activity className="h-5 w-5" /> Run Simulation</>
              )}
            </button>

            {simulateMutation.error && (
              <div className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.2)", color: "#ff6464" }}>
                {simulateMutation.error.message}
              </div>
            )}
          </div>

          {/* ── RIGHT: RESULTS PANEL ───────────────────── */}
          <div className="min-w-0">
            {simulationResult ? (
              <>
                {/* ── AI INSIGHTS ── */}
                <div className="glass rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(168,85,247,0.25)", background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(0,255,255,0.04))" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                      <Sparkles className="h-4 w-4" style={{ color: "#a855f7" }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">Scenario Summary</div>
                      <div className="text-[10px] text-muted-foreground">Deterministic planning model · {selectedCity}</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">{simulationResult.ai_explanation}</p>
                </div>

                {/* ── METRIC CARDS ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <MetricCard title="CO₂ Emissions" baseline={simulationResult.co2_emissions.baseline} predicted={simulationResult.co2_emissions.predicted}
                    unit="MT" delta={simulationResult.co2_emissions.delta} direction={simulationResult.co2_emissions.direction} icon={Thermometer} color="hsl(var(--metric-cyan))" basis={`${selectedCity} planning baseline · data/city_baselines.json · source/year unavailable · scenario projection`} />
                  <MetricCard title="Air Quality (AQI)" baseline={simulationResult.aqi.baseline} predicted={simulationResult.aqi.predicted}
                    unit="pts" delta={simulationResult.aqi.delta} direction={simulationResult.aqi.direction} icon={Wind} color="hsl(var(--status-warning))" basis={`${simulationResult.data_provenance.source} · ${simulationResult.data_provenance.location || selectedCity} · ${simulationResult.data_provenance.measurement_period || simulationResult.data_provenance.updated_at || "period not provided"}`} />
                  <MetricCard title="Electricity" baseline={simulationResult.electricity_demand.baseline} predicted={simulationResult.electricity_demand.predicted}
                    unit="MWh" delta={simulationResult.electricity_demand.delta} direction={simulationResult.electricity_demand.direction} icon={Zap} color="hsl(var(--metric-yellow))" basis={`${selectedCity} planning baseline · data/city_baselines.json · source/year unavailable · scenario projection`} />
                  <MetricCard title="Green Score" baseline={simulationResult.green_score.baseline} predicted={simulationResult.green_score.predicted}
                    unit="/100" delta={simulationResult.green_score.delta} direction={simulationResult.green_score.direction} icon={Leaf} color="hsl(var(--metric-green))" basis="Calculated scenario score · city baseline from data/city_baselines.json · not observed" higherIsBetter />
                </div>

                {/* ── TABS ── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="theme-muted-surface flex gap-1 h-auto p-1 rounded-2xl overflow-x-auto border">
                    {[
                      { v: "overview", label: "Overview", icon: BarChart3 },
                      { v: "projections", label: "Projections", icon: TrendingDown },
                      { v: "risk", label: "Risk & Score", icon: Target },
                      { v: "economic", label: "Economic", icon: Zap },
                      { v: "ai", label: "Policy Optimizer", icon: Brain },
                      { v: "scenarios", label: "Scenarios", icon: Activity },
                    ].map(t => (
                      <TabsTrigger key={t.v} value={t.v}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-sm flex-shrink-0"
                        style={activeTab === t.v ? { background: "rgba(0,255,255,0.12)", border: "1px solid rgba(0,255,255,0.3)", color: "hsl(180,100%,50%)" } : {}}>
                        <t.icon className="h-3.5 w-3.5" />{t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Overview tab */}
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Bar chart */}
                      <div className="glass rounded-2xl p-5">
                        <div className="section-label mb-4" style={{ fontSize: "0.6rem" }}>Baseline vs Simulated Comparison</div>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={barChartData} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--chart-grid))" />
                            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }} />
                            <Bar dataKey="Baseline" fill="hsl(var(--muted-foreground) / 0.55)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Simulated" fill="hsl(var(--metric-cyan))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Radar chart */}
                      <div className="glass rounded-2xl p-5">
                        <div className="section-label mb-4" style={{ fontSize: "0.6rem" }}>Policy Performance Radar</div>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--chart-grid))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                            <Radar name="Score %" dataKey="A" stroke="hsl(180,100%,50%)" fill="hsl(180,100%,50%)" fillOpacity={0.12} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Impact + Risk side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PolicyImpactScore
                        co2Delta={simulationResult.co2_emissions.delta}
                        co2Baseline={simulationResult.co2_emissions.baseline}
                        aqiDelta={simulationResult.aqi.delta}
                        aqiBaseline={simulationResult.aqi.baseline}
                        greenDelta={simulationResult.green_score.delta}
                        elecDelta={simulationResult.electricity_demand.delta}
                        elecBaseline={simulationResult.electricity_demand.baseline}
                      />
                      <ClimateRiskScore
                        co2={simulationResult.co2_emissions.predicted}
                        co2Baseline={simulationResult.co2_emissions.baseline}
                        aqi={simulationResult.aqi.predicted}
                        aqiBaseline={simulationResult.aqi.baseline}
                        greenScore={simulationResult.green_score.predicted}
                        electricityDemand={simulationResult.electricity_demand.predicted}
                        electricityBaseline={simulationResult.electricity_demand.baseline}
                      />
                    </div>

                    {/* Feature Importance */}
                    {simulatedBaselineLevers && <FeatureImportance levers={levers} baselineLevers={simulatedBaselineLevers} />}

                    {/* Data sources */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/70">
                      {["Scenario projection", "Planning baseline", "Assumed coefficients", "Not measured outcomes"].map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          📊 {s}
                        </span>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Projections tab */}
                  <TabsContent value="projections" className="mt-0">
                    <ProjectionPanel city={selectedCity} levers={levers} />
                  </TabsContent>

                  {/* Risk & Score tab */}
                  <TabsContent value="risk" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PolicyImpactScore
                        co2Delta={simulationResult.co2_emissions.delta}
                        co2Baseline={simulationResult.co2_emissions.baseline}
                        aqiDelta={simulationResult.aqi.delta}
                        aqiBaseline={simulationResult.aqi.baseline}
                        greenDelta={simulationResult.green_score.delta}
                        elecDelta={simulationResult.electricity_demand.delta}
                        elecBaseline={simulationResult.electricity_demand.baseline}
                      />
                      <ClimateRiskScore
                        co2={simulationResult.co2_emissions.predicted}
                        co2Baseline={simulationResult.co2_emissions.baseline}
                        aqi={simulationResult.aqi.predicted}
                        aqiBaseline={simulationResult.aqi.baseline}
                        greenScore={simulationResult.green_score.predicted}
                        electricityDemand={simulationResult.electricity_demand.predicted}
                        electricityBaseline={simulationResult.electricity_demand.baseline}
                      />
                    </div>
                    {simulatedBaselineLevers && <FeatureImportance levers={levers} baselineLevers={simulatedBaselineLevers} />}
                  </TabsContent>

                  {/* Economic tab */}
                  <TabsContent value="economic" className="mt-0">
                    {simulatedBaselineLevers && (
                      <EconomicPanel levers={levers} baselineLevers={simulatedBaselineLevers}
                        greenScore={simulationResult.green_score.predicted}
                        co2Reduction={simulationResult.co2_emissions.delta}
                        aqiReduction={simulationResult.aqi.delta}
                      />
                    )}
                  </TabsContent>

                  {/* Policy Optimizer tab */}
                  <TabsContent value="ai" className="mt-0">
                    <AIPolicyAssistant
                      city={selectedCity}
                      context={{ co2_emissions: simulationResult.co2_emissions.predicted, aqi: simulationResult.aqi.predicted, green_score: simulationResult.green_score.predicted, electricity_demand: simulationResult.electricity_demand.predicted }}
                    />
                  </TabsContent>

                  {/* Scenarios tab */}
                  <TabsContent value="scenarios" className="mt-0 space-y-4">
                    <ScenarioManager
                      scenarios={scenarios}
                      onSaveScenario={handleSaveScenario}
                      onDeleteScenario={handleDeleteScenario}
                      onCompareScenarios={handleCompareScenarios}
                      currentCity={selectedCity}
                      currentLevers={levers}
                      currentResults={{ co2_emissions: simulationResult.co2_emissions.predicted, aqi: simulationResult.aqi.predicted, electricity_demand: simulationResult.electricity_demand.predicted, green_score: simulationResult.green_score.predicted }}
                    />
                    {comparisonScenarios.length > 0 && (
                      <ScenarioComparison scenarios={comparisonScenarios} onClose={() => setComparisonScenarios([])} />
                    )}
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              /* Empty state */
              <div className="h-96 flex flex-col items-center justify-center glass rounded-2xl gap-4" style={{ border: "1px dashed rgba(0,255,255,0.2)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center pulse-ring" style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)" }}>
                  <Activity className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-foreground mb-1">Ready to Simulate</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Select a city, adjust the policy levers on the left, and click <span className="text-primary font-semibold">Run Simulation</span></div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground/60">
                  {["Open-Meteo PM2.5 estimate", "Undocumented city baselines", "Scenario formulas"].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── HISTORY ── */}
            {simulationHistory.length > 0 && (
              <div className="mt-6">
                <div className="section-label mb-3" style={{ fontSize: "0.6rem" }}>
                  <Clock className="h-3 w-3" /> Recent Simulations
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {simulationHistory.slice(0, 6).map(item => (
                    <button key={item.id} type="button"
                      onClick={() => { setSelectedCity(item.city); setLevers(item.levers as typeof levers); setSimulationResult(item.result); }}
                      className="glass-bright rounded-xl p-3 text-left transition-all hover:scale-[1.02] group"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">{item.city}</span>
                        <RotateCcw className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">{new Date(item.timestamp).toLocaleString()}</p>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-[#00ff88]">🌿 {item.result.green_score.predicted.toFixed(0)}</span>
                        <span className="text-[#00ffff]">💨 {item.result.co2_emissions.predicted.toFixed(1)} MT</span>
                        <span className="text-[#ffc800]">AQI {item.result.aqi.predicted.toFixed(0)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── DATA METHODOLOGY ── */}
            <div className="mt-6">
              <DataMethodology />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
