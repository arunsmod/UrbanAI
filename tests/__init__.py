"""
URBANAi Test Suite

This module contains all tests for the URBANAi backend, organized by component:
- tests/backend/test_model.py - ML model and risk calculation functions
- tests/backend/test_api.py - FastAPI endpoints and HTTP behavior  
- tests/backend/test_config.py - Configuration loading and validation

Run all tests:
    python -m pytest

Run with coverage:
    python -m pytest --cov=backend --cov-report=html

Run specific test file:
    python -m pytest tests/backend/test_model.py -v
"""
