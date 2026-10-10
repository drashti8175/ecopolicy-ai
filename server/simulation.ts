import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ─── City Baselines ───────────────────────────────────────────────────────────
// Sources: Smart Cities Mission reports, CPCB planning data, CEA grid factor 0.710 tCO₂/MWh
// All values are planning baselines for scenario comparison, not live measurements.
const BASELINES: Record<string, {
  ev_adoption_pct: number; solar_adoption_pct: number; trees_planted_pct: number;
  plastic_recycling_pct: number; public_transport_usage_pct: number;
  co2_emissions: number; aqi: number; electricity_demand: number; green_score: number;
}> = {
  Delhi:     { ev_adoption_pct: 12, solar_adoption_pct: 8,  trees_planted_pct: 23, plastic_recycling_pct: 55, public_transport_usage_pct: 45, co2_emissions: 1000, aqi: 220, electricity_demand: 1500, green_score: 40 },
  Ahmedabad: { ev_adoption_pct: 7,  solar_adoption_pct: 18, trees_planted_pct: 13, plastic_recycling_pct: 65, public_transport_usage_pct: 30, co2_emissions: 700,  aqi: 140, electricity_demand: 1000, green_score: 60 },
  Surat:     { ev_adoption_pct: 6,  solar_adoption_pct: 22, trees_planted_pct: 4,  plastic_recycling_pct: 65, public_transport_usage_pct: 28, co2_emissions: 500,  aqi: 110, electricity_demand: 800,  green_score: 70 },
  Mumbai:    { ev_adoption_pct: 10, solar_adoption_pct: 12, trees_planted_pct: 18, plastic_recycling_pct: 60, public_transport_usage_pct: 55, co2_emissions: 850,  aqi: 160, electricity_demand: 1400, green_score: 52 },
  Bengaluru: { ev_adoption_pct: 14, solar_adoption_pct: 20, trees_planted_pct: 28, plastic_recycling_pct: 58, public_transport_usage_pct: 38, co2_emissions: 620,  aqi: 130, electricity_demand: 950,  green_score: 65 },
  Chennai:   { ev_adoption_pct: 8,  solar_adoption_pct: 25, trees_planted_pct: 20, plastic_recycling_pct: 62, public_transport_usage_pct: 42, co2_emissions: 580,  aqi: 120, electricity_demand: 900,  green_score: 63 },
  Kolkata:   { ev_adoption_pct: 6,  solar_adoption_pct: 10, trees_planted_pct: 15, plastic_recycling_pct: 50, public_transport_usage_pct: 50, co2_emissions: 750,  aqi: 175, electricity_demand: 1100, green_score: 48 },
  Pune:      { ev_adoption_pct: 11, solar_adoption_pct: 16, trees_planted_pct: 22, plastic_recycling_pct: 60, public_transport_usage_pct: 35, co2_emissions: 550,  aqi: 125, electricity_demand: 850,  green_score: 62 },
  Hyderabad: { ev_adoption_pct: 9,  solar_adoption_pct: 19, trees_planted_pct: 20, plastic_recycling_pct: 58, public_transport_usage_pct: 36, co2_emissions: 600,  aqi: 135, electricity_demand: 920,  green_score: 61 },
  Jaipur:    { ev_adoption_pct: 5,  solar_adoption_pct: 22, trees_planted_pct: 10, plastic_recycling_pct: 52, public_transport_usage_pct: 28, co2_emissions: 480,  aqi: 150, electricity_demand: 750,  green_score: 55 },
  Lucknow:   { ev_adoption_pct: 5,  solar_adoption_pct: 10, trees_planted_pct: 12, plastic_recycling_pct: 48, public_transport_usage_pct: 30, co2_emissions: 520,  aqi: 165, electricity_demand: 780,  green_score: 50 },
  Kanpur:    { ev_adoption_pct: 4,  solar_adoption_pct: 8,  trees_planted_pct: 8,  plastic_recycling_pct: 45, public_transport_usage_pct: 25, co2_emissions: 560,  aqi: 180, electricity_demand: 820,  green_score: 44 },
  Nagpur:    { ev_adoption_pct: 7,  solar_adoption_pct: 18, trees_planted_pct: 18, plastic_recycling_pct: 55, public_transport_usage_pct: 30, co2_emissions: 430,  aqi: 130, electricity_demand: 680,  green_score: 58 },
  Indore:    { ev_adoption_pct: 8,  solar_adoption_pct: 20, trees_planted_pct: 16, plastic_recycling_pct: 60, public_transport_usage_pct: 32, co2_emissions: 410,  aqi: 125, electricity_demand: 650,  green_score: 62 },
  Agra:      { ev_adoption_pct: 4,  solar_adoption_pct: 12, trees_planted_pct: 10, plastic_recycling_pct: 45, public_transport_usage_pct: 25, co2_emissions: 440,  aqi: 170, electricity_demand: 680,  green_score: 46 },
};

const DEFAULT_BASELINE = {
  ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15,
  plastic_recycling_pct: 55, public_transport_usage_pct: 35,
  co2_emissions: 650, aqi: 145, electricity_demand: 950, green_score: 58,
};

// Additional cities all use the default baseline
const EXTRA_CITIES = [
  "Agartala","Ajmer","Aligarh","Allahabad","Amaravati","Amritsar","Aurangabad","Bareilly",
  "Belagavi","Bhopal","Bhubaneswar","Chandigarh","Coimbatore","Davanagere","Dehradun",
  "Erode","Faridabad","Gandhinagar","Ghaziabad","Gwalior","Guwahati","Hubballi-Dharwad",
  "Imphal","Jabalpur","Jalandhar","Jammu","Jamnagar","Jamshedpur","Jhansi","Jodhpur",
  "Kakinada","Karnal","Kochi","Kota","Kozhikode","Kurnool","Ludhiana","Madurai",
  "Mangaluru","Meerut","Moradabad","Muzaffarpur","Nashik","Patna","Pimpri Chinchwad",
  "Prayagraj","Puducherry","Raipur","Rajkot","Ranchi","Rourkela","Salem","Shillong",
  "Shimla","Shivamogga","Siliguri","Solapur","Thane","Thanjavur","Thiruvananthapuram",
  "Tiruchirappalli","Tirunelveli","Tiruppur","Tumakuru","Udaipur","Ujjain","Vadodara",
  "Varanasi","Vellore","Visakhapatnam",
];

const allBaselines: Record<string, typeof DEFAULT_BASELINE> = {
  ...BASELINES,
  ...Object.fromEntries(EXTRA_CITIES.map((c) => [c, { ...DEFAULT_BASELINE }])),
};

function getBaseline(city: string) {
  return allBaselines[city.trim()] ?? DEFAULT_BASELINE;
}

// ─── Simulation Coefficients ──────────────────────────────────────────────────
// Calibrated so realistic lever changes produce meaningful deltas.
// e.g. EV 8%→40% (Δ32) → CO₂ −288 MT on Delhi baseline of 1000 MT ≈ −29%
const COEFF = {
  co2:   { ev: 9,   solar: 4,  transport: 7,  trees: 3,  recycling: 1   },
  aqi:   { ev: 3.5, solar: 0.5,transport: 2.5,trees: 1.8,recycling: 0.3 },
  elec:  { solar: 10, ev: 3 },  // solar reduces, EV increases
  green: { ev: 0.7, solar: 0.6, trees: 0.5, recycling: 0.35, transport: 0.6 },
};

// Sync — used for grid search (optimize / recommend / projection)
function runSimulationSync(city: string, levers: Record<string, number>) {
  const b = getBaseline(city);
  const d = {
    ev:       levers.ev_adoption_pct            - b.ev_adoption_pct,
    solar:    levers.solar_adoption_pct         - b.solar_adoption_pct,
    trees:    levers.trees_planted_pct          - b.trees_planted_pct,
    recycling:levers.plastic_recycling_pct      - b.plastic_recycling_pct,
    transport:levers.public_transport_usage_pct - b.public_transport_usage_pct,
  };
  return {
    co2_emissions:     Math.max(50,  b.co2_emissions     - d.ev*COEFF.co2.ev   - d.solar*COEFF.co2.solar   - d.transport*COEFF.co2.transport   - d.trees*COEFF.co2.trees   - d.recycling*COEFF.co2.recycling),
    aqi:               Math.max(30,  b.aqi               - d.ev*COEFF.aqi.ev   - d.solar*COEFF.aqi.solar   - d.transport*COEFF.aqi.transport   - d.trees*COEFF.aqi.trees   - d.recycling*COEFF.aqi.recycling),
    electricity_demand:Math.max(100, b.electricity_demand - d.solar*COEFF.elec.solar + d.ev*COEFF.elec.ev),
    green_score:       Math.max(0, Math.min(100, b.green_score + d.ev*COEFF.green.ev + d.solar*COEFF.green.solar + d.trees*COEFF.green.trees + d.recycling*COEFF.green.recycling + d.transport*COEFF.green.transport)),
  };
}

// ─── Live AQI (Open-Meteo, no API key needed) ─────────────────────────────────
const COORDS: Record<string, [number, number]> = {
  Delhi:[28.6139,77.2090], Mumbai:[19.0760,72.8777], Bengaluru:[12.9716,77.5946],
  Hyderabad:[17.3850,78.4867], Ahmedabad:[23.0225,72.5714], Chennai:[13.0827,80.2707],
  Kolkata:[22.5726,88.3639], Surat:[21.1702,72.8311], Pune:[18.5204,73.8567],
  Jaipur:[26.9124,75.7873], Lucknow:[26.8467,80.9462], Kanpur:[26.4499,80.3319],
  Nagpur:[21.1458,79.0882], Indore:[22.7196,75.8577], Agra:[27.1767,78.0081],
  // Extended coverage
  Nashik:[20.0059,73.7898], Belagavi:[15.8497,74.4977], Navsari:[20.9467,72.9520],
  Patna:[25.5941,85.1376], Rajkot:[22.3039,70.8022],
  Vadodara:[22.3072,73.1812], Bhopal:[23.2599,77.4126], Visakhapatnam:[17.6868,83.2185],
  Coimbatore:[11.0168,76.9558], Madurai:[9.9252,78.1198], Kochi:[9.9312,76.2673],
  Chandigarh:[30.7333,76.7794], Guwahati:[26.1445,91.7362], Bhubaneswar:[20.2961,85.8245],
  Thiruvananthapuram:[8.5241,76.9366], Ranchi:[23.3441,85.3096], Raipur:[21.2514,81.6296],
  Jodhpur:[26.2389,73.0243], Ghaziabad:[28.6692,77.4538], Faridabad:[28.4089,77.3178],
  Meerut:[28.9845,77.7064], Varanasi:[25.3176,82.9739], Amritsar:[31.6340,74.8723],
  Jabalpur:[23.1815,79.9864], Aurangabad:[19.8762,75.3433], Solapur:[17.6599,75.9064],
  Thane:[19.2183,72.9781], Pimpri:[18.6279,73.8009], Ludhiana:[30.9010,75.8573],
  Dehradun:[30.3165,78.0322], Shimla:[31.1048,77.1734], Udaipur:[24.5854,73.7125],
  Kota:[25.2138,75.8648], Gwalior:[26.2183,78.1828], Tiruchirappalli:[10.7905,78.7047],
};

const AQI_CACHE: Record<string, { ts: number; aqi: number; label: string }> = {};

function pm25ToAqi(pm25: number): number {
  const bands = [[0,30,0,50],[31,60,51,100],[61,90,101,200],[91,120,201,300],[121,250,301,400],[251,500,401,500]] as const;
  const b = bands.find((x) => pm25 <= x[1]) ?? bands[bands.length - 1];
  return Math.round(((b[3]-b[2])/(b[1]-b[0]))*(pm25-b[0])+b[2]);
}

async function fetchLiveAqi(city: string, fallback: number): Promise<{ aqi: number; label: string }> {
  const cached = AQI_CACHE[city];
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached;

  const coords = COORDS[city];

  // 1️⃣ Try Open-Meteo (no key needed)
  if (coords) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords[0]}&longitude=${coords[1]}&current=pm2_5,us_aqi&timezone=Asia%2FKolkata`,
        { signal: ctrl.signal }
      );
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json() as any;
        const usAqi = Number(data?.current?.us_aqi);
        const pm25  = Number(data?.current?.pm2_5);
        const aqiValue = (Number.isFinite(usAqi) && usAqi > 0) ? usAqi
          : (Number.isFinite(pm25) && pm25 >= 0) ? pm25ToAqi(pm25) : NaN;
        if (Number.isFinite(aqiValue)) {
          const result = { aqi: Math.round(aqiValue), label: "model-estimate", ts: Date.now() };
          AQI_CACHE[city] = result;
          return result;
        }
      }
    } catch (err) {
      console.warn(`[AQI] Open-Meteo failed for ${city}:`, err);
    }
  }

  // 2️⃣ Fallback: WAQI API (free key, covers 1000s of Indian cities)
  const waqiKey = process.env.WAQI_API_KEY;
  if (waqiKey) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(
        `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${waqiKey}`,
        { signal: ctrl.signal }
      );
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json() as any;
        const aqiValue = Number(data?.data?.aqi);
        if (data?.status === "ok" && Number.isFinite(aqiValue) && aqiValue > 0) {
          const result = { aqi: Math.round(aqiValue), label: "model-estimate", ts: Date.now() };
          AQI_CACHE[city] = result;
          return result;
        }
      }
    } catch (err) {
      console.warn(`[AQI] WAQI failed for ${city}:`, err);
    }
  }

  console.warn(`[AQI] All sources failed for ${city}, using planning baseline ${fallback}`);
  return { aqi: fallback, label: "planning-baseline" };
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
const PolicyLeversSchema = z.object({
  ev_adoption_pct: z.number().min(0).max(100),
  solar_adoption_pct: z.number().min(0).max(100),
  trees_planted_pct: z.number().min(0).max(100),
  plastic_recycling_pct: z.number().min(0).max(100),
  public_transport_usage_pct: z.number().min(0).max(100),
});

const SimulationRequestSchema = z.object({
  city: z.string().trim().min(2).max(80),
  levers: PolicyLeversSchema,
});

const MetricResultSchema = z.object({
  baseline: z.number(), predicted: z.number(), delta: z.number(),
  direction: z.enum(["up", "down", "same"]),
});

const SimulationResponseSchema = z.object({
  city: z.string(),
  co2_emissions: MetricResultSchema,
  aqi: MetricResultSchema,
  electricity_demand: MetricResultSchema,
  green_score: MetricResultSchema,
  ai_explanation: z.string(),
  aqi_source: z.string(),
  data_provenance: z.object({
    source: z.string(),
    location: z.string(),
    updated_at: z.string(),
    measurement_period: z.string(),
    is_live: z.boolean(),
    kind: z.enum(["station-observation", "model-estimate", "planning-baseline"]),
    note: z.string(),
  }),
});

function metricResult(baseline: number, predicted: number) {
  const delta = predicted - baseline;
  return { baseline, predicted, delta, direction: (delta > 0.01 ? "up" : delta < -0.01 ? "down" : "same") as "up"|"down"|"same" };
}

function aiExplanation(city: string, baselineCo2: number, baselineAqi: number, baselineGs: number, predictedCo2: number, predictedAqi: number, predictedGs: number) {
  const co2Pct = (((baselineCo2 - predictedCo2) / baselineCo2) * 100).toFixed(1);
  const aqiPct = (((baselineAqi - predictedAqi) / baselineAqi) * 100).toFixed(1);
  const gsDelta = (predictedGs - baselineGs).toFixed(1);
  return `Projected scenario for ${city}: CO₂ emissions ${parseFloat(co2Pct) >= 0 ? "reduced" : "increased"} by ${Math.abs(parseFloat(co2Pct))}%, AQI ${parseFloat(aqiPct) >= 0 ? "improved" : "worsened"} by ${Math.abs(parseFloat(aqiPct))}%, and Green Score ${parseFloat(gsDelta) >= 0 ? "improved" : "declined"} by ${Math.abs(parseFloat(gsDelta))} points. Results are scenario projections based on planning coefficients, not observed outcomes.`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const simulationRouter = router({
  cities: publicProcedure.query(() =>
    Object.entries(allBaselines).map(([city, d]) => ({ city, ...d }))
  ),

  simulate: publicProcedure
    .input(SimulationRequestSchema)
    .output(SimulationResponseSchema)
    .mutation(async ({ input }) => {
      const { city, levers } = input;
      const b = getBaseline(city);
      const p = runSimulationSync(city, levers);

      // Fetch live AQI only for the simulate endpoint (not grid search)
      const liveAqi = await fetchLiveAqi(city, b.aqi);
      // Apply policy delta on top of live AQI reading
      const aqiDelta = p.aqi - b.aqi;
      const predictedAqi = Math.max(30, liveAqi.aqi + aqiDelta);

      return {
        city,
        co2_emissions: metricResult(b.co2_emissions, p.co2_emissions),
        aqi: metricResult(liveAqi.aqi, predictedAqi),
        electricity_demand: metricResult(b.electricity_demand, p.electricity_demand),
        green_score: metricResult(b.green_score, p.green_score),
        ai_explanation: aiExplanation(city, b.co2_emissions, liveAqi.aqi, b.green_score, p.co2_emissions, predictedAqi, p.green_score),
        aqi_source: liveAqi.label,
        data_provenance: {
          source: liveAqi.label === "model-estimate" ? "Open-Meteo current PM2.5 model estimate" : "Stored planning baseline",
          location: COORDS[city] ? `City-center coordinates (${COORDS[city][0]}, ${COORDS[city][1]})` : city,
          updated_at: new Date().toISOString(),
          measurement_period: liveAqi.label === "model-estimate" ? `Current model estimate at ${new Date().toISOString()}` : "No observation period available",
          is_live: liveAqi.label === "model-estimate",
          kind: liveAqi.label as "station-observation" | "model-estimate" | "planning-baseline",
          note: liveAqi.label === "model-estimate"
            ? "PM2.5 model estimate converted to AQI scale. Not a CPCB station reading. Use for scenario comparison only."
            : "No live data available. This is a planning baseline for scenario comparison, not current air quality.",
        },
      };
    }),

  compare: publicProcedure
    .input(z.object({ scenario1: SimulationRequestSchema, scenario2: SimulationRequestSchema }))
    .output(z.object({ scenario1: SimulationResponseSchema, scenario2: SimulationResponseSchema }))
    .mutation(async ({ input }) => {
      const run = async (req: typeof input.scenario1) => {
        const b = getBaseline(req.city);
        const p = runSimulationSync(req.city, req.levers);
        const liveAqi = await fetchLiveAqi(req.city, b.aqi);
        const predictedAqi = Math.max(30, liveAqi.aqi + (p.aqi - b.aqi));
        return {
          city: req.city,
          co2_emissions: metricResult(b.co2_emissions, p.co2_emissions),
          aqi: metricResult(liveAqi.aqi, predictedAqi),
          electricity_demand: metricResult(b.electricity_demand, p.electricity_demand),
          green_score: metricResult(b.green_score, p.green_score),
          ai_explanation: aiExplanation(req.city, b.co2_emissions, liveAqi.aqi, b.green_score, p.co2_emissions, predictedAqi, p.green_score),
          aqi_source: liveAqi.label,
          data_provenance: {
            source: liveAqi.label === "model-estimate" ? "Open-Meteo current PM2.5 model estimate" : "Stored planning baseline",
            location: COORDS[req.city] ? `City-center coordinates (${COORDS[req.city][0]}, ${COORDS[req.city][1]})` : req.city,
            updated_at: new Date().toISOString(),
            measurement_period: liveAqi.label === "model-estimate" ? `Current model estimate at ${new Date().toISOString()}` : "No observation period available",
            is_live: liveAqi.label === "model-estimate",
            kind: liveAqi.label as "station-observation" | "model-estimate" | "planning-baseline",
            note: liveAqi.label === "model-estimate"
              ? "PM2.5 model estimate converted to AQI scale. Not a CPCB station reading."
              : "No live data available. Planning baseline for scenario comparison only.",
          },
        };
      };
      return { scenario1: await run(input.scenario1), scenario2: await run(input.scenario2) };
    }),

  recommend: publicProcedure
    .input(z.object({ city: z.string().trim().min(2).max(80), target_reduction_pct: z.number().min(0).max(100) }))
    .output(z.object({ city: z.string(), target_reduction_pct: z.number(), recommended_levers: PolicyLeversSchema, predicted_co2: z.number(), target_co2: z.number(), actual_reduction_pct: z.number() }))
    .mutation(({ input }) => {
      const { city, target_reduction_pct } = input;
      const b = getBaseline(city);
      const targetCo2 = b.co2_emissions * (1 - target_reduction_pct / 100);
      let best: any = null, bestDist = Infinity;
      for (let ev = 0; ev <= 100; ev += 10)
        for (let solar = 0; solar <= 100; solar += 10)
          for (let trees = 0; trees <= 100; trees += 10)
            for (let recycling = 0; recycling <= 100; recycling += 10)
              for (let transport = 0; transport <= 100; transport += 10) {
                const p = runSimulationSync(city, { ev_adoption_pct: ev, solar_adoption_pct: solar, trees_planted_pct: trees, plastic_recycling_pct: recycling, public_transport_usage_pct: transport });
                const dist = Math.abs(p.co2_emissions - targetCo2);
                if (dist < bestDist) { bestDist = dist; best = { levers: { ev_adoption_pct: ev, solar_adoption_pct: solar, trees_planted_pct: trees, plastic_recycling_pct: recycling, public_transport_usage_pct: transport }, predicted_co2: p.co2_emissions }; }
              }
      return { city, target_reduction_pct, recommended_levers: best.levers, predicted_co2: best.predicted_co2, target_co2: targetCo2, actual_reduction_pct: ((b.co2_emissions - best.predicted_co2) / b.co2_emissions) * 100 };
    }),

  optimize: publicProcedure
    .input(z.object({ city: z.string().trim().min(2).max(80), goal: z.enum(["co2","aqi","energy","green","balanced"]) }))
    .output(z.object({ recommended_levers: PolicyLeversSchema, predicted: z.object({ co2_emissions: z.number(), aqi: z.number(), electricity_demand: z.number(), green_score: z.number() }), baseline: z.object({ co2_emissions: z.number(), aqi: z.number(), electricity_demand: z.number(), green_score: z.number() }) }))
    .mutation(({ input }) => {
      const { city, goal } = input;
      const b = getBaseline(city);
      const score = (p: ReturnType<typeof runSimulationSync>) => {
        if (goal === "co2")      return p.co2_emissions;
        if (goal === "aqi")      return p.aqi;
        if (goal === "energy")   return p.electricity_demand;
        if (goal === "green")    return -p.green_score;
        return (p.co2_emissions/b.co2_emissions) + (p.aqi/b.aqi) + (p.electricity_demand/b.electricity_demand) - (p.green_score/100);
      };
      let best: any = null, bestScore = Infinity;
      for (let ev = 0; ev <= 100; ev += 10)
        for (let solar = 0; solar <= 100; solar += 10)
          for (let trees = 0; trees <= 100; trees += 10)
            for (let recycling = 0; recycling <= 100; recycling += 10)
              for (let transport = 0; transport <= 100; transport += 10) {
                const levers = { ev_adoption_pct: ev, solar_adoption_pct: solar, trees_planted_pct: trees, plastic_recycling_pct: recycling, public_transport_usage_pct: transport };
                const p = runSimulationSync(city, levers);
                const s = score(p);
                if (s < bestScore) { bestScore = s; best = { levers, predicted: p }; }
              }
      return { recommended_levers: best.levers, predicted: best.predicted, baseline: { co2_emissions: b.co2_emissions, aqi: b.aqi, electricity_demand: b.electricity_demand, green_score: b.green_score } };
    }),

  projection: publicProcedure
    .input(z.object({ city: z.string().trim().min(2).max(80), levers: PolicyLeversSchema }))
    .output(z.object({ years: z.array(z.number()), baseline_co2: z.array(z.number()), policy_co2: z.array(z.number()), baseline_aqi: z.array(z.number()), policy_aqi: z.array(z.number()) }))
    .query(({ input }) => {
      const { city, levers } = input;
      const b = getBaseline(city);
      const p = runSimulationSync(city, levers);
      const years = [2026, 2028, 2030, 2032, 2035, 2040];
      const co2R = (b.co2_emissions - p.co2_emissions) / b.co2_emissions;
      const aqiR = (b.aqi - p.aqi) / b.aqi;
      return {
        years,
        baseline_co2: years.map((y) => Math.round(b.co2_emissions * Math.pow(1.03, y - 2026))),
        policy_co2:   years.map((y) => { const t = (y-2026)/14; return Math.round(b.co2_emissions * (1 - co2R*Math.min(1,t*1.5)) * Math.pow(1.005, y-2026)); }),
        baseline_aqi: years.map((y) => Math.round(b.aqi * Math.pow(1.02, y - 2026))),
        policy_aqi:   years.map((y) => { const t = (y-2026)/14; return Math.round(b.aqi * (1 - aqiR*Math.min(1,t*1.5)) * Math.pow(1.003, y-2026)); }),
      };
    }),
});
