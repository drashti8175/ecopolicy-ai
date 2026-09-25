import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const CURRENT_SOURCES = [
  { name: "Synthetic City Datasets", desc: "Generated baseline data for 100+ Indian cities using realistic planning parameters calibrated to CPCB and World Bank benchmarks." },
  { name: "Domain-Informed Simulation", desc: "Policy lever coefficients derived from peer-reviewed urban sustainability literature and Indian Smart Cities Mission reports." },
  { name: "ML Model Architecture", desc: "Random Forest regressors trained on synthetic data per city for CO₂, AQI, electricity demand, and green score prediction." },
];

const FUTURE_SOURCES = [
  { name: "CPCB Air Quality Data", url: "https://cpcb.nic.in", desc: "Real-time AQI from Central Pollution Control Board monitoring stations." },
  { name: "OpenAQ", url: "https://openaq.org", desc: "Open-source global air quality data with India coverage." },
  { name: "World Bank Climate Indicators", url: "https://data.worldbank.org", desc: "CO₂ emissions, energy use, and urban development metrics." },
  { name: "Ministry of New & Renewable Energy", url: "https://mnre.gov.in", desc: "Solar adoption and renewable energy statistics by state." },
  { name: "Smart Cities Mission Data", url: "https://smartcities.gov.in", desc: "Urban infrastructure and sustainability metrics for 100 smart cities." },
];

const METHODOLOGY = [
  { step: "01", title: "Baseline Establishment", desc: "Each city starts with calibrated baseline values for all 5 policy levers and 4 output metrics." },
  { step: "02", title: "Delta Computation", desc: "Simulation computes the change (Δ) between current slider values and baseline for each lever." },
  { step: "03", title: "Weighted Impact Model", desc: "Each Δ is multiplied by domain-calibrated coefficients (e.g. EV adoption: 9× CO₂ impact per %)." },
  { step: "04", title: "Composite Scoring", desc: "Policy Impact Score, Climate Risk Score, and SDG Alignment are computed as weighted composites." },
  { step: "05", title: "AI Augmentation", desc: "LLM generates natural language insights and optimizes lever combinations for user-selected goals." },
];

export function DataMethodology() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-slate-200">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-500" /> Data &amp; Methodology
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </CardTitle>
        {!open && <p className="text-xs text-slate-400 mt-1">Click to expand — data sources, simulation model, and future integrations</p>}
      </CardHeader>

      {open && (
        <CardContent className="space-y-6 pt-0">
          {/* Current */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Current Version</p>
            <div className="space-y-2">
              {CURRENT_SOURCES.map((s) => (
                <div key={s.name} className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology steps */}
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

          {/* Future */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Future Data Integrations</p>
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
            This project uses synthetic data for academic simulation purposes. Real-world deployment would integrate live government and open-source datasets listed above.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
