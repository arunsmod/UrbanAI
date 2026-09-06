# URBANAi - AI-Powered Urban Sustainability Decision Engine

URBANAi is an intelligent decision-support platform that helps urban authorities evaluate, prioritize, and implement sustainability interventions across city wards. Unlike traditional complaint or monitoring systems, URBANAi uses prescriptive analytics: it does not just show what is wrong, it recommends what to do.

## Project Overview

URBANAi combines environmental, infrastructure, mobility, and citizen data to compute ward-level sustainability and risk scores. Its AI-powered engines predict future urban risks, simulate intervention outcomes, and recommend the best actions under budget and resource constraints.

The local review build covers flood, air quality, earthquake, windstorm, wildfire, landslide, and industrial exposure, while the architecture can expand to additional urban risk domains.

## 🚀 Key Features
- **Overview Dashboard**: Unified municipal command center with real-time sustainability KPIs, priority alerts, and forecasting trends.
- **Urban Risk Map**: Spatial GIS dashboard built with React Leaflet and OpenStreetMap rendering flood basins.
- **Sustainability Intelligence**: Detailed indicator progress trackers covering Environmental, Infrastructure, Mobility, Services, and Community factors.
- **Predictive Urban Risk**: Machine learning model running parameter adjustments (precipitation, drainage siltation, citizen complaint telemetry) to predict live risk probabilities.
- **Decision Lab**: A What-If intervention simulator comparing expected cost, timeline, and risk-reduction differences.
- **Resource Optimizer**: Multi-constraint knapsack optimizer calculating the best combination of actions within budget and manpower boundaries.
- **AI Analyst**: Grounded analytical chatbot answering municipal queries with empirical evidence.
- **Outcome Tracking**: Closed-loop evaluation system graphing predicted outcomes against sensor telemetry to calibrate future predictions.

## Local Review Workflow

1. Assess ward-level flood risk.
2. Simulate potential interventions.
3. Optimize the intervention plan under a budget.
4. Record actual outcomes after implementation.
5. Use the feedback to improve future predictions.

## One-Sentence Pitch

URBANAi turns urban sustainability data into actionable intervention plans by predicting risk, simulating outcomes, and optimizing decisions for every city ward.

---

## 🛠️ Technology Stack
- **Frontend**: React, Vite, Tailwind CSS v3, Recharts, React Leaflet, Lucide React
- **Backend**: Python 3.12, FastAPI, scikit-learn, NumPy, Uvicorn

The prediction pipeline uses a trained Random Forest flood model followed by a transparent multi-hazard scoring engine. The local database supplies the additional hazard indicators for UI and workflow review.

## 🧱 Architecture
The repository uses Netlify for the React frontend and keeps the operational data-provider boundary configurable. The FastAPI service remains available for model computation.

---

## 💻 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)

### Setup & Run

#### Option 1: Automated Startup (Recommended)
You can start both servers and open the dashboard in your web browser with a single command:

1. Open a PowerShell console inside this folder.
2. Run the startup script:
   ```powershell
   ./start.ps1
   ```

For the easiest Windows access, double-click `launch_urbanai.bat`. It starts both services together and opens the dashboard automatically.

#### Option 2: Manual Setup with Environment Configuration

**Step 1: Configure Environment**
```bash
# Copy the template to create your .env file
Copy-Item .env.example .env

# Edit .env to customize:
# - ENVIRONMENT (development/production)
# - API_HOST and API_PORT
# - External data-provider variables when selected
# - Feature flags (ENABLE_LOGGING, ENABLE_VALIDATION)
```

**Step 2: Local database**
The backend automatically creates `backend/data/urbanai_local.db` on first request. It contains local review records for eight wards and separate flood, air-quality, earthquake, windstorm, wildfire, landslide, and industrial indicators. The generated SQLite file is ignored by Git.

**Step 3: Start FastAPI Backend Service:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Step 4: Start React Frontend Service (in a new terminal):**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your web browser.

**The data flow is:**

```text
React website (port 5173)
   -> FastAPI API (port 8000)
   -> Multi-hazard risk scoring (7 components with normalized weights)
   -> Random Forest model for flood prediction
   -> Intervention simulation and optimization
    -> Local SQLite operational data store
   -> Real-time prediction, simulation, and optimization results
```

**Once running, use:**

- Dashboard: `http://localhost:5173/`
- API health check: `http://localhost:8000/`
- Interactive API documentation: `http://localhost:8000/docs`

### Running Tests

```bash
cd backend
pip install pytest pytest-asyncio pytest-cov

# Run all tests
python -m pytest

# Run tests with coverage report
python -m pytest --cov=backend --cov-report=html

# Run specific test file
python -m pytest tests/test_model.py -v
```

**Current test suite covers:**
- Model functions (multi-hazard scoring, risk factors, simulations)
- API endpoints (prediction, interventions, outcomes, error handling)
- Configuration system (environment variables, paths, logging)
- Data generation and validation

---

## 🎯 Multi-Hazard Risk Scoring

URBANAi evaluates comprehensive urban risk by combining **7 hazard components** with optimized weights:

| Hazard Component | Weight | Categories | Purpose |
|---|---|---|---|
| **Flood Risk** | 35% | LOW/MEDIUM/HIGH | Historical waterlogging and precipitation data |
| **Earthquake Exposure** | 15% | LOW/MEDIUM/HIGH | Seismic hazard and building vulnerability |
| **Windstorm Exposure** | 15% | LOW/MEDIUM/HIGH | Cyclone/storm wind speed hazards |
| **Air Quality** | 15% | LOW/MEDIUM/HIGH | PM2.5, NO2, ozone pollution levels |
| **Wildfire Risk** | 8% | LOW/MEDIUM/HIGH | Forest proximity and dry season exposure |
| **Landslide Risk** | 7% | LOW/MEDIUM/HIGH | Slope stability and soil types |
| **Industrial Incidents** | 5% | LOW/MEDIUM/HIGH | Chemical plants, storage facilities |

**Overall Risk Score Formula:**
```
overall_risk = Σ(hazard_score × weight) where Σ(weights) = 1.0

Score Range: 0-100 (0=safe, 100=critical)
Category Mapping:
  LOW     → 20
  MEDIUM  → 55
  HIGH    → 90
```

**Example:**
- Ward with all HIGH hazards + HIGH flood = overall score ~85
- Ward with all LOW hazards + LOW flood = overall score ~20

---

## 🗄️ Database Configuration

### Local SQLite review data
```bash
# No external database is required for local review.
# The API creates backend/data/urbanai_local.db automatically.
```

For deployment, use a hosted persistent provider instead of treating local SQLite as production storage.

### Free deployment files

- `netlify.toml` configures the React frontend for Netlify.
- `render.yaml` configures the FastAPI service for Render Free.
- Keep `.env` local and configure deployment variables in the hosting dashboards.

Before GitHub upload, verify that `.env`, `.venv/`, `node_modules/`, `frontend/dist/`, and `backend/data/urbanai_local.db` are ignored.

---

## 📡 API Endpoints

### Health & Status
- `GET /` - API health check and version info

### Ward Management
- `GET /wards` - List all wards with risk scores
- `GET /wards/{ward_id}` - Get detailed ward information

### Risk Prediction
- `POST /wards/{ward_id}/predict` - Predict multi-hazard risk score
  - Input: 11 categorical fields (rainfall, earthquake, windstorm, etc.)
  - Output: Overall risk, flood risk, individual hazard scores, confidence

### Interventions
- `GET /interventions` - Get available interventions and active plans
- `POST /interventions` - Create a new intervention plan

### Simulation & Optimization
- `POST /wards/{ward_id}/simulate` - Simulate intervention outcomes
- `POST /optimize` - Find optimal intervention combination within budget

### Outcome Tracking
- `GET /outcomes` - Get all recorded outcomes (feedback loop)
- `POST /outcomes` - Record actual outcome after implementation

**Full API documentation:** http://localhost:8000/docs (Swagger UI)

---

## 🔧 Environment Configuration

Create `.env` file from template:
```bash
Copy-Item .env.example .env
```

**Key Variables:**
- `ENVIRONMENT`: development | production
- `VITE_API_URL`: deployed API URL for the frontend
- `ENABLE_LOGGING`: true | false (structured JSON logging)
- `ENABLE_VALIDATION`: true | false (Pydantic input validation)

**Features enabled by configuration:**
- Local SQLite review data during development
- Optional structured JSON logging with context (module, function, line number)
- Comprehensive input validation with regex patterns and value constraints


Production deployment requires a hosted persistent data provider, connected source feeds, and a model artifact validated against that data. The repository does not seed municipal records automatically.

### Netlify deployment

The repository includes `netlify.toml`. In Netlify, connect the repository and set `VITE_API_URL` to the public Render API URL. Netlify runs the frontend build automatically.
