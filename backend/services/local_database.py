"""SQLite-backed local data store for development and UI/model review."""

import csv
import json
import sqlite3
from pathlib import Path
from typing import Any

from services import model

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DB_PATH = DATA_DIR / "urbanai_local.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS wards (
    id INTEGER PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    population INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS ward_indicators (
    ward_id INTEGER PRIMARY KEY REFERENCES wards(id) ON DELETE CASCADE,
    rainfall_mm REAL NOT NULL,
    drainage_capacity_score REAL NOT NULL,
    elevation_m REAL NOT NULL,
    population_density REAL NOT NULL,
    past_flood_events INTEGER NOT NULL,
    flood_risk_score REAL NOT NULL,
    air_quality_index REAL NOT NULL,
    earthquake_exposure TEXT NOT NULL,
    windstorm_exposure TEXT NOT NULL,
    wildfire_exposure TEXT NOT NULL,
    landslide_exposure TEXT NOT NULL,
    industrial_exposure TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost REAL NOT NULL,
    workers INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_id INTEGER NOT NULL REFERENCES wards(id),
    priority TEXT NOT NULL,
    zone TEXT NOT NULL,
    risk TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
);
CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_id INTEGER NOT NULL,
    intervention TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_id INTEGER NOT NULL,
    predicted_risk REAL NOT NULL,
    actual_risk REAL NOT NULL,
    interventions TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

INTERVENTIONS = [
    ("drain_cleaning", "Drain Cleaning", "Clear priority stormwater drains.", 200000, 8, 7),
    ("desilting", "Drain Desilting", "Remove silt from drainage channels.", 300000, 6, 5),
    ("pumps", "Targeted Pumping", "Deploy pumps at waterlogging hotspots.", 800000, 10, 4),
    ("green_cover", "Green Cover", "Increase local stormwater retention.", 200000, 5, 14),
]


def _severity(value: float, low: float, high: float) -> str:
    if value >= high:
        return "HIGH"
    if value >= low:
        return "MEDIUM"
    return "LOW"


def initialize_local_database(path: Path = DB_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.executescript(SCHEMA)
        simulation_columns = {row[1] for row in connection.execute("PRAGMA table_info(simulations)")}
        if "approved_by" not in simulation_columns:
            connection.execute("ALTER TABLE simulations ADD COLUMN approved_by TEXT")
        if "started_at" not in simulation_columns:
            connection.execute("ALTER TABLE simulations ADD COLUMN started_at TEXT")
        if "completed_at" not in simulation_columns:
            connection.execute("ALTER TABLE simulations ADD COLUMN completed_at TEXT")
        existing = connection.execute("SELECT COUNT(*) FROM wards").fetchone()[0]
        if existing:
            return

        with (DATA_DIR / "flood_data.csv").open(newline="", encoding="utf-8") as source:
            rows = list(csv.DictReader(source))[:8]

        for index, row in enumerate(rows, start=1):
            rainfall = float(row["rainfall_mm"])
            drainage = float(row["drainage_capacity_score"])
            elevation = float(row["elevation_m"])
            population = int(float(row["population_density"]))
            flood_events = int(row["past_flood_events"])
            connection.execute(
                "INSERT INTO wards VALUES (?, ?, ?, ?, ?, ?, ?)",
                (index, f"WARD-{index:03d}", f"Ward {index}", "Local Review Area", population,
                 13.04 + index * 0.008, 80.20 + index * 0.009),
            )
            connection.execute(
                """
                INSERT INTO ward_indicators VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    index, rainfall, drainage, elevation, population, flood_events,
                    float(row["flood_risk_score"]),
                    round(25 + (rainfall / 10) + (100 - drainage) * 0.25, 2),
                    _severity(60 - elevation, 20, 45),
                    _severity(rainfall, 300, 380),
                    _severity(100 - elevation, 60, 82),
                    _severity(45 - elevation, 15, 32),
                    _severity(population, 18000, 28000),
                ),
            )

        connection.executemany(
            "INSERT INTO interventions (code, name, description, cost, workers, duration) VALUES (?, ?, ?, ?, ?, ?)",
            INTERVENTIONS,
        )
        connection.executemany(
            "INSERT INTO data_sources (name, type, status, description) VALUES (?, ?, ?, ?)",
            [
                ("Rainfall observations", "Weather", "Local", "Loaded from the local flood training dataset."),
                ("Air quality indicators", "Air Quality", "Local", "Local review values stored per ward."),
                ("Seismic exposure indicators", "Earthquake", "Local", "Local review exposure categories."),
                ("Hazard indicator registry", "Multi-hazard", "Local", "Local ward-level hazard attributes."),
            ],
        )
        connection.executemany(
            "INSERT INTO alerts (ward_id, priority, zone, risk) VALUES (?, ?, ?, ?)",
            [(1, "HIGH", "Ward 1", "Flood exposure requires review."), (2, "MEDIUM", "Ward 2", "Air quality indicator requires review.")],
        )
        connection.commit()


def connect(path: Path = DB_PATH) -> sqlite3.Connection:
    initialize_local_database(path)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def ward_row(connection: sqlite3.Connection, ward_id: int):
    return connection.execute(
        """
        SELECT w.*, i.* FROM wards w
        JOIN ward_indicators i ON i.ward_id = w.id
        WHERE w.id = ?
        """, (ward_id,),
    ).fetchone()


def ward_payload(row: sqlite3.Row, loaded_model: Any) -> dict:
    features = {
        "rainfall_mm": row["rainfall_mm"],
        "drainage_capacity_score": row["drainage_capacity_score"],
        "elevation_m": row["elevation_m"],
        "population_density": row["population_density"],
        "past_flood_events": row["past_flood_events"],
    }
    flood_risk = float(row["flood_risk_score"])
    overall = model.calculate_overall_risk(flood_risk, {
        "earthquake": row["earthquake_exposure"],
        "windstorm": row["windstorm_exposure"],
        "air_quality": _severity(row["air_quality_index"], 45, 65),
        "wildfire": row["wildfire_exposure"],
        "landslide": row["landslide_exposure"],
        "industrial": row["industrial_exposure"],
    })
    latitude, longitude = row["latitude"], row["longitude"]
    return {
        "ward_id": row["id"], "code": row["code"], "name": row["name"], "city": row["city"],
        "population": row["population"], "coordinates": [latitude, longitude],
        "polygon": [
            [latitude + 0.004, longitude - 0.004],
            [latitude + 0.004, longitude + 0.004],
            [latitude - 0.004, longitude + 0.004],
            [latitude - 0.004, longitude - 0.004],
        ],
        "features": features, "risk": flood_risk, "floodRisk": flood_risk,
        "overallRisk": overall["overall"], "hazardScores": overall["components"],
        "riskFactors": {
            "rainfallExposure": _severity(row["rainfall_mm"], 280, 380),
            "drainageCapacity": _severity(100 - row["drainage_capacity_score"], 30, 60),
            "historicalWaterlogging": _severity(row["past_flood_events"], 2, 5),
            "waterloggingSignals": _severity(row["flood_risk_score"], 15, 25),
            "elevation": _severity(row["elevation_m"], 15, 30),
            "earthquake": row["earthquake_exposure"],
            "windstorm": row["windstorm_exposure"],
            "airQuality": _severity(row["air_quality_index"], 45, 65),
            "wildfire": row["wildfire_exposure"],
            "landslide": row["landslide_exposure"],
            "industrial": row["industrial_exposure"],
        },
        "dimensions": {"infrastructure": round(row["drainage_capacity_score"], 1), "environmentalQuality": round(100 - row["air_quality_index"], 1)},
        "sustainabilityScore": round((row["drainage_capacity_score"] + 100 - row["air_quality_index"]) / 2, 1),
        "confidence": 82, "explanation": "Calculated from local ward indicators.",
        "dataFreshness": {"status": "local_review", "source": "flood_data.csv", "lastUpdated": None},
        "riskProbabilities": [], "sustainabilityTrend": [],
        "interventions": [
            {"id": code, "name": name, "description": description, "cost": cost,
             "workers": workers, "duration": duration, "type": code,
             "expectedRiskReduction": round(model.simulate(features, [code], loaded_model)["reduction"], 2)}
            for code, name, description, cost, workers, duration in INTERVENTIONS
        ],
    }
