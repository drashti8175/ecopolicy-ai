# Project TODO

## Week 2: Data Synthesis & ML Model Training
- [x] Clean datasets and merge into one table per city (using synthetic data generation as per project instructions, real data ingestion/cleaning is a placeholder for future iterations)
- [x] Synthesize training data with physics/domain-informed synthetic augmentation
- [x] Train separate lightweight regression models (Random Forest or Gradient Boosting) for each output metric (CO₂, AQI, Electricity Demand, Green Score)
- [x] Evaluate models with MAE/R²
- [x] Save models as .pkl with joblib
- [x] Export models (trained locally, a script will simulate the Colab notebook deliverable)

## Week 3: Backend Development (FastAPI)
- [x] Implement POST /simulate endpoint: takes city + 5 slider values -> runs 4 models -> returns predictions + green score
- [x] Implement POST /compare endpoint: takes two scenarios -> returns both predictions side by side
- [x] Implement POST /recommend endpoint: takes target reduction % -> searches lever combinations -> finds combo hitting target
- [x] Implement GET /cities endpoint: returns baseline values for each supported city
- [x] Add pydantic models for request/response validation
- [x] Load .pkl models once at startup, not per-request

## Week 4: Frontend Core Development (React)
- [x] Implement City Selector dropdown (Delhi, Ahmedabad, Surat)
- [x] Implement 5 interactive sliders for policy levers
- [x] Implement "Simulate" button to call /simulate endpoint
- [x] Display 4 Results Metric Cards with predicted vs. baseline values and up/down delta indicators
- [x] Implement Bar/Line Charts using Recharts for Current vs. Simulated scenario comparisons
- [x] Ensure responsive dashboard layout with sidebar navigation and city overview stats section

## Week 5: Frontend Enhancements & AI Integration
- [x] Integrate AI Insights Panel: AI explanations generated server-side and displayed under results
- [x] Display AI explanation directly under simulation results
- [x] Integrate LLM-based explanations using built-in Forge API (gpt-5-mini model)
- [x] Implement Scenario Save and Compare functionality with full metrics tracking, side-by-side comparison charts, and policy lever analysis

## Week 6: Polish, Responsiveness & Final Delivery
- [x] Ensure elegant, polished, and premium visual design (components, spacing, typography, color)
- [x] Implement PDF report generation (backend: pdf-lib)
- [x] Deploy backend (Render free tier) - provide instructions (documented in README)
- [x] Deploy frontend (Vercel or Netlify free tier) - provide instructions (documented in README)
- [x] Write README with architecture diagram, setup instructions, SDGs covered
- [x] Record a 2–5 min demo video (screen recording + voiceover walking through Ahmedabad EV+solar scenario) - provide script/description
- [x] Build a short slide deck: problem → solution → architecture → demo screenshots → SDGs → results

- [x] Build short slide deck (problem → solution → architecture → demo screenshots → SDGs → results)
