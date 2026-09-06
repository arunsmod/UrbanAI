"""
Tests for configuration module
"""

import pytest
from config import settings


class TestConfigurationSettings:
    """Test configuration loading and validation."""
    
    def test_settings_loads_defaults(self):
        """Settings should load with default values."""
        assert settings.ENVIRONMENT is not None
        assert settings.API_PORT > 0
        assert settings.LOG_LEVEL in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    
    def test_settings_cors_origins_is_list(self):
        """CORS origins should be a list."""
        assert isinstance(settings.CORS_ORIGINS, list)
        assert len(settings.CORS_ORIGINS) > 0
    
    def test_feature_flags_are_boolean(self):
        """Feature flags should be boolean values."""
        assert isinstance(settings.ENABLE_LOGGING, bool)
        assert isinstance(settings.ENABLE_VALIDATION, bool)
    
    def test_debug_mode_matches_environment(self):
        """Debug mode should match the environment."""
        if settings.ENVIRONMENT == 'development':
            assert settings.DEBUG is True
        else:
            assert settings.DEBUG is False


class TestPathConfiguration:
    """Test file path configuration."""
    
    def test_model_path_exists(self):
        """Model path should exist or be creatable."""
        from pathlib import Path
        model_path = Path(settings.MODEL_PATH)
        # Model might not exist initially, but directory should be valid
        assert model_path.parent.exists() or model_path.parent.parent.exists()
    
    def test_data_path_exists(self):
        """Data path should exist or be creatable."""
        from pathlib import Path
        data_path = Path(settings.DATA_PATH)
        # Data might not exist initially, but directory should be valid
        assert data_path.parent.exists() or data_path.parent.parent.exists()


class TestLoggerConfiguration:
    """Test logger setup."""
    
    def test_logger_is_configured(self):
        """Logger should be properly configured."""
        from config import logger
        assert logger is not None
        assert logger.name == "urbanai"
