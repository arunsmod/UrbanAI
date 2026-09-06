# model.py
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from typing import List, Dict, Any

FEATURES = [
    'rainfall_mm',
    'drainage_capacity_score',
    'elevation_m',
    'population_density',
    'past_flood_events'
]

DATA_DIR = Path(__file__).resolve().parents[1] / 'data'
DATASET_PATH = DATA_DIR / 'flood_data.csv'
MODEL_PATH = DATA_DIR / 'flood_risk_model.joblib'

HAZARD_WEIGHTS = {
    'flood': 0.35,
    'earthquake': 0.15,
    'windstorm': 0.15,
    'air_quality': 0.15,
    'wildfire': 0.08,
    'landslide': 0.07,
    'industrial': 0.05,
}

SEVERITY_SCORES = {'LOW': 20, 'MEDIUM': 55, 'HIGH': 90}

def train_model():
    """Train a RandomForestRegressor and save the model."""
    df = pd.read_csv(DATASET_PATH)

    X = df[FEATURES]
    y = df['flood_risk_score']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"✅ Model trained. Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model

def load_model():
    """Load the trained model from disk."""
    return joblib.load(MODEL_PATH)

def predict_risk(features_dict: Dict[str, Any], model=None) -> float:
    """
    Predict flood risk score for a single ward.
    features_dict must contain all FEATURES keys.
    """
    if model is None:
        model = load_model()

    df = pd.DataFrame([features_dict])
    df = df[FEATURES]  # ensure correct column order
    return float(model.predict(df)[0])

def calculate_overall_risk(flood_risk: float, hazards: Dict[str, str]) -> Dict[str, Any]:
    """Combine the flood model output with normalized multi-hazard signals."""
    scores = {'flood': max(0, min(100, flood_risk))}
    for hazard in HAZARD_WEIGHTS:
        if hazard == 'flood':
            continue
        scores[hazard] = SEVERITY_SCORES.get(str(hazards.get(hazard, 'LOW')).upper(), 20)

    overall = sum(scores[name] * weight for name, weight in HAZARD_WEIGHTS.items())
    return {
        'overall': round(max(0, min(100, overall)), 2),
        'components': {name: round(value, 2) for name, value in scores.items()},
    }

def apply_intervention(features: Dict[str, Any], intervention: str) -> Dict[str, Any]:
    """Return a modified copy of features after applying an intervention."""
    new = features.copy()

    if intervention == 'drain_cleaning':
        new['drainage_capacity_score'] = min(100, new['drainage_capacity_score'] + 20)
    elif intervention == 'desilting':
        new['drainage_capacity_score'] = min(100, new['drainage_capacity_score'] + 10)
    elif intervention == 'pumps':
        new['rainfall_mm'] *= 0.85
    elif intervention == 'green_cover':
        new['elevation_m'] += 2  # proxy for improved water retention
    else:
        # Unknown intervention, no change
        pass

    return new

def simulate(ward_features: Dict[str, Any], interventions: List[str], model=None) -> Dict[str, float]:
    """
    Simulate the effect of one or more interventions.
    Returns original risk, new risk, and reduction.
    """
    original_risk = predict_risk(ward_features, model)

    new_features = ward_features.copy()
    for intervention in interventions:
        new_features = apply_intervention(new_features, intervention)

    new_risk = predict_risk(new_features, model)
    reduction = original_risk - new_risk

    return {
        'original_risk': round(original_risk, 2),
        'new_risk': round(new_risk, 2),
        'reduction': round(reduction, 2)
    }

def get_risk_factors(features_dict: Dict[str, Any], model=None) -> List[Dict[str, Any]]:
    """
    Return top contributing factors for risk based on model feature importances.
    """
    if model is None:
        model = load_model()

    importances = model.feature_importances_
    labels = {
        'rainfall_mm': 'Rainfall',
        'drainage_capacity_score': 'Drainage Capacity',
        'elevation_m': 'Elevation',
        'population_density': 'Population Density',
        'past_flood_events': 'Past Flood Events'
    }

    factors = []
    for i, feature in enumerate(FEATURES):
        factors.append({
            'feature': labels.get(feature, feature),
            'value': features_dict[feature],
            'importance': round(importances[i] * 100, 1)
        })

    # Sort by importance descending
    factors.sort(key=lambda x: x['importance'], reverse=True)
    return factors

if __name__ == "__main__":
    train_model()