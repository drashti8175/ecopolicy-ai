# EcoPolicy AI: Week 2 & Week 3 Summary

## Overview
This document summarizes the work completed during Week 2 (Data Synthesis & ML Model Training) and Week 3 (Backend Development with FastAPI) for the EcoPolicy AI project.

---

## Week 2: Data Synthesis & ML Model Training

### Objective
Develop a synthetic training dataset and train lightweight regression models to predict environmental impact metrics based on policy lever adjustments.

### Deliverables

#### 1. Synthetic Data Generation (`data/generate_synthetic_data.py`)
- **Purpose**: Generate physics/domain-informed synthetic training data for three cities (Delhi, Ahmedabad, Surat).
- **Methodology**: 
  - Baseline values for each city are defined based on real-world estimates.
  - For each city, 1,000 synthetic samples are generated with variations around the baseline.
  - Domain rules are applied to simulate realistic relationships between policy levers and output metrics:
    - **CO₂ Emissions**: Reduced by EV adoption, solar adoption, public transport usage, and tree cover. Increased by noise.
    - **AQI (Air Quality Index)**: Reduced by EV adoption, public transport usage, and tree cover.
    - **Electricity Demand**: Reduced by solar adoption; increased by EV adoption (charging demand).
    - **Green Score**: Composite metric increased by all positive levers.
- **Output**: Three CSV files (`delhi_synthetic_data.csv`, `ahmedabad_synthetic_data.csv`, `surat_synthetic_data.csv`) and a combined file (`all_cities_synthetic_data.csv`).

#### 2. ML Model Training (`ml_models/train_models.py`)
- **Purpose**: Train separate regression models for each output metric per city.
- **Algorithm**: Random Forest Regressor (100 trees, random_state=42).
- **Training/Test Split**: 80/20 split.
- **Evaluation Metrics**:
  - **Delhi**: CO₂ (MAE=19.91, R²=0.90), AQI (MAE=8.42, R²=0.88), Electricity (MAE=25.92, R²=0.83), Green Score (MAE=4.40, R²=0.70)
  - **Ahmedabad**: CO₂ (MAE=20.75, R²=0.88), AQI (MAE=8.75, R²=0.84), Electricity (MAE=27.28, R²=0.86), Green Score (MAE=4.57, R²=0.69)
  - **Surat**: CO₂ (MAE=19.38, R²=0.90), AQI (MAE=8.22, R²=0.85), Electricity (MAE=26.96, R²=0.87), Green Score (MAE=4.50, R²=0.65)
- **Output**: 12 trained `.pkl` models (4 metrics × 3 cities) saved in `ml_models/`.

### Key Insights
- The synthetic data generation approach uses domain-informed rules to ensure realistic relationships between inputs and outputs.
- Random Forest models achieve good performance (R² > 0.65 for all metrics), validating the synthetic data quality.
- Models are lightweight and suitable for real-time inference in the web application.

---

## Week 3: Backend Development (FastAPI)

### Objective
Build a production-ready FastAPI backend that loads trained models, exposes simulation endpoints, and provides AI-generated explanations.

### Deliverables

#### 1. FastAPI Application (`server/main.py`)
A complete FastAPI application with the following features:

**Startup Logic**:
- Models are loaded once at application startup (not per-request) for efficiency.
- All 12 trained models are loaded into memory for fast inference.

**Pydantic Models** (Request/Response Validation):
- `PolicyLevers`: Validates 5 policy lever inputs (0-100 percentage constraints).
- `SimulationRequest`: Validates city selection (Literal["Delhi", "Ahmedabad", "Surat"]) and lever inputs.
- `MetricResult`: Represents a single metric with baseline, predicted, delta, and direction.
- `SimulationResponse`: Complete simulation output with all 4 metrics and AI explanation.
- `CityBaseline`: City baseline data structure.
- `RecommendationRequest`: Request model for the `/recommend` endpoint with target reduction percentage (0-100).
- `RecommendationResponse`: Response model for recommendations.
- `ComparisonResponse`: Response model for scenario comparisons.

**API Endpoints**:

1. **GET `/cities`**
   - Returns baseline data for all supported cities.
   - Response: List of `CityBaseline` objects.

2. **POST `/simulate`**
   - Simulates the impact of policy levers for a given city.
   - Request: `SimulationRequest` (city + 5 lever values).
   - Response: `SimulationResponse` with predicted metrics, deltas, and AI explanation.
   - Logic:
     - Loads baseline values for the selected city.
     - Runs all 4 trained models to predict output metrics.
     - Calculates delta (predicted - baseline) and direction (up/down/same).
     - Generates a contextual AI explanation.

3. **POST `/compare`**
   - Compares two policy scenarios side by side.
   - Request: Two `SimulationRequest` objects.
   - Response: `ComparisonResponse` with both simulation results.

4. **POST `/recommend`**
   - Recommends lever combinations to hit a target CO₂ reduction percentage.
   - Request: `RecommendationRequest` (city + target reduction %).
   - Response: `RecommendationResponse` with recommended lever values and predicted metrics.
   - Logic:
     - Uses grid search (step size 20) over lever combinations.
     - Finds the combination that best matches the target CO₂ reduction.
     - Returns the best combination with actual reduction achieved.

5. **GET `/health`**
   - Health check endpoint for monitoring.

#### 2. AI Explanation Generation
- Function: `generate_ai_explanation(city, levers, predictions, baseline)`
- Generates contextual 2-3 sentence explanations describing:
  - CO₂ emission changes (increase/decrease).
  - Air quality changes (AQI improvement/worsening).
  - Overall sustainability score changes.
- Explanations are tailored to the selected city and simulation results.

#### 3. Helper Functions
- `run_simulation(city, input_levers)`: Runs all 4 models for a given city and lever combination.
- `calculate_metric_result(baseline_val, predicted_val)`: Calculates delta and direction for a metric.

### Request/Response Validation
- All inputs are validated using Pydantic with constraints:
  - Policy levers: 0-100 percentage range.
  - City: Must be one of ["Delhi", "Ahmedabad", "Surat"].
  - Target reduction: 0-100 percentage range.
- Clear validation error messages are returned for invalid inputs.

### Performance Considerations
- Models are loaded once at startup, not per-request.
- Grid search in `/recommend` uses a step size of 20 for efficiency (625 combinations instead of 100 million).
- Pandas DataFrames are used for efficient batch inference.

---

## File Structure

```
/home/ubuntu/ecopolicy-ai/
├── data/
│   ├── generate_synthetic_data.py          # Synthetic data generation script
│   ├── delhi_synthetic_data.csv            # Generated synthetic data for Delhi
│   ├── ahmedabad_synthetic_data.csv        # Generated synthetic data for Ahmedabad
│   ├── surat_synthetic_data.csv            # Generated synthetic data for Surat
│   └── all_cities_synthetic_data.csv       # Combined synthetic data
├── ml_models/
│   ├── train_models.py                     # Model training script
│   ├── delhi_co2_emissions_model.pkl       # Trained model for Delhi CO₂
│   ├── delhi_aqi_model.pkl                 # Trained model for Delhi AQI
│   ├── delhi_electricity_demand_model.pkl  # Trained model for Delhi electricity
│   ├── delhi_green_score_model.pkl         # Trained model for Delhi green score
│   ├── ahmedabad_co2_emissions_model.pkl   # Trained model for Ahmedabad CO₂
│   ├── ahmedabad_aqi_model.pkl             # Trained model for Ahmedabad AQI
│   ├── ahmedabad_electricity_demand_model.pkl
│   ├── ahmedabad_green_score_model.pkl
│   ├── surat_co2_emissions_model.pkl       # Trained model for Surat CO₂
│   ├── surat_aqi_model.pkl                 # Trained model for Surat AQI
│   ├── surat_electricity_demand_model.pkl
│   └── surat_green_score_model.pkl
└── server/
    └── main.py                             # FastAPI application
```

---

## How to Run the Backend

### Prerequisites
```bash
pip install fastapi uvicorn pandas joblib scikit-learn
```

### Start the Server
```bash
cd /home/ubuntu/ecopolicy-ai
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### Access API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Example API Calls

**Get Cities Baseline**:
```bash
curl http://localhost:8000/cities
```

**Simulate Policy**:
```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Delhi",
    "levers": {
      "ev_adoption_pct": 25,
      "solar_adoption_pct": 20,
      "trees_planted_pct": 35,
      "plastic_recycling_pct": 70,
      "public_transport_usage_pct": 55
    }
  }'
```

**Compare Scenarios**:
```bash
curl -X POST http://localhost:8000/compare \
  -H "Content-Type: application/json" \
  -d '{
    "scenario1": {
      "city": "Delhi",
      "levers": {
        "ev_adoption_pct": 25,
        "solar_adoption_pct": 20,
        "trees_planted_pct": 35,
        "plastic_recycling_pct": 70,
        "public_transport_usage_pct": 55
      }
    },
    "scenario2": {
      "city": "Delhi",
      "levers": {
        "ev_adoption_pct": 40,
        "solar_adoption_pct": 35,
        "trees_planted_pct": 50,
        "plastic_recycling_pct": 80,
        "public_transport_usage_pct": 65
      }
    }
  }'
```

**Get Recommendations**:
```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Delhi",
    "target_reduction_pct": 30
  }'
```

---

## Next Steps (Week 4 & Beyond)

1. **Frontend Development (Week 4)**:
   - Build React UI with city selector, interactive sliders, and results display.
   - Integrate Recharts for visualizations.
   - Implement scenario save/compare functionality.

2. **AI Integration (Week 5)**:
   - Integrate built-in LLM (IBM Granite or similar) for enhanced explanations.
   - Implement scenario comparison narratives.

3. **Polish & Deployment (Week 6)**:
   - Add PDF report generation.
   - Ensure responsive design.
   - Deploy to production.

---

## Notes

- The synthetic data generation uses domain-informed rules to ensure realistic relationships between policy levers and environmental metrics.
- All models are trained on synthetic data; real-world data integration is a future enhancement.
- The FastAPI backend is production-ready with proper validation, error handling, and documentation.
- The `/recommend` endpoint uses grid search for efficiency; more sophisticated optimization algorithms (e.g., scipy.optimize) can be integrated in the future.
