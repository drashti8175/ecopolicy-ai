import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // or standard fetch if using node 18+

let cityBaselines: any = {};
try {
  const dataPath = path.join(process.cwd(), "data", "city_baselines.json");
  cityBaselines = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
} catch (e) {
  console.warn("Could not load city_baselines.json, using fallback.");
}

type CityBaseline = {
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
};

const defaultBaseline: CityBaseline = {
  ev_adoption_pct: 8, solar_adoption_pct: 15, trees_planted_pct: 15,
  plastic_recycling_pct: 55, public_transport_usage_pct: 35,
  co2_emissions: 10.0, aqi: 145, electricity_demand: 5000, green_score: 58, population: 1000000
};

function getBaseline(city: string): CityBaseline {
  const normalizedCity = city.trim();
  if (!normalizedCity) throw new Error("City name is required");
  const data = cityBaselines[normalizedCity] || cityBaselines["default"];
  if (!data) return defaultBaseline;
  
  return {
    ev_adoption_pct: data.ev_adoption_pct?.value || defaultBaseline.ev_adoption_pct,
    solar_adoption_pct: data.solar_adoption_pct?.value || defaultBaseline.solar_adoption_pct,
    trees_planted_pct: data.trees_planted_pct?.value || defaultBaseline.trees_planted_pct,
    plastic_recycling_pct: data.plastic_recycling_pct?.value || defaultBaseline.plastic_recycling_pct,
    public_transport_usage_pct: data.public_transport_usage_pct?.value || defaultBaseline.public_transport_usage_pct,
    co2_emissions: data.co2_emissions?.value || defaultBaseline.co2_emissions,
    aqi: data.aqi?.value || defaultBaseline.aqi,
    electricity_demand: data.electricity_demand?.value || defaultBaseline.electricity_demand,
    green_score: data.green_score?.value || defaultBaseline.green_score,
    population: data.population?.value || defaultBaseline.population,
  };
}

// AQI Fetching logic
const AQI_CACHE: Record<string, { timestamp: number; aqi: number }> = {};
async function getLiveAqi(city: string, fallbackAqi: number): Promise<number> {
  const now = Date.now();
  if (AQI_CACHE[city] && now - AQI_CACHE[city].timestamp < 3600 * 1000) {
    return AQI_CACHE[city].aqi;
  }
  try {
    const resourceId = process.env.DATA_GOV_IN_RESOURCE_ID || "not_set";
    const apiKey = process.env.DATA_GOV_IN_API_KEY || "not_set";
    if (apiKey === "not_set") return fallbackAqi; // use fallback if no API key
    
    // Simplistic mock implementation for demo, replace with real fetch
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&filters[city]=${encodeURIComponent(city)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return fallbackAqi;
    const data = await res.json() as any;
    if (data && data.records && data.records.length > 0) {
      const liveAqi = parseFloat(data.records[0].aqi || data.records[0].AQI);
      if (!isNaN(liveAqi)) {
        AQI_CACHE[city] = { timestamp: now, aqi: liveAqi };
        return liveAqi;
      }
    }
  } catch (err) {
    console.error("AQI fetch failed", err);
  }
  return fallbackAqi;
}

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
  baseline: z.number(),
  predicted: z.number(),
  delta: z.number(),
  direction: z.enum(["up", "down", "same"]),
});

const SimulationResponseSchema = z.object({
  city: z.string(),
  co2_emissions: MetricResultSchema,
  aqi: MetricResultSchema,
  electricity_demand: MetricResultSchema,
  green_score: MetricResultSchema,
  ai_explanation: z.string(),
});

// Helper function to calculate metric result
function calculateMetricResult(baselineVal: number, predictedVal: number) {
  const delta = predictedVal - baselineVal;
  let direction: "up" | "down" | "same" = "same";
  if (delta > 0.01) direction = "up";
  else if (delta < -0.01) direction = "down";

  return {
    baseline: baselineVal,
    predicted: predictedVal,
    delta,
    direction,
  };
}

// Helper function to generate AI explanation
function generateAiExplanation(
  city: string,
  predictions: Record<string, number>,
  baseline: Record<string, number>
): string {
  const co2Change = predictions.co2_emissions - baseline.co2_emissions;
  const aqiChange = predictions.aqi - baseline.aqi;
  const greenScoreChange = predictions.green_score - baseline.green_score;

  let explanation = `Based on the proposed policy changes in ${city}, `;

  if (co2Change < 0) {
    explanation += `CO₂ emissions would decrease by ${Math.abs(co2Change).toFixed(1)} metric tonnes. `;
  } else {
    explanation += `CO₂ emissions would increase by ${co2Change.toFixed(1)} metric tonnes. `;
  }

  if (aqiChange < 0) {
    explanation += `Air quality would improve with AQI dropping by ${Math.abs(aqiChange).toFixed(1)} points. `;
  } else {
    explanation += `Air quality would worsen with AQI rising by ${aqiChange.toFixed(1)} points. `;
  }

  if (greenScoreChange > 0) {
    explanation += `Overall sustainability score would improve by ${greenScoreChange.toFixed(1)} points.`;
  } else {
    explanation += `Overall sustainability score would decline by ${Math.abs(greenScoreChange).toFixed(1)} points.`;
  }

  return explanation;
}


async function runSimulation(
  city: string,
  levers: Record<string, number>
): Promise<Record<string, number>> {
  const b = getBaseline(city);
  
  // Physical constants
  const GRID_EMISSION_FACTOR = cityBaselines.metadata?.grid_factor?.value || 0.710; // tCO2 / MWh
  const TREE_SEQUESTRATION_RATE = cityBaselines.metadata?.tree_sequestration_rate?.value || 0.021; // tCO2 absorbed per tree per year (approximate)
  const population = b.population || 1000000;
  
  // Basic formulas
  // Electricity CO2 = electricity used (MWh) * grid_factor * (1 - solar share)
  // Let's assume baseline electricity is mostly non-solar, we adjust by new solar share
  const baseNonSolarElectricity = b.electricity_demand * (1 - b.solar_adoption_pct / 100);
  const newNonSolarElectricity = b.electricity_demand * (1 - levers.solar_adoption_pct / 100);
  
  let elec_co2_change = (newNonSolarElectricity - baseNonSolarElectricity) * GRID_EMISSION_FACTOR;
  
  // Transport CO2: Assume baseline transport is 30% of total CO2 (rough estimate for model)
  const baseTransportCO2 = b.co2_emissions * 1000000 * 0.30; // convert Mt to tCO2
  const evDelta = (levers.ev_adoption_pct - b.ev_adoption_pct) / 100;
  const ptDelta = (levers.public_transport_usage_pct - b.public_transport_usage_pct) / 100;
  
  // EV reduces transport CO2 but increases electricity demand
  const transport_co2_change = -baseTransportCO2 * (evDelta * 0.8 + ptDelta * 0.5); // EV 80% reduction, PT 50%
  const ev_extra_electricity = b.electricity_demand * 0.05 * (evDelta * 10); // arbitrary small increase
  
  elec_co2_change += ev_extra_electricity * GRID_EMISSION_FACTOR;
  
  // Trees: number of trees * CO2 absorbed
  // Assume pct represents % of population as number of trees (e.g. 10% = 0.1 * pop trees)
  const baseTrees = population * (b.trees_planted_pct / 100);
  const newTrees = population * (levers.trees_planted_pct / 100);
  const trees_co2_change = -(newTrees - baseTrees) * TREE_SEQUESTRATION_RATE;
  
  // Recycling: assume 1% recycling reduces 0.01% of total CO2
  const recDelta = (levers.plastic_recycling_pct - b.plastic_recycling_pct);
  const recycling_co2_change = -(recDelta / 100) * 0.05 * (b.co2_emissions * 1000000);
  
  const total_co2_change_tonnes = elec_co2_change + transport_co2_change + trees_co2_change + recycling_co2_change;
  const co2_emissions = b.co2_emissions + (total_co2_change_tonnes / 1000000); // Back to Mt
  
  // AQI: Live fetch
  const liveBaseAqi = await getLiveAqi(city, b.aqi);
  // Source apportionment: EV reduces PM2.5, Trees reduce PM2.5
  const aqi_change = - (evDelta * 20 + (newTrees - baseTrees)/population * 5);
  const aqi = liveBaseAqi + aqi_change;
  
  const electricity_demand = b.electricity_demand + ev_extra_electricity;
  
  const greenScore = b.green_score 
    + (evDelta * 20) 
    + ((levers.solar_adoption_pct - b.solar_adoption_pct) * 0.5) 
    + ((levers.trees_planted_pct - b.trees_planted_pct) * 0.5) 
    + (recDelta * 0.3) 
    + (ptDelta * 20);

  return {
    co2_emissions: Math.max(0, co2_emissions),
    aqi: Math.max(0, aqi),
    electricity_demand: Math.max(0, electricity_demand),
    green_score: Math.max(0, Math.min(100, greenScore)),
  };
}


export const simulationRouter = router({
  cities: publicProcedure.query(async () => {
    return Object.entries(cityBaselines)
      .filter(([key]) => key !== "metadata" && key !== "default")
      .map(([city, data]: [string, any]) => ({
        city,
        ...data,
      }));
  }),

  simulate: publicProcedure
    .input(SimulationRequestSchema)
    .output(SimulationResponseSchema)
    .mutation(async ({ input }) => {
      const { city, levers } = input;
      const baseline = getBaseline(city);

      // Run simulation
      const predictions = await runSimulation(city, levers);

      // Generate AI explanation
      const aiExplanation = generateAiExplanation(city, predictions, baseline);

      return {
        city,
        co2_emissions: calculateMetricResult(
          baseline.co2_emissions,
          predictions.co2_emissions
        ),
        aqi: calculateMetricResult(baseline.aqi, predictions.aqi),
        electricity_demand: calculateMetricResult(
          baseline.electricity_demand,
          predictions.electricity_demand
        ),
        green_score: calculateMetricResult(
          baseline.green_score,
          predictions.green_score
        ),
        ai_explanation: aiExplanation,
      };
    }),

  compare: publicProcedure
    .input(
      z.object({
        scenario1: SimulationRequestSchema,
        scenario2: SimulationRequestSchema,
      })
    )
    .output(
      z.object({
        scenario1: SimulationResponseSchema,
        scenario2: SimulationResponseSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { city: city1, levers: levers1 } = input.scenario1;
      const { city: city2, levers: levers2 } = input.scenario2;

      const baseline1 = getBaseline(city1);
      const baseline2 = getBaseline(city2);

      const predictions1 = runSimulation(city1, levers1);
      const predictions2 = runSimulation(city2, levers2);

      const aiExplanation1 = generateAiExplanation(city1, predictions1, baseline1);
      const aiExplanation2 = generateAiExplanation(city2, predictions2, baseline2);

      return {
        scenario1: {
          city: city1,
          co2_emissions: calculateMetricResult(baseline1.co2_emissions, predictions1.co2_emissions),
          aqi: calculateMetricResult(baseline1.aqi, predictions1.aqi),
          electricity_demand: calculateMetricResult(baseline1.electricity_demand, predictions1.electricity_demand),
          green_score: calculateMetricResult(baseline1.green_score, predictions1.green_score),
          ai_explanation: aiExplanation1,
        },
        scenario2: {
          city: city2,
          co2_emissions: calculateMetricResult(baseline2.co2_emissions, predictions2.co2_emissions),
          aqi: calculateMetricResult(baseline2.aqi, predictions2.aqi),
          electricity_demand: calculateMetricResult(baseline2.electricity_demand, predictions2.electricity_demand),
          green_score: calculateMetricResult(baseline2.green_score, predictions2.green_score),
          ai_explanation: aiExplanation2,
        },
      };
    }),

  recommend: publicProcedure
    .input(
      z.object({
        city: z.string().trim().min(2).max(80),
        target_reduction_pct: z.number().min(0).max(100),
      })
    )
    .output(
      z.object({
        city: z.string(),
        target_reduction_pct: z.number(),
        recommended_levers: PolicyLeversSchema,
        predicted_co2: z.number(),
        target_co2: z.number(),
        actual_reduction_pct: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { city, target_reduction_pct } = input;
      const baseline = getBaseline(city);
      const baselineCo2 = baseline.co2_emissions;
      const targetCo2 = baselineCo2 * (1 - target_reduction_pct / 100);

      let bestCombo: any = null;
      let bestDistance = Infinity;

      for (let ev = 0; ev <= 100; ev += 10) {
        for (let solar = 0; solar <= 100; solar += 10) {
          for (let trees = 0; trees <= 100; trees += 10) {
            for (let recycling = 0; recycling <= 100; recycling += 10) {
              for (let transport = 0; transport <= 100; transport += 10) {
                const leversCombo = { ev_adoption_pct: ev, solar_adoption_pct: solar, trees_planted_pct: trees, plastic_recycling_pct: recycling, public_transport_usage_pct: transport };
                const predictions = await runSimulation(city, leversCombo);
                const distance = Math.abs(predictions.co2_emissions - targetCo2);
                if (distance < bestDistance) {
                  bestDistance = distance;
                  bestCombo = { levers: leversCombo, predicted_co2: predictions.co2_emissions, target_co2: targetCo2, actual_reduction_pct: ((baselineCo2 - predictions.co2_emissions) / baselineCo2) * 100 };
                }
              }
            }
          }
        }
      }

      if (!bestCombo) throw new Error("No suitable combination found");
      return { city, target_reduction_pct, recommended_levers: bestCombo.levers, predicted_co2: bestCombo.predicted_co2, target_co2: bestCombo.target_co2, actual_reduction_pct: bestCombo.actual_reduction_pct };
    }),

  // AI Policy Optimization: given a goal, return optimal levers + all predicted metrics
  optimize: publicProcedure
    .input(z.object({
      city: z.string().trim().min(2).max(80),
      goal: z.enum(["co2", "aqi", "energy", "green", "balanced"]),
    }))
    .output(z.object({
      recommended_levers: PolicyLeversSchema,
      predicted: z.object({ co2_emissions: z.number(), aqi: z.number(), electricity_demand: z.number(), green_score: z.number() }),
      baseline: z.object({ co2_emissions: z.number(), aqi: z.number(), electricity_demand: z.number(), green_score: z.number() }),
    }))
    .mutation(async ({ input }) => {
      const { city, goal } = input;
      const b = getBaseline(city);

      // Score function per goal (lower = better for all except green)
      const score = (p: Record<string, number>) => {
        switch (goal) {
          case "co2": return p.co2_emissions;
          case "aqi": return p.aqi;
          case "energy": return p.electricity_demand;
          case "green": return -p.green_score;
          case "balanced": return (
            (p.co2_emissions / b.co2_emissions) +
            (p.aqi / b.aqi) +
            (p.electricity_demand / b.electricity_demand) -
            (p.green_score / 100)
          );
        }
      };

      let best: any = null;
      let bestScore = Infinity;

      for (let ev = 0; ev <= 100; ev += 10) {
        for (let solar = 0; solar <= 100; solar += 10) {
          for (let trees = 0; trees <= 100; trees += 10) {
            for (let recycling = 0; recycling <= 100; recycling += 10) {
              for (let transport = 0; transport <= 100; transport += 10) {
                const levers = { ev_adoption_pct: ev, solar_adoption_pct: solar, trees_planted_pct: trees, plastic_recycling_pct: recycling, public_transport_usage_pct: transport };
                const p = await runSimulation(city, levers);
                const s = score(p);
                if (s < bestScore) { bestScore = s; best = { levers, predicted: p }; }
              }
            }
          }
        }
      }

      return {
        recommended_levers: best.levers,
        predicted: best.predicted,
        baseline: { co2_emissions: b.co2_emissions, aqi: b.aqi, electricity_demand: b.electricity_demand, green_score: b.green_score },
      };
    }),

  // Future climate projection: 2026–2040 under baseline vs proposed levers
  projection: publicProcedure
    .input(z.object({
      city: z.string().trim().min(2).max(80),
      levers: PolicyLeversSchema,
    }))
    .output(z.object({
      years: z.array(z.number()),
      baseline_co2: z.array(z.number()),
      policy_co2: z.array(z.number()),
      baseline_aqi: z.array(z.number()),
      policy_aqi: z.array(z.number()),
    }))
    .query(async ({ input }) => {
      const { city, levers } = input;
      const b = getBaseline(city);
      const simulated = await runSimulation(city, levers);
      const years = [2026, 2028, 2030, 2032, 2035, 2040];

      // Baseline trend: +3% CO₂/yr, +2% AQI/yr (business-as-usual growth)
      // Policy trend: linear interpolation from current to simulated, then continued improvement
      const co2Reduction = (b.co2_emissions - simulated.co2_emissions) / b.co2_emissions;
      const aqiReduction = (b.aqi - simulated.aqi) / b.aqi;

      return {
        years,
        baseline_co2: years.map(y => Math.round(b.co2_emissions * Math.pow(1.03, y - 2026))),
        policy_co2: years.map(y => {
          const t = (y - 2026) / 14; // 0→1 over 2026–2040
          const reduction = co2Reduction * Math.min(1, t * 1.5);
          return Math.round(b.co2_emissions * (1 - reduction) * Math.pow(1.005, y - 2026));
        }),
        baseline_aqi: years.map(y => Math.round(b.aqi * Math.pow(1.02, y - 2026))),
        policy_aqi: years.map(y => {
          const t = (y - 2026) / 14;
          const reduction = aqiReduction * Math.min(1, t * 1.5);
          return Math.round(b.aqi * (1 - reduction) * Math.pow(1.003, y - 2026));
        }),
      };
    }),
});
