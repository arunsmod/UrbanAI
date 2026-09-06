# URBANAi Architecture

## Current layout

- `frontend/`: presentation layer. React routes cover the dashboard, risk map, sustainability, prediction, Decision Lab, AI Analyst, interventions, outcomes, and admin settings.
- `backend/api/`: API and gateway entrypoint. `api.main:app` exposes the current FastAPI routes and CORS boundary.
- `backend/services/`: application and AI services. The risk model, prediction, intervention simulation, risk factors, and optimization logic live here.
- `backend/data/`: provisioned model artifacts and offline training inputs.
- `backend/services/local_database.py`: SQLite local review database and multi-hazard records.

## Runtime flow

```text
frontend -> backend/api -> backend/services -> provisioned model artifact
```

## Planned boundaries

The local build uses SQLite for review and testing. Replace the local database adapter with the selected hosted provider before production deployment. The FastAPI service remains a separate model-computation service.

## Model strategy

- **Flood model:** the provisioned Random Forest model predicts flood risk from rainfall, drainage, elevation, population density, and historical events.
- **Multi-hazard engine:** a transparent weighted scoring model combines flood output with air quality, earthquake, windstorm, wildfire, landslide, and industrial indicators.

This is intentionally a two-stage design rather than two independently trained models. A second learned model should be added only after labeled, time-stamped air-quality and hazard outcome data are available; otherwise it would create unsupported confidence and unnecessary operating cost.
