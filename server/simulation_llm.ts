import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

const ExplainRequestSchema = z.object({
  city: z.string(),
  baseline_metrics: z.object({
    co2_emissions: z.number(),
    aqi: z.number(),
    electricity_demand: z.number(),
    green_score: z.number(),
  }),
  predicted_metrics: z.object({
    co2_emissions: z.number(),
    aqi: z.number(),
    electricity_demand: z.number(),
    green_score: z.number(),
  }),
  policy_levers: z.object({
    ev_adoption_pct: z.number(),
    solar_adoption_pct: z.number(),
    trees_planted_pct: z.number(),
    plastic_recycling_pct: z.number(),
    public_transport_usage_pct: z.number(),
  }),
});

function fallbackExplanation(
  city: string,
  baseline: { co2_emissions: number; aqi: number; green_score: number },
  predicted: { co2_emissions: number; aqi: number; green_score: number }
) {
  const co2Change = predicted.co2_emissions - baseline.co2_emissions;
  const aqiChange = predicted.aqi - baseline.aqi;
  const greenScoreChange = predicted.green_score - baseline.green_score;
  return `Based on the proposed policy changes in ${city}, CO₂ emissions would ${co2Change <= 0 ? "decrease" : "increase"} by ${Math.abs(co2Change).toFixed(1)} MT and AQI would ${aqiChange <= 0 ? "improve by dropping" : "worsen by rising"} ${Math.abs(aqiChange).toFixed(1)} points. Overall sustainability score would ${greenScoreChange >= 0 ? "improve" : "decline"} by ${Math.abs(greenScoreChange).toFixed(1)} points.`;
}

export const simulationLLMRouter = router({
  chat: publicProcedure
    .input(z.object({
      city: z.string(),
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
      context: z.object({
        co2_emissions: z.number().optional(),
        aqi: z.number().optional(),
        green_score: z.number().optional(),
        electricity_demand: z.number().optional(),
      }).optional(),
    }))
    .output(z.object({ reply: z.string() }))
    .mutation(async ({ input }) => {
      const { city, messages, context } = input;
      const contextStr = context
        ? `Current simulation context for ${city}: CO₂=${context.co2_emissions ?? "N/A"} MT, AQI=${context.aqi ?? "N/A"}, Green Score=${context.green_score ?? "N/A"}/100, Electricity=${context.electricity_demand ?? "N/A"} MWh.`
        : `City: ${city}.`;

      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: `You are EcoPolicy AI Assistant, an expert in urban sustainability and climate policy for Indian cities. ${contextStr} Answer questions about climate policies, sustainability strategies, and environmental impact. Be concise, data-driven, and actionable. Use bullet points when listing recommendations.`,
            },
            ...messages,
          ],
        });
        const content = response.choices[0]?.message?.content;
        return { reply: typeof content === "string" ? content.trim() : "I could not generate a response. Please try again." };
      } catch {
        return { reply: `For ${city}, key sustainability strategies include increasing EV adoption, expanding solar energy, improving public transport, and planting urban trees. Each of these levers has measurable impact on CO₂ emissions and air quality.` };
      }
    }),

  explain: publicProcedure
    .input(ExplainRequestSchema)
    .output(z.object({ explanation: z.string() }))
    .mutation(async ({ input }) => {
      const { city, baseline_metrics, predicted_metrics, policy_levers } = input;

      const prompt = `You are an expert environmental policy analyst. Analyze the following policy simulation for ${city} and provide a concise, professional 2-3 sentence explanation of the impact.

**Baseline Metrics:**
- CO₂ Emissions: ${baseline_metrics.co2_emissions} MT
- Air Quality (AQI): ${baseline_metrics.aqi}
- Electricity Demand: ${baseline_metrics.electricity_demand} MWh
- Green Score: ${baseline_metrics.green_score}/100

**Predicted Metrics (after policy changes):**
- CO₂ Emissions: ${predicted_metrics.co2_emissions} MT
- Air Quality (AQI): ${predicted_metrics.aqi}
- Electricity Demand: ${predicted_metrics.electricity_demand} MWh
- Green Score: ${predicted_metrics.green_score}/100

**Policy Changes:**
- EV Adoption: +${policy_levers.ev_adoption_pct}%
- Solar Adoption: +${policy_levers.solar_adoption_pct}%
- Trees Planted: +${policy_levers.trees_planted_pct}%
- Plastic Recycling: +${policy_levers.plastic_recycling_pct}%
- Public Transport Usage: +${policy_levers.public_transport_usage_pct}%

Provide a professional, data-driven explanation of the environmental impact of these policy changes. Focus on the most significant changes and their implications for ${city}'s sustainability goals.`;

      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert environmental policy analyst. Provide concise, professional explanations of environmental policy impacts.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        const explanation = typeof content === "string" ? content.trim() : "";
        return { explanation: explanation || fallbackExplanation(city, baseline_metrics, predicted_metrics) };
      } catch (error) {
        console.error("LLM explanation error:", error);
        // Fallback to deterministic explanation if LLM fails
        return { explanation: fallbackExplanation(city, baseline_metrics, predicted_metrics) };
      }
    }),

  recommend: publicProcedure
    .input(
      z.object({
        city: z.string(),
        target_reduction_pct: z.number().min(0).max(100),
        recommended_levers: z.object({
          ev_adoption_pct: z.number(),
          solar_adoption_pct: z.number(),
          trees_planted_pct: z.number(),
          plastic_recycling_pct: z.number(),
          public_transport_usage_pct: z.number(),
        }),
        predicted_co2: z.number(),
        actual_reduction_pct: z.number(),
      })
    )
    .output(z.object({ recommendation: z.string() }))
    .mutation(async ({ input }) => {
      const { city, target_reduction_pct, recommended_levers, predicted_co2, actual_reduction_pct } = input;

      const prompt = `You are an environmental policy advisor. Provide a professional recommendation for ${city} based on the following policy optimization results.

**Target CO₂ Reduction:** ${target_reduction_pct}%
**Actual Reduction Achieved:** ${actual_reduction_pct.toFixed(1)}%
**Predicted CO₂ Emissions:** ${predicted_co2.toFixed(1)} MT

**Recommended Policy Levers:**
- EV Adoption: ${recommended_levers.ev_adoption_pct}%
- Solar Adoption: ${recommended_levers.solar_adoption_pct}%
- Trees Planted: ${recommended_levers.trees_planted_pct}%
- Plastic Recycling: ${recommended_levers.plastic_recycling_pct}%
- Public Transport Usage: ${recommended_levers.public_transport_usage_pct}%

Provide a concise 2-3 sentence recommendation explaining why this combination of policies is effective for ${city} and any implementation considerations.`;

      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an environmental policy advisor. Provide actionable, professional policy recommendations based on simulation results.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        const recommendation = typeof content === "string" ? content : "";
        return { recommendation };
      } catch (error) {
        console.error("LLM recommendation error:", error);
        // Fallback recommendation
        const fallback = `To achieve a ${target_reduction_pct}% CO₂ reduction in ${city}, prioritize increasing EV adoption to ${recommended_levers.ev_adoption_pct}% and solar adoption to ${recommended_levers.solar_adoption_pct}%. This combination is projected to reduce emissions by ${actual_reduction_pct.toFixed(1)}%, with additional benefits from enhanced public transport and tree planting initiatives.`;
        return { recommendation: fallback };
      }
    }),
});
