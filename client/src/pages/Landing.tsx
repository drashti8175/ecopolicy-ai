import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Leaf, BarChart3, Brain, TrendingDown, Globe2, ArrowRight, Zap, Shield, Target, Activity, Wind, Thermometer, Droplets, ChevronRight, Star, Award, Cpu, Map } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { trpc } from "@/lib/trpc";

const CITY_NAMES = ["Delhi", "Kolkata", "Mumbai", "Ahmedabad", "Bengaluru", "Chennai", "Hyderabad"];

function aqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#00aa63" };
  if (aqi <= 100) return { label: "Satisfactory", color: "#74a94d" };
  if (aqi <= 200) return { label: "Moderate", color: "#d6a900" };
  if (aqi <= 300) return { label: "Poor", color: "#e87520" };
  if (aqi <= 400) return { label: "Very Poor", color: "#d84040" };
  return { label: "Severe", color: "#8b1e3f" };
}

const FEATURES = [
  { icon: BarChart3, color: "#00ffff", title: "Policy Scenario Explorer", desc: "Compare modeled CO₂, AQI, energy demand and score changes using documented planning assumptions." },
  { icon: Brain, color: "#a855f7", title: "Policy Optimizer", desc: "Explore policy-lever combinations for CO₂ reduction, AQI improvement, or balanced sustainability using the app's scenario formulas." },
  { icon: TrendingDown, color: "#00ff88", title: "Illustrative Projections", desc: "Explore scenario trajectories as planning projections, not measured outcomes or guaranteed forecasts." },
  { icon: Shield, color: "#ffc800", title: "Planning Risk Indicator", desc: "A composite planning score from modeled emissions, air quality, green cover, and energy demand; not an official risk assessment." },
  { icon: Map, color: "#00ffff", title: "India Interactive Map", desc: "Visual city selector with transparent AQI status and city-level environmental planning data." },
  { icon: Target, color: "#a855f7", title: "SDG Planning View", desc: "Relate selected policy themes to SDGs 7, 11, 12, and 13; scores are illustrative, not UN assessments." },
  { icon: Zap, color: "#00ff88", title: "Economic Scenario Analysis", desc: "Compare illustrative investment and emissions assumptions; validate costs and benefits with local project data." },
  { icon: Cpu, color: "#ffc800", title: "Policy Lever Drivers", desc: "Inspect the scenario model's assumed lever weights; these are not trained-ML feature importance scores." },
  { icon: Activity, color: "#00ffff", title: "Scenario Comparison", desc: "Save unlimited policy scenarios and compare them side-by-side on all 4 climate metrics simultaneously." },
];

const TECH_STACK = ["Open-Meteo PM2.5 estimate", "Planning assumptions", "Scenario formulas", "tRPC + React"];

// Particle canvas component
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,255,255,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// Animated counter
function AnimatedNumber({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const num = parseFloat(target.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) { setDisplay(target); return; }
    let start = 0;
    const duration = 1200;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = (num * ease).toFixed(target.includes(".") ? 1 : 0);
      setDisplay(target.replace(/[0-9.]+/, current));
      if (progress < 1) requestAnimationFrame((ts) => step(ts, startTime));
    };
    requestAnimationFrame((ts) => step(ts, ts));
  }, [target]);
  return <>{display}{suffix}</>;
}

export default function Landing() {
  const [, navigate] = useLocation();
  const [tickerIdx, setTickerIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const { data: currentAqiReadings = [] } = trpc.simulation.currentAqi.useQuery(
    { cities: CITY_NAMES },
    { refetchInterval: 15 * 60 * 1000 }
  );

  useEffect(() => {
    setVisible(true);
    const interval = setInterval(() => setTickerIdx((i) => (i + 1) % CITY_NAMES.length), 2000);
    return () => clearInterval(interval);
  }, []);

  const currentCity = CITY_NAMES[tickerIdx] || "Ahmedabad";
  const currentAQI = currentAqiReadings.find((reading) => reading.city === currentCity);
  const currentAQIStatus = currentAQI ? aqiCategory(currentAQI.aqi) : { label: "Unavailable", color: "#64748b" };
  const aqiProvenance = [
    { label: "Source", value: currentAQI?.source || "Waiting for current response" },
    { label: "Location", value: currentAQI?.location || "Not available" },
    { label: "Updated", value: currentAQI?.updated_at || "Not available" },
    { label: "Classification", value: currentAQI?.kind === "station-observation" ? "CPCB station observation" : currentAQI?.kind === "model-estimate" ? "Model estimate, not a station reading" : "Planning baseline or unavailable" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Current AQI estimate ticker ── */}
      <div className="w-full bg-card/60 border-b border-border/40 backdrop-blur-sm py-2 px-4 flex items-center gap-4 text-xs overflow-hidden">
        <span className="flex-shrink-0 font-bold text-sky-300">● {currentAQI?.kind === "station-observation" ? "STATION OBSERVATION" : currentAQI?.kind === "model-estimate" ? "MODEL ESTIMATE" : currentAQI ? "PLANNING BASELINE" : "CONNECTING"}</span>
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide flex-1">
          {CITY_NAMES.map((city) => {
            const reading = currentAqiReadings.find((item) => item.city === city);
            const status = reading ? aqiCategory(reading.aqi) : null;
            return (
              <div key={city} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-muted-foreground">{city}</span>
                <span className="font-bold" style={{ color: status?.color || "#64748b" }}>{reading ? `AQI estimate ${Math.round(reading.aqi)}` : "Loading"}</span>
                {status && <span className="text-muted-foreground/60">· {status.label}</span>}
              </div>
            );
          })}
        </div>
        <div className="flex-shrink-0 text-muted-foreground/60">Open-Meteo model · not CPCB station data</div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center pulse-ring">
              <Leaf className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black text-foreground tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>EcoPolicy<span className="text-primary">Platform</span></span>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">India Climate Intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hover:text-primary cursor-pointer transition-colors">Features</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Data Sources</span>
            <span className="hover:text-primary cursor-pointer transition-colors">SDGs</span>
          </div>
          <ThemeToggle />
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-neon text-sm px-5 py-2 flex items-center gap-2"
          >
            Open Platform <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative hero-bg grid-overlay min-h-[90vh] flex items-center overflow-hidden">
        <ParticleField />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full glass text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30">
              <Globe2 className="h-3 w-3" />
              AI-Powered Urban Climate Intelligence Platform
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="text-foreground">Shape</span>{" "}
              <br />
              <span className="glow-text">India's</span>
              <br />
              <span className="text-foreground">Climate</span>
              <br />
              <span className="text-primary">Future.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mb-8">
              Compare city sustainability policy scenarios. The dashboard combines a timestamped air-quality estimate where available with clearly labeled planning assumptions and modeled outcomes.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105"
                style={{ background: "linear-gradient(135deg, hsl(180,100%,50%), hsl(220,80%,60%))", color: "#020b14", boxShadow: "0 0 30px rgba(0,255,255,0.3)" }}
              >
                <Cpu className="h-5 w-5" />
                Launch Simulation Platform
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-neon flex items-center gap-2 text-sm"
              >
                <Activity className="h-4 w-4" />
                Live Demo
              </button>
            </div>
            {/* Tech stack pills */}
            <div className="flex flex-wrap gap-2">
              {TECH_STACK.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-medium glass border border-border/60 text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live Climate Panel */}
          <div className={`transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="glass rounded-2xl p-6 border-gradient glow-primary floating">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="section-label mb-1">Current AQI-style estimate</div>
                  <div className="text-xl font-bold text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>{currentCity}</div>
                </div>
                <div className="text-[10px] font-bold text-sky-300">● MODEL ESTIMATE</div>
              </div>

              {/* Big AQI */}
              <div className="mb-6 p-4 rounded-xl" style={{ background: `${currentAQIStatus.color}15`, border: `1px solid ${currentAQIStatus.color}30` }}>
                <div className="flex items-end gap-3">
                  <div className="text-6xl font-black" style={{ color: currentAQIStatus.color, fontFamily: 'Orbitron, sans-serif', textShadow: `0 0 20px ${currentAQIStatus.color}80` }}>
                    {currentAQI ? Math.round(currentAQI.aqi) : "--"}
                  </div>
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground">AQI-style estimate</div>
                    <div className="text-sm font-bold" style={{ color: currentAQIStatus.color }}>{currentAQIStatus.label}</div>
                    <div className="text-xs text-muted-foreground">Converted from current PM2.5 model data</div>
                  </div>
                </div>
                {/* AQI scale bar */}
                <div className="mt-3 h-2 rounded-full" style={{ background: "linear-gradient(90deg, #00ff88, #ffc800, #ff8800, #ff4444)" }}>
                  <div className="relative h-full">
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-card shadow-lg transition-all duration-500"
                      style={{ left: `${Math.min(((currentAQI?.aqi || 0) / 500) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Good</span><span>Moderate</span><span>Poor</span><span>Critical</span>
                </div>
              </div>

              {/* AQI provenance */}
              <div className="grid grid-cols-2 gap-3">
                {aqiProvenance.map((item) => (
                  <div key={item.label} className="glass-bright rounded-xl p-3 min-w-0">
                    <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                    <div className="text-xs font-semibold text-foreground break-words">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* CTA inside panel */}
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-4 w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, rgba(0,255,255,0.15), rgba(168,85,247,0.15))", border: "1px solid rgba(0,255,255,0.3)", color: "hsl(180,100%,50%)" }}
              >
                Simulate This City <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="landing-fade absolute bottom-0 left-0 right-0 h-32 pointer-events-none" />
      </section>

      {/* ── Global Stats Strip ── */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { val: "15+", label: "Indian Cities", icon: Map },
              { val: "5", label: "Policy Levers", icon: Target },
              { val: "4", label: "Climate Metrics", icon: Activity },
              { val: "2040", label: "Projection Horizon", icon: TrendingDown },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <s.icon className="h-4 w-4 text-primary mb-1" />
                <div className="text-3xl font-black glow-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>{s.val}</div>
                <div className="text-xs text-muted-foreground tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="section-label justify-center mb-4" style={{ fontSize: "0.65rem" }}>Platform Capabilities</div>
          <h2 className="text-3xl lg:text-5xl font-black text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Built for <span className="glow-text">Real Impact</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm">
            Use the live air-quality estimate and inspect the assumptions behind every modeled scenario.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass card-3d rounded-2xl p-6 group cursor-default" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">{f.title}</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${f.color}30, transparent)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="glass rounded-3xl p-8 border-gradient">
          <div className="section-label mb-6">Data Sources & Methodology</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🌫️", title: "Current air-quality input", desc: "Open-Meteo current PM2.5 model estimate at approximate city-center coordinates, converted to an AQI-style index. Not a CPCB station reading." },
              { icon: "🏙️", title: "City planning baselines", desc: "Stored in data/city_baselines.json. The project does not record verified publication sources, city boundary, or reference year for these values." },
              { icon: "🧮", title: "Scenario formulas", desc: "Hand-coded relationships and coefficients produce planning projections. They have not been validated against observed policy outcomes." },
              { icon: "🏛️", title: "CPCB official AQI dataset", desc: "The official hourly station dataset is a potential integration. A valid API request, Ahmedabad station record, field schema, and timestamp freshness still need verification." },
            ].map((d) => (
              <div key={d.title} className="flex gap-3 p-4 rounded-xl" style={{ background: "rgba(0,255,255,0.04)", border: "1px solid rgba(0,255,255,0.08)" }}>
                <span className="text-2xl">{d.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">{d.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDG Section ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 7, emoji: "⚡", title: "Clean Energy", desc: "Solar adoption & energy demand optimization aligns with universal clean energy access.", color: "#ffc800" },
            { id: 11, emoji: "🏙️", title: "Sustainable Cities", desc: "Public transport, urban trees, and livability metrics for future-ready Indian cities.", color: "#00ffff" },
            { id: 12, emoji: "♻️", title: "Responsible Consumption", desc: "Plastic recycling rates and waste reduction modeled at the city scale.", color: "#00ff88" },
            { id: 13, emoji: "🌍", title: "Climate Action", desc: "Direct CO₂ reduction, carbon sequestration and GHG emission trajectory modeling.", color: "#a855f7" },
          ].map((sdg) => (
            <div key={sdg.id} className="glass-bright rounded-2xl p-6 card-3d text-center">
              <div className="text-3xl mb-3">{sdg.emoji}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: sdg.color }}>SDG {sdg.id}</div>
              <div className="font-bold text-foreground text-sm mb-2">{sdg.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{sdg.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl p-12 text-center glass-bright glow-primary">
          <div className="absolute inset-0 grid-overlay opacity-30" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs font-bold" style={{ background: "rgba(0,255,255,0.1)", border: "1px solid rgba(0,255,255,0.3)", color: "hsl(180,100%,50%)" }}>
              <Award className="h-3 w-3" /> Built for India · Aligned to UN SDGs
            </div>
            <h2 className="text-3xl lg:text-5xl font-black text-foreground mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Start Simulating <span className="glow-text">Now</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
              Model real policies, compare scenarios, get AI recommendations — and download a professional climate report instantly.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, hsl(180,100%,50%), hsl(220,80%,60%))", color: "#020b14", boxShadow: "0 0 40px rgba(0,255,255,0.4)" }}
            >
              <Cpu className="h-5 w-5" />
              Launch EcoPolicy Platform
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-3 w-3 text-primary" />
          <span className="font-bold text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>EcoPolicy<span className="text-primary">Platform</span></span>
        </div>
        <p>Air quality: Open-Meteo model estimates when available · Other city metrics: planning assumptions and scenario formulas</p>
        <p className="mt-1 text-muted-foreground/50">Designed for India's sustainable urban future · UN SDGs 7, 11, 12, 13</p>
      </footer>
    </div>
  );
}
