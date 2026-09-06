"""
URBANAi Configuration Module

Loads configuration from environment variables with sensible defaults.
Supports different environments: development, staging, production.
"""

import os
import json
import logging
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not installed. Environment variables must be set manually.")

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def project_path(value: str) -> str:
    path = Path(value)
    return str(path if path.is_absolute() else PROJECT_ROOT / path)


class Settings:
    """Application settings from environment variables."""

    PROJECT_ROOT: Path = PROJECT_ROOT
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_RELOAD: bool = os.getenv("API_RELOAD", "true" if ENVIRONMENT == "development" else "false").lower() == "true"
    
    # CORS Configuration
    _cors_value = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    try:
        CORS_ORIGINS: list = json.loads(_cors_value) if _cors_value.lstrip().startswith("[") else _cors_value.split(",")
    except json.JSONDecodeError:
        CORS_ORIGINS = _cors_value.split(",")
    CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]
    
    # ML Model Paths
    MODEL_PATH: str = project_path(os.getenv("MODEL_PATH", "backend/data/flood_risk_model.joblib"))
    DATA_PATH: str = project_path(os.getenv("DATA_PATH", "backend/data/flood_data.csv"))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@urbanai.gov")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "change-me-now")
    ADMIN_PASSWORD_HASH: str = os.getenv("ADMIN_PASSWORD_HASH", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    API_KEY_OPTIONAL: bool = os.getenv("API_KEY_OPTIONAL", "false").lower() == "true"
    
    # Feature Flags
    ENABLE_LOGGING: bool = os.getenv("ENABLE_LOGGING", "true").lower() == "true"
    ENABLE_VALIDATION: bool = os.getenv("ENABLE_VALIDATION", "true").lower() == "true"
    
    @classmethod
    def validate(cls) -> None:
        """Validate critical configuration."""
        if not Path(cls.MODEL_PATH).exists():
            raise FileNotFoundError(f"Model not found at {cls.MODEL_PATH}")
        if not Path(cls.DATA_PATH).exists():
            raise FileNotFoundError(f"Data not found at {cls.DATA_PATH}")
        
        if cls.ENVIRONMENT == "production":
            if cls.SECRET_KEY == "dev-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be changed in production")
            if not cls.ADMIN_PASSWORD_HASH:
                raise ValueError("ADMIN_PASSWORD_HASH is required in production")
            if not cls.CORS_ORIGINS or "*" in cls.CORS_ORIGINS:
                raise ValueError("Explicit CORS_ORIGINS are required in production")
    
    @classmethod
    def get_logger(cls) -> logging.Logger:
        """Get configured logger for the application."""
        logger = logging.getLogger("urbanai")
        level = getattr(logging, cls.LOG_LEVEL.upper(), logging.INFO)
        logger.setLevel(level)
        
        # Only configure if no handlers already exist
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger


# Create global settings instance
settings = Settings()
logger = settings.get_logger()

if __name__ == "__main__":
    print("URBANAi Configuration")
    print(f"  Environment: {settings.ENVIRONMENT}")
    print(f"  API: {settings.API_HOST}:{settings.API_PORT}")
    print(f"  Model: {settings.MODEL_PATH}")
    print("  Data: Local SQLite review store")
    print(f"  CORS Origins: {settings.CORS_ORIGINS}")
