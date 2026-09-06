# main.py
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from contextlib import asynccontextmanager
from datetime import datetime
import json
from services import model
from services.local_database import connect, ward_payload, ward_row
from config import settings, logger
from starlette.responses import JSONResponse
from starlette.requests import Request
from api.auth import create_access_token, get_current_user, verify_password

# Load the model once at startup.
ml_model = None


def _require_database():
    return connect()


def _get_ward(ward_id: int):
    connection = _require_database()
    row = ward_row(connection, ward_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Ward not found")
    return connection, row


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_model
    
    # Initialize ML model
    try:
        settings.validate()  # Validate configuration
        ml_model = model.load_model()
        logger.info("✅ ML Model loaded successfully")
    except FileNotFoundError as e:
        logger.error(f"❌ Required production model is unavailable: {e}")
        raise RuntimeError("A trained production model must be provisioned before startup") from e
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise
    
    yield
    
    logger.info("Shutting down URBANAi API")

app = FastAPI(
    title="URBANAi API",
    version="1.0.0",
    description="AI-Powered Urban Sustainability Decision Engine",
    lifespan=lifespan
)

# CORS Configuration
cors_origins = settings.CORS_ORIGINS if settings.CORS_ORIGINS[0] != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS enabled for origins: {cors_origins}")

# ------------------------------------------------------------------
# Global Exception Handlers
# ------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with proper logging."""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "type": "http_error"}
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors."""
    logger.error(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": f"Validation error: {str(exc)}", "type": "validation_error"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "server_error"}
    )

# ------------------------------------------------------------------
# Pydantic request models with validation
# ------------------------------------------------------------------
class SimulateRequest(BaseModel):
    """Request model for simulation endpoint."""
    ward_id: int = Field(..., gt=0, description="Ward ID must be positive")
    interventions: List[str] = Field(..., min_items=1, description="At least one intervention required")
    
    @validator('interventions')
    def validate_interventions(cls, v):
        """Validate that all interventions are known."""
        valid = {'drain_cleaning', 'desilting', 'pumps', 'green_cover'}
        invalid = set(v) - valid
        if invalid:
            raise ValueError(f"Unknown interventions: {invalid}. Valid: {valid}")
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class PredictRequest(BaseModel):
    """Request model for risk prediction endpoint with multi-hazard support."""
    
    # Flood-related factors
    rainfall: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    drainageCapacity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    historicalWaterlogging: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    waterloggingSignals: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    elevation: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    
    # Natural hazards
    earthquake: str = Field("LOW", pattern="^(LOW|MEDIUM|HIGH)$")
    windstorm: str = Field("LOW", pattern="^(LOW|MEDIUM|HIGH)$")
    airQuality: str = Field("LOW", pattern="^(LOW|MEDIUM|HIGH)$")
    wildfire: str = Field("LOW", pattern="^(LOW|MEDIUM|HIGH)$")
    landslide: str = Field("LOW", pattern="^(LOW|MEDIUM|HIGH)$")
    industrial: str = Field("LOW", pattern="^(LOW|MEDIUM|HIGH)$")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "rainfall": "HIGH",
                "drainageCapacity": "LOW",
                "historicalWaterlogging": "HIGH",
                "waterloggingSignals": "HIGH",
                "elevation": "MEDIUM",
                "earthquake": "LOW",
                "windstorm": "MEDIUM",
                "airQuality": "MEDIUM",
                "wildfire": "LOW",
                "landslide": "LOW",
                "industrial": "LOW"
            }
        }


class OptimizeRequest(BaseModel):
    """Request model for resource optimization endpoint."""
    ward_id: int = Field(..., gt=0, description="Ward ID must be positive")
    budget: float = Field(..., gt=0, description="Budget must be positive")
    workers: int = Field(999999, ge=0, description="Worker count must be non-negative")
    timeframe: int = Field(999999, ge=0, description="Timeframe must be non-negative")

class InterventionRequest(BaseModel):
    ward_id: int
    intervention: str
    budget: float | None = None

class OutcomeRequest(BaseModel):
    ward_id: int
    predicted_risk: float
    actual_risk: float
    interventions: List[str] = Field(..., min_items=1)


class ChatRequest(BaseModel):
    ward_id: int = Field(..., gt=0)
    question: str = Field(..., min_length=2, max_length=1000)


class InterventionStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|in_progress|completed|cancelled)$")
    actor: str = Field("local-admin", min_length=2, max_length=120)

# ------------------------------------------------------------------
# API endpoints
# ------------------------------------------------------------------
@app.get("/")
def home():
    """
    Health check and API information.
    
    Returns:
        dict: Status and message indicating the API is running
    """
    logger.info("Health check requested")
    return {
        "message": "URBANAi API running",
        "status": "ok",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.post("/auth/login")
def login(request: LoginRequest):
    """Authenticate the configured municipal administrator."""
    if request.email.lower() != settings.ADMIN_EMAIL.lower() or not verify_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": create_access_token(settings.ADMIN_EMAIL),
        "token_type": "bearer",
        "user": {"email": settings.ADMIN_EMAIL},
    }


@app.get("/auth/me")
def current_user(user: dict = Depends(get_current_user)):
    return user


@app.post("/ai/chat")
def ai_chat(request: ChatRequest):
    """Return grounded local analysis for a ward without inventing unsupported data."""
    connection, row = _get_ward(request.ward_id)
    ward = ward_payload(row, ml_model)
    question = request.question.lower()
    hazards = sorted(ward["hazardScores"].items(), key=lambda item: item[1], reverse=True)
    top_hazards = hazards[:3]
    factors = model.get_risk_factors(ward["features"], ml_model)
    evidence = [
        f"Composite risk: {ward['overallRisk']}%",
        *[f"{name.replace('_', ' ').title()}: {value}%" for name, value in top_hazards],
        f"Model confidence: {ward['confidence']}%",
    ]

    if any(term in question for term in ("air", "pollution", "quality")):
        answer = (
            f"{ward['name']} has an air-quality hazard score of "
            f"{ward['hazardScores'].get('air_quality')}%. Review sensor freshness and exposure hotspots "
            "before treating this as a flood-only problem."
        )
        actions = ["Verify the latest air-quality observation time.", "Identify vulnerable populations and sensitive facilities.", "Compare air-quality exposure with wind conditions before issuing an alert."]
    elif any(term in question for term in ("earthquake", "seismic", "building")):
        answer = (
            f"{ward['name']} has an earthquake exposure score of "
            f"{ward['hazardScores'].get('earthquake')}%. This is an exposure indicator, not a seismic forecast."
        )
        actions = ["Validate building and critical-infrastructure inventories.", "Review emergency access and evacuation plans.", "Do not interpret this score as a probability of an earthquake occurring."]
    elif any(term in question for term in ("highest", "priority", "risk", "hazard")):
        answer = (
            f"The highest current hazard dimensions for {ward['name']} are "
            + ", ".join(f"{name.replace('_', ' ')} ({value}%)" for name, value in top_hazards)
            + f". The composite risk is {ward['overallRisk']}%."
        )
        actions = ["Start with the highest-scoring hazard that has a verified current data source.", "Compare interventions against workforce, cost, and duration limits.", "Record measured outcomes after implementation."]
    elif any(term in question for term in ("factor", "why", "model")):
        answer = f"The flood model estimates {ward['floodRisk']}% flood risk for {ward['name']}. Its strongest model factors are " + ", ".join(f"{item['feature']} ({item['importance']}% importance)" for item in factors[:3]) + "."
        actions = ["Inspect the leading model factors for data freshness.", "Run a scenario in Decision Lab before committing resources.", "Use Outcome Tracking to compare prediction with measured results."]
    else:
        answer = f"{ward['name']} currently has a composite risk of {ward['overallRisk']}% across seven tracked hazard dimensions. Ask about a specific hazard, leading factors, or intervention priority."
        actions = ["Ask which hazards are highest.", "Ask why the model produced this score.", "Ask how to prioritize interventions."]

    return {"answer": answer, "evidence": evidence, "actions": actions, "model": "Random Forest flood model + multi-hazard scoring", "ward_id": request.ward_id}

@app.get("/wards")
def get_wards():
    """Return list of ward IDs with their current risk scores."""
    connection = _require_database()
    rows = connection.execute("SELECT * FROM wards ORDER BY code").fetchall()
    return {"wards": [ward_payload(ward_row(connection, row["id"]), ml_model) for row in rows]}

@app.get("/wards/{ward_id}")
def get_ward_details(ward_id: int):
    """Return full feature set and risk for a specific ward."""
    connection, row = _get_ward(ward_id)
    return ward_payload(row, ml_model)

@app.post("/wards/{ward_id}/predict")
def predict_ward(ward_id: int, request: PredictRequest):
    """
    Predict multi-hazard risk score for a ward based on categorical indicators.
    
    This endpoint combines:
    - Flood risk from the trained ML model
    - Multi-hazard signals (earthquake, windstorm, air quality, etc.)
    
    Args:
        ward_id: The ward ID to predict for
        request: Prediction parameters (rainfall, drainage, elevation, hazards)
    
    Returns:
        dict: Overall risk score (0-100), individual component scores, and explanation
    
    Raises:
        HTTPException: If ward_id not found (404)
    """
    connection, row = _get_ward(ward_id)

    logger.info(f"Risk prediction for ward {ward_id}: {request.model_dump()}")
    
    features = ward_payload(row, ml_model)["features"]
    if not all(value is not None for value in features.values()):
        raise HTTPException(status_code=503, detail="Ward indicators are unavailable")
    rainfall_scale = {"LOW": 0.7, "MEDIUM": 1.0, "HIGH": 1.3}
    drainage_scale = {"LOW": 0.55, "MEDIUM": 0.8, "HIGH": 1.15}
    elevation_scale = {"LOW": 0.6, "MEDIUM": 1.0, "HIGH": 1.4}
    history_scale = {"LOW": 0, "MEDIUM": 2, "HIGH": 4}
    signal_scale = {"LOW": 0, "MEDIUM": 1, "HIGH": 3}

    features["rainfall_mm"] *= rainfall_scale.get(request.rainfall, 1.0)
    features["drainage_capacity_score"] *= drainage_scale.get(request.drainageCapacity, 1.0)
    features["elevation_m"] *= elevation_scale.get(request.elevation, 1.0)
    features["past_flood_events"] += history_scale.get(request.historicalWaterlogging, 0)
    features["past_flood_events"] += signal_scale.get(request.waterloggingSignals, 0)

    flood_risk = max(0, min(100, model.predict_risk(features, ml_model)))
    hazard_inputs = {
        'earthquake': request.earthquake,
        'windstorm': request.windstorm,
        'air_quality': request.airQuality,
        'wildfire': request.wildfire,
        'landslide': request.landslide,
        'industrial': request.industrial,
    }
    overall = model.calculate_overall_risk(flood_risk, hazard_inputs)
    
    logger.info(f"Ward {ward_id} overall risk: {overall['overall']}")
    
    return {
        "riskProbability": overall['overall'],
        "floodRisk": round(flood_risk, 2),
        "hazardScores": overall['components'],
        "factors": request.model_dump(),
        "confidence": 84,
        "explanation": "The overall score combines flood exposure with earthquake, windstorm, air quality, wildfire, landslide, and industrial hazard signals."
    }

@app.get("/risk/{ward_id}")
def get_risk(ward_id: int):
    """Return only the risk score for a ward."""
    connection, row = _get_ward(ward_id)
    return {"ward_id": ward_id, "risk": ward_payload(row, ml_model)["risk"]}

@app.get("/interventions")
def get_interventions():
    """
    Return the catalogue of available interventions and currently active interventions.
    
    Returns:
        dict: Available interventions and list of active/planned interventions
    """
    database = _require_database()
    rows = database.execute("SELECT code, name, description, cost, workers, duration, active FROM interventions ORDER BY name").fetchall()
    interventions = {
        row["code"]: {
            "description": row["description"] or row["name"],
            "cost": float(row["cost"]),
            "workers": row["workers"],
            "duration": row["duration"],
            "active": row["active"],
        }
        for row in rows
    }
    active = [dict(row) for row in database.execute("SELECT * FROM simulations ORDER BY created_at DESC").fetchall()]
    return {"interventions": interventions, "active": active}


@app.get("/data-sources")
def get_data_sources():
    rows = _require_database().execute("SELECT * FROM data_sources ORDER BY name").fetchall()
    return {"sources": [dict(row) for row in rows]}


@app.get("/alerts")
def get_alerts():
    rows = _require_database().execute("SELECT * FROM alerts WHERE status = 'open' ORDER BY id DESC").fetchall()
    return {"alerts": [dict(row) for row in rows]}

@app.post("/interventions")
def create_intervention(request: InterventionRequest):
    """
    Commit an intervention plan for outcome tracking.
    
    Args:
        request: Intervention details (ward_id, intervention type, budget)
    
    Returns:
        dict: Created intervention record with ID
    
    Raises:
        HTTPException: If ward_id not found (404) or intervention unknown (400)
    """
    database, row = _get_ward(request.ward_id)
    definition_rows = database.execute("SELECT code, name, cost, workers, duration FROM interventions WHERE code = ? AND active = 1", (request.intervention,)).fetchall()
    if not definition_rows:
        raise HTTPException(status_code=400, detail="Unknown intervention")

    definition = definition_rows[0]
    item = {
        "ward_id": request.ward_id,
        "intervention": request.intervention,
        "status": "planned",
        "budget": request.budget or float(definition["cost"]),
        "workers": definition["workers"],
        "duration": definition["duration"]
    }
    
    cursor = database.execute("INSERT INTO simulations (ward_id, intervention, status) VALUES (?, ?, ?)", (request.ward_id, request.intervention, "planned"))
    database.execute(
        "INSERT INTO audit_log (entity_type, entity_id, action, actor) VALUES (?, ?, ?, ?)",
        ("simulation", cursor.lastrowid, "planned", "local-admin"),
    )
    database.commit()
    item["id"] = cursor.lastrowid
    
    logger.info(f"Created intervention for ward {request.ward_id}: {request.intervention}")
    return item


@app.patch("/interventions/{simulation_id}/status")
def update_intervention_status(simulation_id: int, request: InterventionStatusRequest):
    database = _require_database()
    simulation = database.execute("SELECT * FROM simulations WHERE id = ?", (simulation_id,)).fetchone()
    if simulation is None:
        raise HTTPException(status_code=404, detail="Intervention plan not found")

    allowed = {
        "planned": {"approved", "cancelled"},
        "approved": {"in_progress", "cancelled"},
        "in_progress": {"completed", "cancelled"},
        "completed": set(),
        "cancelled": set(),
    }
    if request.status not in allowed.get(simulation["status"], set()):
        raise HTTPException(status_code=409, detail=f"Cannot move plan from {simulation['status']} to {request.status}")

    timestamp_column = {
        "in_progress": "started_at",
        "completed": "completed_at",
    }.get(request.status)
    if timestamp_column:
        database.execute(
            f"UPDATE simulations SET status = ?, {timestamp_column} = CURRENT_TIMESTAMP, approved_by = COALESCE(approved_by, ?) WHERE id = ?",
            (request.status, request.actor, simulation_id),
        )
    else:
        database.execute("UPDATE simulations SET status = ?, approved_by = COALESCE(approved_by, ?) WHERE id = ?", (request.status, request.actor, simulation_id))
    database.execute(
        "INSERT INTO audit_log (entity_type, entity_id, action, actor) VALUES (?, ?, ?, ?)",
        ("simulation", simulation_id, request.status, request.actor),
    )
    database.commit()
    return {"id": simulation_id, "status": request.status, "actor": request.actor}


@app.get("/interventions/{simulation_id}/audit")
def get_intervention_audit(simulation_id: int):
    rows = _require_database().execute(
        "SELECT action, actor, created_at FROM audit_log WHERE entity_type = 'simulation' AND entity_id = ? ORDER BY created_at",
        (simulation_id,),
    ).fetchall()
    return {"events": [dict(row) for row in rows]}

@app.post("/simulate")
def simulate_ward(request: SimulateRequest):
    """
    Simulate one or more interventions on a ward.
    Returns original risk, new risk, and reduction.
    """
    database, row = _get_ward(request.ward_id)
    
    result = model.simulate(ward_payload(row, ml_model)["features"], request.interventions, ml_model)
    result.update({
        "ward_id": request.ward_id,
        "interventions": request.interventions
    })
    return result

@app.get("/risk-factors/{ward_id}")
def get_risk_factors(ward_id: int):
    """
    Return the top contributing factors for the ward's risk score.
    Uses model feature importances.
    """
    database, row = _get_ward(ward_id)
    
    factors = model.get_risk_factors(ward_payload(row, ml_model)["features"], ml_model)
    return {
        "ward_id": ward_id,
        "risk_factors": factors
    }

@app.post("/optimize")
def optimize_ward(request: OptimizeRequest):
    """
    Greedy budget-constrained optimizer.
    Selects interventions that give best risk reduction per rupee.
    """
    database, row = _get_ward(request.ward_id)
    
    if request.budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be positive")
    
    catalogue_rows = database.execute("SELECT code, cost, workers, duration FROM interventions WHERE active = 1 ORDER BY code").fetchall()
    interventions = [row["code"] for row in catalogue_rows]
    results = []
    
    # Evaluate each intervention independently
    for intervention in interventions:
        definition = next(item for item in catalogue_rows if item["code"] == intervention)
        if definition['workers'] > request.workers or definition['duration'] > request.timeframe:
            continue
        sim_result = model.simulate(ward_payload(row, ml_model)["features"], [intervention], ml_model)
        cost = float(definition['cost'])
        reduction = sim_result['reduction']
        results.append({
            'intervention': intervention,
            'cost': cost,
            'workers': definition['workers'],
            'duration': definition['duration'],
            'risk_reduction': reduction,
            'efficiency': reduction / cost if cost > 0 else 0
        })
    
    # Sort by efficiency (highest risk reduction per rupee)
    results.sort(key=lambda x: x['efficiency'], reverse=True)
    
    # Greedy selection within budget
    selected = []
    remaining_budget = request.budget
    total_reduction = 0
    
    for item in results:
        if item['cost'] <= remaining_budget:
            selected.append(item)
            remaining_budget -= item['cost']
            total_reduction += item['risk_reduction']
    
    original_risk = model.predict_risk(ward_payload(row, ml_model)["features"], ml_model)
    new_risk = original_risk - total_reduction
    new_risk = max(0, min(100, new_risk))  # clamp
    
    return {
        'ward_id': request.ward_id,
        'budget': request.budget,
        'original_risk': round(original_risk, 2),
        'selected_interventions': selected,
        'total_cost': request.budget - remaining_budget,
        'total_risk_reduction': round(total_reduction, 2),
        'new_risk': round(new_risk, 2),
        'remaining_budget': remaining_budget
    }

@app.post("/outcomes")
def add_outcome(request: OutcomeRequest):
    """
    Record the actual outcome after interventions were implemented.
    
    This endpoint feeds the feedback loop, storing predicted vs actual
    risk changes to improve future models.
    
    Args:
        request: Outcome data (ward_id, predicted_risk, actual_risk, interventions)
    
    Returns:
        dict: Confirmation message and recorded outcome
    
    Raises:
        HTTPException: If ward_id not found (404)
    """
    database, row = _get_ward(request.ward_id)
    
    outcome = {
        'ward_id': request.ward_id,
        'predicted_risk': request.predicted_risk,
        'actual_risk': request.actual_risk,
        'interventions': json.dumps(request.interventions),
    }
    
    cursor = database.execute(
        "INSERT INTO outcomes (ward_id, predicted_risk, actual_risk, interventions) VALUES (?, ?, ?, ?)",
        (request.ward_id, request.predicted_risk, request.actual_risk, outcome["interventions"]),
    )
    database.execute(
        "UPDATE simulations SET status = 'completed' WHERE ward_id = ? AND intervention IN ({})".format(
            ",".join("?" for _ in request.interventions)
        ),
        [request.ward_id, *request.interventions],
    )
    database.commit()
    outcome["id"] = cursor.lastrowid
    
    logger.info(f"Recorded outcome for ward {request.ward_id}: {outcome}")
    
    return {"message": "Outcome recorded", "outcome": outcome}

@app.get("/outcomes")
def get_outcomes():
    """
    Return all recorded outcomes for the feedback loop.
    
    Used to analyze prediction accuracy and improve future models.
    
    Returns:
        dict: List of all recorded outcomes
    """
    database = _require_database()
    rows = database.execute("SELECT * FROM outcomes ORDER BY created_at DESC").fetchall()
    outcomes = [dict(item) for item in rows]
    pending = database.execute(
        """
        SELECT s.id, s.ward_id, s.intervention, i.flood_risk_score
        FROM simulations s
        JOIN ward_indicators i ON i.ward_id = s.ward_id
        WHERE s.status = 'planned'
        ORDER BY s.created_at DESC
        """
    ).fetchall()
    outcomes.extend({
        "id": f"pending-{item['id']}",
        "ward_id": item["ward_id"],
        "interventions": item["intervention"],
        "predicted_risk": item["flood_risk_score"],
        "actual_risk": None,
        "status": "pending",
        "difference": None,
        "notes": "Awaiting measured post-intervention risk.",
    } for item in pending)
    logger.info(f"Retrieved {len(outcomes)} outcomes")
    return {"outcomes": outcomes}