"""
pytest configuration and fixtures for URBANAi backend tests
"""

import pytest
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = str(Path(__file__).parent.parent.parent / "backend")
sys.path.insert(0, backend_path)

from config import settings
from services import model


@pytest.fixture(scope="session")
def ml_model():
    """Load the trained model once per test session."""
    return model.load_model()


@pytest.fixture
def sample_features():
    """Provide sample ward features for testing."""
    return {
        'rainfall_mm': 300,
        'drainage_capacity_score': 50,
        'elevation_m': 20,
        'population_density': 20000,
        'past_flood_events': 3,
        'earthquake': 'LOW',
        'windstorm': 'MEDIUM',
        'air_quality': 'MEDIUM',
        'wildfire': 'LOW',
        'landslide': 'LOW',
        'industrial': 'LOW'
    }


@pytest.fixture
def sample_hazards():
    """Provide sample hazard inputs for testing."""
    return {
        'earthquake': 'LOW',
        'windstorm': 'MEDIUM',
        'air_quality': 'MEDIUM',
        'wildfire': 'LOW',
        'landslide': 'LOW',
        'industrial': 'LOW'
    }


@pytest.fixture
def client():
    """Provide a test client for the FastAPI application."""
    from fastapi.testclient import TestClient
    from api.main import app
    
    return TestClient(app)
