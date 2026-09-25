import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Minus, Leaf, Sparkles, Download, Clock, RotateCcw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
}

const LEVER_CONFIG = [
  { key: "ev_adoption_pct", label: "EV Adoption", unit: "%" },
  { key: "solar_adoption_pct", label: "Solar Adoption", unit: "%" },
  { key: "trees_planted_pct", label: "Trees Planted", unit: "%" },
  { key: "plastic_recycling_pct", label: "Plastic Recycling", unit: "%" },
  { key: "public_transport_usage_pct", label: "Public Transport", unit: "%" },
];

type SimulationHistoryItem = {
  id: string;
  city: string;
  levers: Record<string, number>;
  result: any;
  timestamp: number;
};

function readStored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState<string>("Delhi");
  const [customCity, setCustomCity] = useState("");
  const [customCities, setCustomCities] = useState<string[]>(() => readStored("ecopolicy-custom-cities", []));
  const [levers, setLevers] = useState({
    ev_adoption_pct: 12,
    solar_adoption_pct: 8,
    trees_planted_pct: 23,
    plastic_recycling_pct: 55,
    public_transport_usage_pct: 45,
  });

  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulatedBaselineLevers, setSimulatedBaselineLevers] = useState<typeof levers | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(() => readStored("ecopolicy-scenarios", []));
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>(() => readStored("ecopolicy-history", []));
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [comparisonScenarios, setComparisonScenarios] = useState<Scenario[]>([]);

  // PDF Report mutation
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
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF report.");
    },
  });

  // Fetch city baselines
  const { data: cityBaselines, isLoading: baselinesLoading } = trpc.simulation.cities.useQuery();

  // Simulate mutation
  const simulateMutation = trpc.simulation.simulate.useMutation({
    onSuccess: (data) => {
      setSimulationResult(data);
      setLlmExplanation(null); // Clear previous LLM explanation
      setSimulationHistory(prev => [{ id: `run-${Date.now()}`, city: selectedCity, levers: { ...levers }, result: data, timestamp: Date.now() }, ...prev].slice(0, 20));
    },
  });

  useEffect(() => { localStorage.setItem("ecopolicy-scenarios", JSON.stringify(scenarios)); }, [scenarios]);
  useEffect(() => { localStorage.setItem("ecopolicy-custom-cities", JSON.stringify(customCities)); }, [customCities]);
  useEffect(() => { localStorage.setItem("ecopolicy-history", JSON.stringify(simulationHistory)); }, [simulationHistory]);

  // LLM explanation mutation
  const llmExplainMutation = trpc.simulationLLM.explain.useMutation({
    onSuccess: (data) => {
      setLlmExplanation(data.explanation);
      setIsLoadingLLM(false);
    },
    onError: () => {
      setIsLoadingLLM(false);
    },
  });

  // Update levers when city changes
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (cityBaselines) {
      const baseline = cityBaselines.find((c) => c.city === city);
      if (baseline) {
        setLevers({
          ev_adoption_pct: baseline.ev_adoption_pct,
          solar_adoption_pct: baseline.solar_adoption_pct,
          trees_planted_pct: baseline.trees_planted_pct,
          plastic_recycling_pct: baseline.plastic_recycling_pct,
          public_transport_usage_pct: baseline.public_transport_usage_pct,
        });
      } else {
        setLevers({
          ev_adoption_pct: 8,
          solar_adoption_pct: 15,
          trees_planted_pct: 15,
          plastic_recycling_pct: 55,
          public_transport_usage_pct: 35,
        });
      }
    }
    setSimulationResult(null);
  };

  const handleAddCustomCity = () => {
    const city = customCity.trim().replace(/\s+/g, " ");
    if (city.length < 2) return;
    setCustomCities(prev => prev.includes(city) ? prev : [...prev, city].sort((a, b) => a.localeCompare(b)));
    setCustomCity("");
    handleCityChange(city);
  };

  const handleLeverChange = (key: string, value: number) => {
    setLevers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSimulate = () => {
    // Capture the baseline lever values from the city data at simulation time
    const cityBaseline = cityBaselines?.find((c) => c.city === selectedCity);
    const baselineSnapshot = cityBaseline ? {
      ev_adoption_pct: cityBaseline.ev_adoption_pct,
      solar_adoption_pct: cityBaseline.solar_adoption_pct,
      trees_planted_pct: cityBaseline.trees_planted_pct,
      plastic_recycling_pct: cityBaseline.plastic_recycling_pct,
      public_transport_usage_pct: cityBaseline.public_transport_usage_pct,
    } : {
      ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15,
      plastic_recycling_pct: 55, public_transport_usage_pct: 35,
    };
    setSimulatedBaselineLevers(baselineSnapshot);
    simulateMutation.mutate({ city: selectedCity, levers });
  };

  // Fetch LLM explanation when simulation result changes
  useEffect(() => {
    if (simulationResult && !llmExplanation) {
      setIsLoadingLLM(true);
      const baseline = cityBaselines?.find((c) => c.city === selectedCity);
      llmExplainMutation.mutate({
        city: selectedCity,
        baseline_metrics: {
          co2_emissions: baseline?.co2_emissions ?? simulationResult.co2_emissions.baseline,
          aqi: baseline?.aqi ?? simulationResult.aqi.baseline,
          electricity_demand: baseline?.electricity_demand ?? simulationResult.electricity_demand.baseline,
          green_score: baseline?.green_score ?? simulationResult.green_score.baseline,
        },
        predicted_metrics: {
          co2_emissions: simulationResult.co2_emissions.predicted,
          aqi: simulationResult.aqi.predicted,
          electricity_demand: simulationResult.electricity_demand.predicted,
          green_score: simulationResult.green_score.predicted,
        },
        policy_levers: levers,
      });
    }
  }, [simulationResult, cityBaselines, selectedCity, levers, llmExplanation]);

  const handleSaveScenario = (scenario: Scenario) => {
    setScenarios((prev) => {
      const next = [...prev, scenario];
      localStorage.setItem("ecopolicy-scenarios", JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCompareScenarios = (ids: string[]) => {
    const selected = scenarios.filter((s) => ids.includes(s.id));
    setComparisonScenarios(selected);
  };

  const handleDownloadReport = () => {
    if (!simulationResult || !baseline) return;

    pdfReportMutation.mutate({
      city: selectedCity,
      levers,
      baseline_metrics: {
        co2_emissions: baseline.co2_emissions,
        aqi: baseline.aqi,
        electricity_demand: baseline.electricity_demand,
        green_score: baseline.green_score,
      },
      predicted_metrics: {
        co2_emissions: simulationResult.co2_emissions.predicted,
        aqi: simulationResult.aqi.predicted,
        electricity_demand: simulationResult.electricity_demand.predicted,
        green_score: simulationResult.green_score.predicted,
      },
      ai_explanation: llmExplanation || simulationResult.ai_explanation,
    });
  };

  const chartData = useMemo(() => {
    if (!simulationResult) return [];
    return [
      {
        name: "Metric",
        baseline_co2: simulationResult.co2_emissions.baseline,
        predicted_co2: simulationResult.co2_emissions.predicted,
        baseline_aqi: simulationResult.aqi.baseline,
        predicted_aqi: simulationResult.aqi.predicted,
        baseline_elec: simulationResult.electricity_demand.baseline,
        predicted_elec: simulationResult.electricity_demand.predicted,
        baseline_green: simulationResult.green_score.baseline,
        predicted_green: simulationResult.green_score.predicted,
      },
    ];
  }, [simulationResult]);

  const baseline = cityBaselines?.find((c) => c.city === selectedCity);

  return (
    <div className="min-h-screen bg-[#f4f8f5] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_80%_0%,#4ade80_0%,transparent_30%),linear-gradient(115deg,#073b2a,#0f766e)] px-6 py-8 text-white shadow-xl sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-100"><Leaf className="h-4 w-4" /> URBAN CLIMATE DECISION STUDIO</div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">EcoPolicy AI</h1>
              <p className="mt-2 max-w-xl text-emerald-50">Model the impact of climate actions and shape a healthier future for Indian cities.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm"><span className="text-emerald-100">Selected city</span><p className="mt-1 text-lg font-semibold">{selectedCity}</p></div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Controls */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-emerald-100 shadow-lg shadow-emerald-950/5">
              <CardHeader>
                <CardTitle>Policy Simulation</CardTitle>
                <CardDescription>Adjust levers and simulate impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* City Selector */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Select City</label>
                  <Select value={selectedCity} onValueChange={handleCityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...(cityBaselines || []), ...customCities.filter(name => !(cityBaselines || []).some(city => city.city === name)).map(city => ({ city }))].sort((a, b) => a.city.localeCompare(b.city)).map((city) => (
                        <SelectItem key={city.city} value={city.city}>
                          {city.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-3 flex gap-2">
                    <Input value={customCity} onChange={(event) => setCustomCity(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleAddCustomCity()} placeholder="Enter another city" />
                    <Button type="button" variant="outline" onClick={handleAddCustomCity}>Add</Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Any city can be added; it uses a standard planning baseline if no local dataset exists.</p>
                </div>

                {/* Policy Levers */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">Policy Levers</h3>
                  {LEVER_CONFIG.map((config) => (
                    <div key={config.key}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-slate-600">{config.label}</label>
                        <span className="text-sm font-semibold text-slate-900">
                          {Math.round(levers[config.key as keyof typeof levers])}%
                        </span>
                      </div>
                      <Slider
                        value={[levers[config.key as keyof typeof levers]]}
                        onValueChange={(value) => handleLeverChange(config.key, value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* AI Optimizer */}
                <OptimizePanel
                  city={selectedCity}
                  onApply={(rec) => setLevers(rec as typeof levers)}
                />

                {/* Simulate Button */}
                <Button
                  onClick={handleSimulate}
                  disabled={simulateMutation.isPending}
                  className="w-full bg-emerald-700 text-white shadow-md hover:bg-emerald-800"
                  size="lg"
                >
                  {simulateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Waking up the server, please wait 30 seconds...
                    </>
                  ) : (
                    "Run Simulation"
                  )}
                </Button>

                {simulationResult && (
                  <Button
                    onClick={handleDownloadReport}
                    disabled={pdfReportMutation.isPending}
                    className="mt-2 w-full bg-slate-800 text-white hover:bg-slate-900"
                    size="lg"
                  >
                    {pdfReportMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Download Report</>
                    )}
                  </Button>
                )}

                {simulateMutation.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {simulateMutation.error.message}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-2 space-y-6">
            {simulationResult ? (
              <>
                {/* AI Explanation */}
                <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-emerald-700" /> AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLLM ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating AI insights...</span>
                      </div>
                    ) : (
                      <p className="text-slate-700 leading-relaxed">{llmExplanation || simulationResult.ai_explanation}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      title: "CO₂ Emissions",
                      unit: "MT",
                      result: simulationResult.co2_emissions,
                    },
                    {
                      title: "Air Quality (AQI)",
                      unit: "points",
                      result: simulationResult.aqi,
                    },
                    {
                      title: "Electricity Demand",
                      unit: "MWh",
                      result: simulationResult.electricity_demand,
                    },
                    {
                      title: "Green Score",
                      unit: "/100",
                      result: simulationResult.green_score,
                    },
                  ].map((metric) => (
                    <Card key={metric.title}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">{metric.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-slate-900">
                              {Math.round(metric.result.predicted * 10) / 10}
                            </span>
                            <span className="text-xs text-slate-500">{metric.unit}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const isPositive = metric.title === "Green Score" ? metric.result.direction === "up" : metric.result.direction === "down";
                              const isNeutral = metric.result.direction === "same";
                              if (isNeutral) return <><Minus className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-500">Move sliders to see impact</span></>;
                              return isPositive ? <><TrendingDown className={metric.title === "Green Score" ? "h-4 w-4 rotate-180 text-emerald-600" : "h-4 w-4 text-emerald-600"} /><span className="text-sm font-semibold text-emerald-600">{Math.abs(Math.round(metric.result.delta * 10) / 10)} {metric.title === "Green Score" ? "improvement" : "reduction"}</span></> : <><TrendingUp className={metric.title === "Green Score" ? "h-4 w-4 rotate-180 text-red-600" : "h-4 w-4 text-red-600"} /><span className="text-sm font-semibold text-red-600">{Math.abs(Math.round(metric.result.delta * 10) / 10)} {metric.title === "Green Score" ? "decline" : "increase"}</span></>;
                            })()}
                          </div>
                          <div className="text-xs text-slate-500">
                            Baseline: {Math.round(metric.result.baseline * 10) / 10}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Data Sources & Disclaimers */}
                <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <p><strong>Sources:</strong> CO₂ baseline: ~51 Mt (Published Study) | AQI: CPCB, updated live | Grid Factor: 0.710 tCO₂/MWh (CEA).</p>
                  <p><em>* This is a scenario estimate based on physical formulas, not a guaranteed prediction.</em></p>
                </div>

                {/* Policy Impact Score + Climate Risk Score */}
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

                {/* Feature Importance only (risk moved above) */}
                <div className="grid grid-cols-1 gap-4">
                  {simulatedBaselineLevers && (
                    <FeatureImportance levers={levers} baselineLevers={simulatedBaselineLevers} />
                  )}
                </div>

                {/* AI Policy Assistant */}
                <AIPolicyAssistant
                  city={selectedCity}
                  context={{
                    co2_emissions: simulationResult.co2_emissions.predicted,
                    aqi: simulationResult.aqi.predicted,
                    green_score: simulationResult.green_score.predicted,
                    electricity_demand: simulationResult.electricity_demand.predicted,
                  }}
                />

                {/* Economic + SDG */}
                {simulationResult && simulatedBaselineLevers && (
                  <EconomicPanel
                    levers={levers}
                    baselineLevers={simulatedBaselineLevers}
                    greenScore={simulationResult.green_score.predicted}
                    co2Reduction={simulationResult.co2_emissions.delta}
                    aqiReduction={simulationResult.aqi.delta}
                  />
                )}

                {/* Future Projection */}
                <ProjectionPanel city={selectedCity} levers={levers} />

                {/* Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Charts</CardTitle>
                    <CardDescription>Baseline vs. Simulated Scenario</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="co2" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="co2">CO₂</TabsTrigger>
                        <TabsTrigger value="aqi">AQI</TabsTrigger>
                        <TabsTrigger value="elec">Electricity</TabsTrigger>
                        <TabsTrigger value="green">Green Score</TabsTrigger>
                      </TabsList>

                      <TabsContent value="co2" className="mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="baseline_co2" fill="#94a3b8" name="Baseline CO₂" />
                            <Bar dataKey="predicted_co2" fill="#3b82f6" name="Predicted CO₂" />
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>

                      <TabsContent value="aqi" className="mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="baseline_aqi" fill="#94a3b8" name="Baseline AQI" />
                            <Bar dataKey="predicted_aqi" fill="#3b82f6" name="Predicted AQI" />
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>

                      <TabsContent value="elec" className="mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="baseline_elec" fill="#94a3b8" name="Baseline Electricity" />
                            <Bar dataKey="predicted_elec" fill="#3b82f6" name="Predicted Electricity" />
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>

                      <TabsContent value="green" className="mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="baseline_green" fill="#94a3b8" name="Baseline Green Score" />
                            <Bar dataKey="predicted_green" fill="#3b82f6" name="Predicted Green Score" />
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex h-96 items-center justify-center border-dashed border-emerald-200 bg-white/70">
                <div className="text-center">
                  <p className="text-slate-500 mb-4">Adjust policy levers and click "Run Simulation" to see results</p>
                  <Badge variant="outline">Ready to simulate</Badge>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Scenario Comparison */}
        {comparisonScenarios.length > 0 && (
          <div className="mt-6">
            <ScenarioComparison
              scenarios={comparisonScenarios}
              onClose={() => setComparisonScenarios([])}
            />
          </div>
        )}

        {/* Scenario Manager */}
        <div className="mt-6">
          <ScenarioManager
            scenarios={scenarios}
            onSaveScenario={handleSaveScenario}
            onDeleteScenario={handleDeleteScenario}
            onCompareScenarios={handleCompareScenarios}
            currentCity={selectedCity}
            currentLevers={levers}
            currentResults={simulationResult ? {
              co2_emissions: simulationResult.co2_emissions.predicted,
              aqi: simulationResult.aqi.predicted,
              electricity_demand: simulationResult.electricity_demand.predicted,
              green_score: simulationResult.green_score.predicted,
            } : undefined}
          />
        </div>

        {/* Data & Methodology — always visible */}
        <div className="mt-6">
          <DataMethodology />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-emerald-700" /> Recent simulations</CardTitle>
            <CardDescription>Your latest 20 runs are saved in this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            {simulationHistory.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {simulationHistory.map(item => <button key={item.id} type="button" onClick={() => { setSelectedCity(item.city); setLevers(item.levers as typeof levers); setSimulationResult(item.result); setLlmExplanation(null); }} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50">
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-900">{item.city}</span><RotateCcw className="h-4 w-4 text-emerald-700" /></div>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                <p className="mt-3 text-sm text-slate-700">Green Score: <strong>{item.result.green_score.predicted.toFixed(1)}</strong> · CO2: <strong>{item.result.co2_emissions.predicted.toFixed(1)}</strong></p>
              </button>)}
            </div> : <p className="py-4 text-sm text-slate-500">No simulations saved yet. Run a scenario and it will appear here.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
