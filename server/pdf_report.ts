import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

const GenerateReportSchema = z.object({
  city: z.string(),
  levers: z.object({
    ev_adoption_pct: z.number(), solar_adoption_pct: z.number(), trees_planted_pct: z.number(),
    plastic_recycling_pct: z.number(), public_transport_usage_pct: z.number(),
  }),
  baseline_metrics: z.object({ co2_emissions: z.coerce.number(), aqi: z.coerce.number(), electricity_demand: z.coerce.number(), green_score: z.coerce.number() }),
  predicted_metrics: z.object({ co2_emissions: z.coerce.number(), aqi: z.coerce.number(), electricity_demand: z.coerce.number(), green_score: z.coerce.number() }),
  ai_explanation: z.string().optional().nullable(),
  population: z.coerce.number().optional(),
  data_provenance: z.object({ source: z.string(), location: z.string().optional(), updated_at: z.string(), measurement_period: z.string().optional(), is_live: z.boolean(), kind: z.enum(["station-observation", "model-estimate", "planning-baseline"]).optional(), note: z.string() }).optional(),
});

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;

const clean = (value: unknown) => String(value ?? "")
  .replace(/CO2/g, "CO2")
  .replace(/[\u2080-\u2089]/g, (char) => String("0123456789"["\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089".indexOf(char)]))
  .replace(/[\u2013\u2014]/g, "-")
  .replace(/[^\x20-\x7E]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

export const pdfReportRouter = router({
  generate: publicProcedure.input(GenerateReportSchema).output(z.object({ pdfBase64: z.string() })).mutation(async ({ input }) => {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`EcoPolicy Brief - ${clean(input.city)}`);
    pdf.setAuthor("EcoPolicy AI");
    pdf.setSubject("Urban sustainability policy scenario analysis");
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const navy = rgb(0.035, 0.106, 0.204);
    const blue = rgb(0.07, 0.36, 0.72);
    const cyan = rgb(0.0, 0.65, 0.72);
    const green = rgb(0.04, 0.49, 0.29);
    const red = rgb(0.76, 0.18, 0.20);
    const ink = rgb(0.10, 0.15, 0.21);
    const muted = rgb(0.37, 0.43, 0.50);
    const line = rgb(0.82, 0.86, 0.90);
    const pale = rgb(0.95, 0.97, 0.99);
    const white = rgb(1, 1, 1);
    let page!: PDFPage;

    const footer = (pageNo: number) => {
      page.drawLine({ start: { x: MARGIN, y: 44 }, end: { x: PAGE_WIDTH - MARGIN, y: 44 }, thickness: 0.7, color: line });
      page.drawText("ECOPOLICY AI  |  Urban Climate Decision Support", { x: MARGIN, y: 29, size: 7.5, font: regular, color: muted });
      page.drawText(`CONFIDENTIAL PLANNING BRIEF  |  ${pageNo} / 3`, { x: 405, y: 29, size: 7.5, font: bold, color: muted });
    };
    const newPage = (pageNo: number, label: string) => {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 16, width: PAGE_WIDTH, height: 16, color: navy });
      page.drawText("ECOPOLICY AI", { x: MARGIN, y: PAGE_HEIGHT - 11, size: 7.5, font: bold, color: white });
      page.drawText(label.toUpperCase(), { x: 405, y: PAGE_HEIGHT - 11, size: 7.5, font: bold, color: rgb(0.75, 0.86, 0.98) });
      footer(pageNo);
    };
    const section = (title: string, y: number) => {
      page.drawRectangle({ x: MARGIN, y: y - 3, width: 4, height: 16, color: cyan });
      page.drawText(title.toUpperCase(), { x: MARGIN + 12, y, size: 11.5, font: bold, color: navy });
      page.drawLine({ start: { x: MARGIN, y: y - 9 }, end: { x: PAGE_WIDTH - MARGIN, y: y - 9 }, thickness: 0.7, color: line });
    };
    const paragraph = (text: string, x: number, y: number, width: number, size = 9, leading = 13, color = ink) => {
      const lines = wrap(text, regular, size, width);
      lines.forEach((textLine, i) => page.drawText(textLine, { x, y: y - i * leading, size, font: regular, color }));
      return y - lines.length * leading;
    };
    const formatNumber = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n);
    const metric = (label: string, base: number, projected: number, unit: string, lowerIsBetter: boolean, x: number, y: number) => {
      const delta = projected - base;
      const good = lowerIsBetter ? delta <= 0 : delta >= 0;
      const pct = base ? Math.abs((delta / base) * 100) : 0;
      page.drawRectangle({ x, y: y - 66, width: 124, height: 70, color: pale, borderColor: line, borderWidth: 0.6 });
      page.drawText(label.toUpperCase(), { x: x + 9, y: y - 12, size: 7.2, font: bold, color: muted });
      page.drawText(`${formatNumber(projected)} ${unit}`, { x: x + 9, y: y - 32, size: 14, font: bold, color: navy });
      page.drawText(`Baseline ${formatNumber(base)}  |  ${delta > 0 ? "+" : ""}${formatNumber(delta)} (${pct.toFixed(1)}%)`, { x: x + 9, y: y - 49, size: 7.2, font: regular, color: muted });
      page.drawRectangle({ x: x + 9, y: y - 61, width: 40, height: 2.5, color: good ? green : red });
    };

    const reportDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date());
    const source = input.data_provenance?.source ?? "Stored planning baseline";
    const kind = input.data_provenance?.kind
      ?? (source.includes("Open-Meteo") ? "model-estimate" : source.includes("CPCB station observation") && input.data_provenance?.is_live ? "station-observation" : "planning-baseline");
    const stationObservation = kind === "station-observation";
    const currentEstimate = kind === "model-estimate";
    const updated = input.data_provenance?.updated_at ? clean(input.data_provenance.updated_at) : "Not available";
    const population = input.population ? formatNumber(input.population) : "Planning baseline";

    // Page 1: executive overview
    newPage(1, "Executive brief");
    page.drawRectangle({ x: 0, y: 640, width: PAGE_WIDTH, height: 185, color: navy });
    page.drawRectangle({ x: 0, y: 640, width: 10, height: 185, color: cyan });
    page.drawText("URBAN CLIMATE", { x: MARGIN, y: 772, size: 10, font: bold, color: rgb(0.57, 0.84, 0.94) });
    page.drawText("POLICY IMPACT BRIEF", { x: MARGIN, y: 728, size: 25, font: bold, color: white });
    page.drawText(clean(input.city).toUpperCase(), { x: MARGIN, y: 684, size: 24, font: bold, color: rgb(0.28, 0.91, 0.88) });
    page.drawText(`Prepared ${clean(reportDate)}`, { x: MARGIN, y: 660, size: 8.5, font: regular, color: rgb(0.78, 0.86, 0.96) });
    page.drawRectangle({ x: 386, y: 692, width: 166, height: 74, color: rgb(0.08, 0.20, 0.36), borderColor: rgb(0.20, 0.44, 0.62), borderWidth: 0.8 });
    page.drawText(stationObservation ? "CPCB STATION AQI" : currentEstimate ? "AQI MODEL ESTIMATE" : "AQI PLANNING BASELINE", { x: 399, y: 741, size: 8.5, font: bold, color: stationObservation ? rgb(0.30, 0.95, 0.70) : rgb(1, 0.78, 0.37) });
    page.drawText(stationObservation ? "Field station observation" : currentEstimate ? "PM2.5 model estimate" : "No current reading", { x: 399, y: 720, size: 10, font: bold, color: white });
    page.drawText(stationObservation ? "Check station and timestamp" : currentEstimate ? "Not a station observation" : "For scenario comparison only", { x: 399, y: 703, size: 7.5, font: regular, color: rgb(0.78, 0.86, 0.96) });

    section("Decision snapshot", 610);
    metric("Annual CO2", input.baseline_metrics.co2_emissions, input.predicted_metrics.co2_emissions, "Mt", true, 42, 578);
    metric("Air quality", input.baseline_metrics.aqi, input.predicted_metrics.aqi, "AQI", true, 174, 578);
    metric("Electricity", input.baseline_metrics.electricity_demand, input.predicted_metrics.electricity_demand, "MWh", true, 306, 578);
    metric("Green score", input.baseline_metrics.green_score, input.predicted_metrics.green_score, "/100", false, 438, 578);

    section("Executive interpretation", 475);
    const defaultNarrative = `This scenario tests a combined mobility, clean-energy, urban-greening and circular-economy package for ${input.city}. The estimates indicate direction and relative scale for policy prioritisation; they are not a substitute for an emissions inventory, environmental impact assessment, or public-health warning system.`;
    paragraph(input.ai_explanation || defaultNarrative, MARGIN, 448, PAGE_WIDTH - 2 * MARGIN, 9.2, 14);

    section("Data confidence and scope", 350);
    const provenanceLocation = input.data_provenance?.location ? clean(input.data_provenance.location) : clean(input.city);
    const provenancePeriod = input.data_provenance?.measurement_period ? clean(input.data_provenance.measurement_period) : updated;
    const confidence = stationObservation
      ? `Air quality is based on ${source} for ${provenanceLocation}. Reported feed timestamp: ${updated}; measurement period: ${provenancePeriod}. Other indicators are planning baselines and modelled scenario outputs.`
      : currentEstimate
        ? `Air quality is a PM2.5 model estimate from ${source} for ${provenanceLocation}, not a CPCB station observation. Estimate time: ${updated}; period: ${provenancePeriod}. Other indicators are planning baselines and modelled scenario outputs.`
        : `Air quality has no verified current station observation. ${input.data_provenance?.note || "The AQI shown is a stored planning baseline."} CO2, electricity demand and population figures are planning assumptions, not live measurements.`;
    paragraph(confidence, MARGIN, 323, PAGE_WIDTH - 2 * MARGIN, 9, 13);
    page.drawRectangle({ x: MARGIN, y: 210, width: PAGE_WIDTH - 2 * MARGIN, height: 65, color: rgb(0.98, 0.99, 1), borderColor: line, borderWidth: 0.6 });
    page.drawText("PEOPLE-CENTRED PLANNING LENS", { x: 55, y: 250, size: 8.5, font: bold, color: blue });
    paragraph(`Population reference: ${population}. Prioritise exposure reduction for children, older adults, outdoor workers and communities near traffic corridors. Validate distributional impacts ward-by-ward before implementation.`, 55, 231, 470, 8.7, 12.5, ink);

    // Page 2: policy package
    newPage(2, "Policy package");
    page.drawText("Policy package and delivery priorities", { x: MARGIN, y: 770, size: 21, font: bold, color: navy });
    page.drawText("Scenario settings and an implementation sequence for a growing urban population.", { x: MARGIN, y: 748, size: 9, font: regular, color: muted });
    section("Policy levers selected", 710);
    const policyRows = [
      ["Electric vehicle adoption", input.levers.ev_adoption_pct, "Pair charging rollout with renewable supply and equitable access."],
      ["Solar energy adoption", input.levers.solar_adoption_pct, "Prioritise public buildings, low-income housing and resilient local generation."],
      ["Urban forestry / green cover", input.levers.trees_planted_pct, "Protect mature canopy and track survival, shade and heat-island benefits."],
      ["Plastic recycling", input.levers.plastic_recycling_pct, "Support collection workers and measure diversion quality, not only tonnage."],
      ["Public transport use", input.levers.public_transport_usage_pct, "Improve frequency, last-mile safety, affordability and universal access."],
    ];
    let py = 674;
    policyRows.forEach(([name, value, action], index) => {
      page.drawRectangle({ x: MARGIN, y: py - 57, width: 511, height: 58, color: index % 2 ? white : pale, borderColor: line, borderWidth: 0.5 });
      page.drawText(clean(name), { x: 54, y: py - 18, size: 9.5, font: bold, color: ink });
      page.drawText(`${value}% target`, { x: 54, y: py - 39, size: 8.2, font: regular, color: muted });
      page.drawRectangle({ x: 195, y: py - 35, width: 145, height: 8, color: rgb(0.87, 0.91, 0.94) });
      page.drawRectangle({ x: 195, y: py - 35, width: 1.45 * Number(value), height: 8, color: index === 1 ? rgb(0.95, 0.60, 0.06) : cyan });
      paragraph(clean(action), 360, py - 18, 170, 8, 10.5, muted);
      py -= 58;
    });
    section("Recommended implementation sequence", 350);
    const steps = [
      ["0-6 months", "Establish ward-level baseline", "Confirm emission inventory, station coverage, vulnerable-population map and service gaps."],
      ["6-18 months", "Deploy high-confidence actions", "Scale bus priority, clean freight, rooftop solar and heat-protection greenery where exposure is highest."],
      ["18+ months", "Measure, publish and adapt", "Publish outcomes, budget performance and equity indicators; revise targets using observed results."],
    ];
    let sy = 315;
    steps.forEach(([period, title, detail]) => {
      page.drawRectangle({ x: 42, y: sy - 60, width: 94, height: 60, color: navy });
      page.drawText(period, { x: 53, y: sy - 25, size: 8.5, font: bold, color: white });
      page.drawText(title, { x: 155, y: sy - 19, size: 10, font: bold, color: navy });
      paragraph(detail, 155, sy - 37, 375, 8.5, 11.5, muted);
      sy -= 73;
    });
    page.drawRectangle({ x: MARGIN, y: 82, width: 511, height: 52, color: rgb(0.96, 0.99, 0.98), borderColor: rgb(0.64, 0.84, 0.72), borderWidth: 0.6 });
    page.drawText("USE WITH TODAY'S POPULATION IN MIND", { x: 55, y: 114, size: 8.7, font: bold, color: green });
    paragraph("The tool is useful for comparing policy choices today, particularly when used with current local data. It should guide questions and priorities - not make automatic decisions about people, budgets or health risk.", 55, 96, 470, 8.5, 11, ink);

    // Page 3: methodology and governance
    newPage(3, "Methodology");
    page.drawText("Methodology, provenance and safeguards", { x: MARGIN, y: 770, size: 21, font: bold, color: navy });
    page.drawText("Transparent assumptions for responsible use by city teams, researchers and community stakeholders.", { x: MARGIN, y: 748, size: 9, font: regular, color: muted });
    section("Input provenance", 710);
    const provenanceRows = [
      ["AQI input", source],
      ["AQI status", stationObservation ? "CPCB station observation" : currentEstimate ? "Open-Meteo PM2.5 model estimate, converted to AQI" : "Stored planning baseline - not live"],
      ["AQI location", provenanceLocation],
      ["AQI measurement period", provenancePeriod],
      ["AQI feed timestamp", updated],
      ["Electricity emission factor", "0.710 tCO2/MWh planning factor"],
      ["Urban forestry factor", "0.021 tCO2/tree/year planning factor"],
      ["Population reference", population],
    ];
    let dy = 675;
    provenanceRows.forEach(([label, value], index) => {
      page.drawRectangle({ x: MARGIN, y: dy - 30, width: 511, height: 31, color: index % 2 ? white : pale, borderColor: line, borderWidth: 0.4 });
      page.drawText(label, { x: 54, y: dy - 19, size: 8.5, font: bold, color: muted });
      page.drawText(clean(value), { x: 218, y: dy - 19, size: 8.5, font: regular, color: ink, maxWidth: 310 });
      dy -= 31;
    });
    section("How to read this report", 455);
    const reading = [
      "CO2, electricity demand, population and green-score baselines are planning assumptions with no verified source period in this dataset. AQI is a CPCB station observation only when the source explicitly identifies a matching, fresh station record; otherwise it is an estimate or planning baseline.",
      "Projected values are scenario-model outputs. They estimate relative change after policy levers are adjusted; they do not predict an exact future outcome.",
      "For population-scale decisions, validate results with local monitoring, emissions inventories, transport surveys, demographic data and public consultation.",
    ];
    let ry = 425;
    reading.forEach((item, i) => {
      page.drawCircle({ x: 53, y: ry - 3, size: 8, color: blue });
      page.drawText(String(i + 1), { x: 50.5, y: ry - 5.8, size: 7, font: bold, color: white });
      ry = paragraph(item, 72, ry, 455, 9, 13, ink) - 15;
    });
    section("Decision safeguards", 270);
    paragraph("Do not use this report as a medical alert, regulatory compliance document or procurement justification without expert review. Keep a record of source dates, assumptions, affected groups and observed outcomes. Publish accessible summaries so residents can challenge and improve the policy design.", MARGIN, 242, 511, 9, 13, ink);
    page.drawRectangle({ x: MARGIN, y: 89, width: 511, height: 78, color: navy });
    page.drawText("READY FOR A LIVE DEPLOYMENT?", { x: 60, y: 141, size: 10, font: bold, color: white });
    paragraph("Configure a valid Data.gov.in API key and the actual AQI resource ID to request CPCB records. The integration accepts only explicit AQI fields with a matching city and recent timestamp; verify the station, returned schema and feed before relying on it. Open-Meteo fallback values remain model estimates, not CPCB measurements.", 60, 121, 455, 8.5, 12, rgb(0.82, 0.90, 0.98));
    page.drawText("EcoPolicy AI - scenario intelligence for transparent, people-centred urban climate planning.", { x: MARGIN, y: 62, size: 7.5, font: italic, color: muted });

    return { pdfBase64: Buffer.from(await pdf.save()).toString("base64") };
  }),
});
