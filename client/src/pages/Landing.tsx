import React from "react";
import { useLocation } from "wouter";
import { Leaf, BarChart3, Brain, TrendingDown, Globe2, ArrowRight, Zap, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATS = [
  { value: "100+", label: "Indian Cities" },
  { value: "5", label: "Policy Levers" },
  { value: "4", label: "Climate Metrics" },
  { value: "AI", label: "Powered Insights" },
];

const FEATURES = [
  { icon: BarChart3, color: "text-primary", bg: "bg-primary/10", title: "Policy Simulation", desc: "Model CO₂, AQI, energy demand and green score impact from 5 policy levers in real time." },
  { icon: Brain, color: "text-secondary", bg: "bg-secondary/10", title: "AI Optimization", desc: "Let AI recommend the optimal policy mix for your chosen sustainability goal." },
  { icon: TrendingDown, color: "text-primary", bg: "bg-primary/10", title: "Future Projections", desc: "See 2026–2040 climate trajectories under business-as-usual vs. your proposed policy." },
  { icon: Shield, color: "text-secondary", bg: "bg-secondary/10", title: "Climate Risk Score", desc: "Quantified risk assessment with factor breakdown — from Low to Critical." },
  { icon: Target, color: "text-primary", bg: "bg-primary/10", title: "SDG Alignment", desc: "Automatically maps your policy to UN SDGs 7, 11, 12 and 13 with alignment scores." },
  { icon: Zap, color: "text-secondary", bg: "bg-secondary/10", title: "Economic Impact", desc: "Estimates investment required per policy lever in ₹ Crore with cost-benefit context." },
];

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane"];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground serif-heading">EcoPolicy AI</span>
        </div>
        <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-2 bg-secondary px-8 py-20 text-white shadow-2xl perspective-1000">
        {/* Abstract shapes for background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-teal-400 blur-3xl"></div>
        </div>
        
        <div className="relative max-w-3xl transform-style-3d floating-3d z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
            <Globe2 className="h-4 w-4" /> AI-Powered Urban Climate Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight transform-style-3d serif-heading text-white">
            Simulate. Analyze.<br />
            <span className="text-primary-foreground inline-block hover-3d cursor-default opacity-90">Optimize.</span>
          </h1>
          <p className="mt-5 text-lg text-secondary-foreground/80 max-w-xl leading-relaxed">
            Build sustainable Indian cities with AI-driven policy simulation. Model environmental impact, optimize for your goals, and generate professional climate reports.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg hover-3d transform-style-3d"
            >
              Start Simulation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm hover-3d transform-style-3d"
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* Floating city pills */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 opacity-50 transform-style-3d z-10">
          {CITIES.slice(0, 10).map((city, i) => (
            <div key={city} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm hover-3d cursor-default" style={{ transform: `translateZ(${i * 10}px)` }}>
              📍 {city}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-10 perspective-1000">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 transform-style-3d">
          {STATS.map((s) => (
            <div key={s.label} className="panel-elevated px-6 py-5 text-center hover-3d cursor-default transform-style-3d">
              <p className="text-3xl font-black text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-10 perspective-1000">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Platform Capabilities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transform-style-3d">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel-elevated p-6 transition-shadow hover-3d cursor-default transform-style-3d">
              <div className={`inline-flex rounded-xl ${f.bg} p-2.5 mb-4`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-foreground mb-1 serif-heading">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SDG Banner */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="panel-elevated px-8 py-6 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">UN SDG Alignment</p>
            <p className="text-foreground font-semibold mt-1">Every simulation maps to global sustainability goals</p>
          </div>
          <div className="flex flex-wrap gap-3 ml-auto">
            {[
              { id: 7, label: "Clean Energy" },
              { id: 11, label: "Sustainable Cities" },
              { id: 12, label: "Responsible Consumption" },
              { id: 13, label: "Climate Action" },
            ].map((sdg) => (
              <div key={sdg.id} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground">
                SDG {sdg.id} · {sdg.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-secondary px-8 py-12 text-center text-white">
          <div className="absolute inset-0 bg-primary/20"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-3 serif-heading text-white">Ready to build a sustainable city?</h2>
            <p className="text-secondary-foreground/80 mb-6">Model policies, optimize outcomes, and generate professional PDF reports.</p>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg"
            >
              Launch Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
