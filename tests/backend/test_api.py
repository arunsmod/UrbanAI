"""
Integration tests for the FastAPI application
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthAndBasicEndpoints:
    """Test basic API health checks."""
    
    def test_home_endpoint(self, client):
        """Test the home endpoint returns status."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert data["status"] == "ok"
        assert "version" in data
    
    def test_wards_endpoint(self, client):
        """Test the wards listing endpoint."""
        response = client.get("/wards")
        assert response.status_code == 200
        data = response.json()
        assert len(data["wards"]) == 8
        assert set(data["wards"][0]["hazardScores"]) == {
            "flood", "earthquake", "windstorm", "air_quality", "wildfire", "landslide", "industrial"
        }

    def test_login_returns_bearer_token(self, client):
        response = client.post(
            "/auth/login",
            json={"email": "admin@urbanai.gov", "password": "change-me-now"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@urbanai.gov"
        assert data["access_token"]

    def test_login_rejects_invalid_password(self, client):
        response = client.post(
            "/auth/login",
            json={"email": "admin@urbanai.gov", "password": "wrong-password"},
        )
        assert response.status_code == 401

    def test_current_user_requires_valid_token(self, client):
        unauthorized = client.get("/auth/me")
        assert unauthorized.status_code == 401

        login = client.post(
            "/auth/login",
            json={"email": "admin@urbanai.gov", "password": "change-me-now"},
        )
        token = login.json()["access_token"]
        authorized = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert authorized.status_code == 200
        assert authorized.json()["email"] == "admin@urbanai.gov"


class TestWardDetailsEndpoint:
    """Test ward detail retrieval."""
    
    def test_get_ward_details_valid_id(self, client):
        """Get ward details for valid ward ID."""
        response = client.get("/wards/1")
        assert response.status_code == 200
        assert response.json()["name"] == "Ward 1"
    
    def test_get_ward_details_invalid_id(self, client):
        """Get ward details for invalid ward ID should return 404."""
        response = client.get("/wards/99999")
        assert response.status_code == 404


class TestPredictionEndpoint:
    """Test risk prediction with multi-hazard scoring."""
    
    def test_predict_risk_valid_input(self, client):
        """Predict risk with valid input."""
        payload = {
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
        
        response = client.post("/wards/1/predict", json=payload)
        assert response.status_code == 200
        assert 0 <= response.json()["riskProbability"] <= 100
    
    def test_predict_risk_invalid_field_value(self, client):
        """Predict risk with invalid field value should fail validation."""
        payload = {
            "rainfall": "INVALID",  # Invalid value
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
        
        response = client.post("/wards/1/predict", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_predict_risk_missing_required_field(self, client):
        """Predict risk with missing required field should fail."""
        payload = {
            "rainfall": "HIGH",
            # Missing drainageCapacity
            "historicalWaterlogging": "HIGH",
            "waterloggingSignals": "HIGH",
            "elevation": "MEDIUM",
        }
        
        response = client.post("/wards/1/predict", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_hazard_scores_present_in_response(self, client):
        """Response should include individual hazard component scores."""
        payload = {
            "rainfall": "HIGH",
            "drainageCapacity": "LOW",
            "historicalWaterlogging": "HIGH",
            "waterloggingSignals": "HIGH",
            "elevation": "MEDIUM",
            "earthquake": "HIGH",
            "windstorm": "HIGH",
            "airQuality": "HIGH",
            "wildfire": "HIGH",
            "landslide": "HIGH",
            "industrial": "HIGH"
        }
        
        response = client.post("/wards/1/predict", json=payload)
        assert response.status_code == 200
        assert set(response.json()["hazardScores"]) == {
            "flood", "earthquake", "windstorm", "air_quality", "wildfire", "landslide", "industrial"
        }


class TestInterventionsEndpoint:
    """Test interventions management."""
    
    def test_get_interventions(self, client):
        """Get available interventions."""
        response = client.get("/interventions")
        assert response.status_code == 200
        assert len(response.json()["interventions"]) == 4
    
    def test_create_intervention_valid(self, client):
        """Create an intervention with valid data."""
        payload = {
            "ward_id": 1,
            "intervention": "drain_cleaning",
            "budget": 500000
        }
        
        response = client.post("/interventions", json=payload)
        assert response.status_code == 200

    def test_intervention_lifecycle(self, client):
        create = client.post(
            "/interventions",
            json={"ward_id": 1, "intervention": "pumps", "budget": 800000},
        )
        assert create.status_code == 200
        simulation_id = create.json()["id"]

        for status in ("approved", "in_progress", "completed"):
            response = client.patch(
                f"/interventions/{simulation_id}/status",
                json={"status": status, "actor": "test-admin"},
            )
            assert response.status_code == 200
            assert response.json()["status"] == status


class TestOutcomesEndpoint:
    """Test outcome tracking and feedback loop."""
    
    def test_add_outcome_valid(self, client):
        """Record an outcome with valid data."""
        payload = {
            "ward_id": 1,
            "predicted_risk": 75.0,
            "actual_risk": 60.0,
            "interventions": ["drain_cleaning"]
        }
        
        response = client.post("/outcomes", json=payload)
        assert response.status_code == 200
    
    def test_get_outcomes(self, client):
        """Retrieve all outcomes."""
        response = client.get("/outcomes")
        assert response.status_code == 200


class TestErrorHandling:
    """Test error handling and validation."""
    
    def test_predict_nonexistent_ward_returns_404(self, client):
        """Predict for non-existent ward should return 404."""
        payload = {
            "rainfall": "HIGH",
            "drainageCapacity": "LOW",
            "historicalWaterlogging": "HIGH",
            "waterloggingSignals": "HIGH",
            "elevation": "MEDIUM",
        }
        
        response = client.post("/wards/99999/predict", json=payload)
        assert response.status_code == 404
    
    def test_invalid_intervention_type(self, client):
        """Invalid intervention type should return 400."""
        payload = {
            "ward_id": 1,
            "intervention": "invalid_intervention",
            "budget": 500000
        }
        
        response = client.post("/interventions", json=payload)
        assert response.status_code == 400
