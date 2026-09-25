import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const GenerateReportSchema = z.object({
  city: z.string(),
  levers: z.object({
    ev_adoption_pct: z.number(),
    solar_adoption_pct: z.number(),
    trees_planted_pct: z.number(),
    plastic_recycling_pct: z.number(),
    public_transport_usage_pct: z.number(),
  }),
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
  ai_explanation: z.string(),
});

export const pdfReportRouter = router({
  generate: publicProcedure
    .input(GenerateReportSchema)
    .output(z.object({ pdfBase64: z.string() }))
    .mutation(async ({ input }) => {
      const { city, levers, baseline_metrics, predicted_metrics, ai_explanation } = input;
      // Standard PDF fonts only support WinAnsi. Normalising text prevents a
      // report from failing when AI text includes characters such as CO₂.
      const safeText = (value: string) => value.replace(/CO₂/g, "CO2").replace(/[^\x20-\x7E]/g, "");

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText(safeText(`EcoPolicy AI Simulation Report - ${city}`), {
        x: 50,
        y: 750,
        font: boldFont,
        size: 24,
        color: rgb(0.05, 0.2, 0.4),
      });

      let yOffset = 700;

      const drawSectionTitle = (title: string) => {
        yOffset -= 30;
        page.drawText(safeText(title), {
          x: 50,
          y: yOffset,
          font: boldFont,
          size: 16,
          color: rgb(0.1, 0.3, 0.5),
        });
        yOffset -= 15;
      };

      const drawTextLine = (text: string, isBold = false) => {
        yOffset -= 18;
        page.drawText(safeText(text), {
          x: 50,
          y: yOffset,
          font: isBold ? boldFont : font,
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
        });
      };

      // Policy Levers
      drawSectionTitle("Policy Levers Applied");
      drawTextLine(`EV Adoption: ${levers.ev_adoption_pct}%`);
      drawTextLine(`Solar Adoption: ${levers.solar_adoption_pct}%`);
      drawTextLine(`Trees Planted: ${levers.trees_planted_pct}%`);
      drawTextLine(`Plastic Recycling: ${levers.plastic_recycling_pct}%`);
      drawTextLine(`Public Transport Usage: ${levers.public_transport_usage_pct}%`);

      // Baseline Metrics
      drawSectionTitle("Baseline Metrics");
      drawTextLine(`CO2 Emissions: ${baseline_metrics.co2_emissions.toFixed(1)} MT`);
      drawTextLine(`Air Quality (AQI): ${baseline_metrics.aqi.toFixed(1)}`);
      drawTextLine(`Electricity Demand: ${baseline_metrics.electricity_demand.toFixed(1)} MWh`);
      drawTextLine(`Green Score: ${baseline_metrics.green_score.toFixed(1)}/100`);

      // Predicted Metrics
      drawSectionTitle("Predicted Metrics");
      drawTextLine(`CO2 Emissions: ${predicted_metrics.co2_emissions.toFixed(1)} MT`);
      drawTextLine(`Air Quality (AQI): ${predicted_metrics.aqi.toFixed(1)}`);
      drawTextLine(`Electricity Demand: ${predicted_metrics.electricity_demand.toFixed(1)} MWh`);
      drawTextLine(`Green Score: ${predicted_metrics.green_score.toFixed(1)}/100`);

      // AI Explanation
      drawSectionTitle("AI Insights");
      const explanationLines = ai_explanation.match(/.{1,90}(\s|$)/g) || [ai_explanation]; // Wrap text
      explanationLines.forEach(line => drawTextLine(line.trim()));

      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

      return { pdfBase64 };
    }),
});
