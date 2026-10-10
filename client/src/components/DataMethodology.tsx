import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const CURRENT_SOURCES = [
  { name: "City Planning Baselines", desc: "Calibrated from Smart Cities Mission reports, CPCB annual bulletins, and World Bank urban development indicators for 15 major Indian cities + 70+ additional cities." },
  { name: "Live AQI — Open-Meteo", desc: "Current PM2.5 model estimate fetched in real-time for 15 cities via Open-Meteo Air Quality API (no key required), converted to India AQI scale. Cached 15 min. Labeled as model-estimate, not a CPCB station reading." },
  { name: "Grid Emission Factor", desc: "0.710 tCO₂/MWh — Central Electricity Authority (CEA) National Electricity Plan grid emission factor for India." },
  { name: "Tree Sequestration Rate", desc: "0.021 tCO₂/tree/year — urban forestry estimate from peer-reviewed literature used for afforestation impact modeling." },
];

const METHODOLOGY = [
  { step: "01", title: "Baseline Establishment", desc: "Each city starts with calibrated baseline values for 5 policy levers and 4 output metrics sourced from government and international datasets." },
  { step: "02", title: "Delta Computation", desc: "Simulation computes Δ between current slider values and city baseline for each lever." },
  { step: "03", title: "Weighted Impact Model", desc: "Each Δ is multiplied by domain-calibrated coefficients (EV: 9× CO₂ per %, Solar: 4×, Transport: 7×, Trees: 3×, Recycling: 1×)." },
  { step: "04", title: "Live AQI Integration", desc: "For the simulate endpoint, live PM2.5 is fetched from Open-Meteo and policy AQI delta is applied on top of the real-time reading." },
  { step: "05", title: "Composite Scoring", desc: "Policy Impact Score, Climate Risk Score, and SDG Alignment are computed as weighted composites of the 4 output metrics." },
  { step: "06", title: "AI Augmentation", desc: "LLM generates natural language insights; grid-search optimizer finds the best lever combination for user-selected sustainability goals." },
];

const FUTURE_SOURCES = [
  { name: "CPCB Real-Time AQI", url: "https://cpcb.nic.in", desc: "Official hourly station observations via data.gov.in API. Requires verified API key and resource ID." },
  { name: "OpenAQ", url: "https://openaq.org", desc: "Open-source global air quality platform with India coverage for cross-validation." },
  { name: "World Bank Climate Indicators", url: "https://data.worldbank.org", desc: "CO₂ emissions, energy use, and urban development metrics for city-level calibration." },
  { name: "Ministry of New & Renewable Energy", url: "https://mnre.gov.in", desc: "State-wise solar adoption and renewable energy statistics." },
  { name: "Smart Cities Mission Data Portal", url: "https://smartcities.gov.in", desc: "Urban infrastructure and sustainability metrics for 100 smart cities." },
];

export function DataMethodology() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-slate-200">
      <CardHeader className="cursor-pointer select-none" onClick={() => setOpen((v) => !v)}>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-500" /> Data &amp; Methodology
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </CardTitle>
        {!open && <p className="text-xs text-slate-400 mt-1">Data sources · simulation model · future integrations — click to expand</p>}
      </CardHeader>

      {open && (
        <CardContent className="space-y-6 pt-0">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Current Data Sources</p>
            <div className="space-y-2">
              {CURRENT_SOURCES.map((s) => (
                <div key={s.name} className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Simulation Methodology</p>
            <div className="space-y-2">
              {METHODOLOGY.map((m) => (
                <div key={m.step} className="flex gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <span className="text-xs font-black text-emerald-400 mt-0.5 shrink-0">{m.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{m.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Planned Future Integrations</p>
            <div className="space-y-2">
              {FUTURE_SOURCES.map((s) => (
                <div key={s.name} className="flex items-start justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="ml-3 shrink-0 text-blue-400 hover:text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            Simulation outputs are scenario projections for comparative policy analysis, not deterministic forecasts or observed outcomes. AQI is labeled by source type on each result card.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
