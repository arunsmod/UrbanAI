"""
Unit tests for the ML model module
"""

import pytest
import pandas as pd
from services import model


class TestModelFunctions:
    """Test model prediction and risk calculation functions."""
    
    def test_predict_risk_returns_float(self, ml_model, sample_features):
        """Predict risk should return a float between 0 and 100."""
        risk = model.predict_risk(sample_features, ml_model)
        assert isinstance(risk, float)
        assert 0 <= risk <= 100
    
    def test_predict_risk_consistency(self, ml_model, sample_features):
        """Same input should produce same output."""
        risk1 = model.predict_risk(sample_features, ml_model)
        risk2 = model.predict_risk(sample_features, ml_model)
        assert risk1 == risk2
    
    def test_calculate_overall_risk_weights_matter(self, sample_features):
        """Different hazard levels should produce different scores."""
        # Low hazards
        hazards_low = {
            'earthquake': 'LOW',
            'windstorm': 'LOW',
            'air_quality': 'LOW',
            'wildfire': 'LOW',
            'landslide': 'LOW',
            'industrial': 'LOW'
        }
        result_low = model.calculate_overall_risk(30, hazards_low)
        
        # High hazards
        hazards_high = {
            'earthquake': 'HIGH',
            'windstorm': 'HIGH',
            'air_quality': 'HIGH',
            'wildfire': 'HIGH',
            'landslide': 'HIGH',
            'industrial': 'HIGH'
        }
        result_high = model.calculate_overall_risk(30, hazards_high)
        
        # High hazards should result in higher overall risk
        assert result_high['overall'] > result_low['overall']
    
    def test_calculate_overall_risk_returns_dict(self):
        """Overall risk should return dict with overall and components."""
        hazards = {
            'earthquake': 'MEDIUM',
            'windstorm': 'MEDIUM',
            'air_quality': 'MEDIUM',
            'wildfire': 'LOW',
            'landslide': 'LOW',
            'industrial': 'LOW'
        }
        result = model.calculate_overall_risk(50, hazards)
        
        assert isinstance(result, dict)
        assert 'overall' in result
        assert 'components' in result
        assert isinstance(result['components'], dict)
        assert 'flood' in result['components']
    
    def test_overall_risk_in_valid_range(self):
        """Overall risk should always be between 0 and 100."""
        for flood_risk in [0, 25, 50, 75, 100]:
            for hazard_level in ['LOW', 'MEDIUM', 'HIGH']:
                hazards = {k: hazard_level for k in [
                    'earthquake', 'windstorm', 'air_quality',
                    'wildfire', 'landslide', 'industrial'
                ]}
                result = model.calculate_overall_risk(flood_risk, hazards)
                assert 0 <= result['overall'] <= 100
    
    def test_apply_intervention_drain_cleaning(self):
        """Drain cleaning should improve drainage capacity."""
        features = {
            'rainfall_mm': 300,
            'drainage_capacity_score': 40,
            'elevation_m': 20,
            'population_density': 20000,
            'past_flood_events': 3
        }
        
        modified = model.apply_intervention(features, 'drain_cleaning')
        assert modified['drainage_capacity_score'] > features['drainage_capacity_score']
    
    def test_apply_intervention_pumps(self):
        """Pumps should reduce effective rainfall."""
        features = {
            'rainfall_mm': 300,
            'drainage_capacity_score': 40,
            'elevation_m': 20,
            'population_density': 20000,
            'past_flood_events': 3
        }
        
        modified = model.apply_intervention(features, 'pumps')
        assert modified['rainfall_mm'] < features['rainfall_mm']
    
    def test_simulate_returns_proper_structure(self, ml_model):
        """Simulate should return proper dict structure."""
        features = {
            'rainfall_mm': 300,
            'drainage_capacity_score': 40,
            'elevation_m': 20,
            'population_density': 20000,
            'past_flood_events': 3
        }
        
        result = model.simulate(features, ['drain_cleaning'], ml_model)
        
        assert isinstance(result, dict)
        assert 'original_risk' in result
        assert 'new_risk' in result
        assert 'reduction' in result
        
        # New risk should be lower (intervention applied)
        assert result['new_risk'] <= result['original_risk']
    
    def test_get_risk_factors_returns_list(self, ml_model, sample_features):
        """Get risk factors should return sorted list."""
        factors = model.get_risk_factors(sample_features, ml_model)
        
        assert isinstance(factors, list)
        assert len(factors) > 0
        
        # Should be sorted by importance (descending)
        importances = [f['importance'] for f in factors]
        assert importances == sorted(importances, reverse=True)
    
    def test_risk_factors_have_required_fields(self, ml_model, sample_features):
        """Each risk factor should have required fields."""
        factors = model.get_risk_factors(sample_features, ml_model)
        
        required_fields = {'feature', 'value', 'importance'}
        for factor in factors:
            assert required_fields.issubset(factor.keys())


class TestProductionModelArtifacts:
    """Test that provisioned production model artifacts are usable."""

    def test_production_dataset_has_required_columns(self):
        dataset = pd.read_csv(model.DATASET_PATH)
        for feature in model.FEATURES:
            assert feature in dataset.columns
        assert 'flood_risk_score' in dataset.columns
