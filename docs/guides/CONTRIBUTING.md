# Contributing to URBANAi

Thank you for your interest in contributing to URBANAi! This guide will help you get started with development.

## Development Setup

### Prerequisites
- Python 3.12+
- Node.js v18+
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd HACKNOVA
   ```

2. **Create Python virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate      # Windows
   source venv/bin/activate   # Linux/macOS
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   Copy-Item .env.example .env
   # Edit .env as needed
   ```

5. **Configure local review data:**
   The API creates the SQLite review database automatically on first request. Do not commit the generated database file.

6. **Run the backend:**
   ```bash
   python -m uvicorn api.main:app --reload
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Development Guidelines

### Code Style

**Python:**
- Follow PEP 8
- Use type hints for function parameters and returns
- Keep functions focused and under 50 lines when possible
- Use docstrings for modules, classes, and public functions

**JavaScript/React:**
- Use functional components with hooks
- Keep components under 200 lines
- Use descriptive variable and function names
- Add JSDoc comments for complex logic

### Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make focused commits:
   ```bash
   git commit -m "feat: add multi-hazard earthquake scoring"
   git commit -m "test: add earthquake risk tests"
   ```

3. Push to your fork and create a Pull Request

4. PR should include:
   - Clear description of changes
   - Link to related issues
   - Test results showing coverage maintained or improved

### Commit Message Format

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `test:` - Adding or updating tests
- `docs:` - Documentation updates
- `refactor:` - Code refactoring
- `chore:` - Build, dependencies, or configuration

Example:
```
feat: add multi-hazard risk scoring with 7 components

- Implement weighted scoring for earthquake, windstorm, air quality, wildfire, landslide, industrial hazards
- Add HAZARD_WEIGHTS configuration with normalized weights
- Include hazard scores in risk prediction response
- Update frontend controls for all hazard levels

Closes #42
```

## Testing

### Running Tests

```bash
cd backend

# Run all tests
python -m pytest

# Run with verbose output
python -m pytest -v

# Run specific test file
python -m pytest tests/test_model.py

# Run with coverage report
python -m pytest --cov=backend --cov-report=html
```

### Writing Tests

**Test file structure:**
```python
import pytest
from services import model

class TestFeatureName:
    """Test category for related functionality."""
    
    def test_specific_behavior(self):
        """Test one specific behavior."""
        result = model.some_function(input_data)
        assert result == expected_output
    
    def test_error_handling(self):
        """Test error conditions."""
        with pytest.raises(ValueError):
            model.some_function(invalid_input)
```

**Best practices:**
- Test one behavior per test function
- Use descriptive names: `test_predict_risk_with_high_rainfall_returns_high_score`
- Use fixtures for common setup (see `conftest.py`)
- Aim for >70% code coverage
- Test both happy path and error cases

## Architecture Guidelines

### Backend Module Structure

```
backend/
├── api/
│   ├── main.py          # FastAPI application, endpoints
│   └── __init__.py
├── services/
│   ├── model.py         # ML model, risk calculations
│   ├── model.py         # Model integration
│   ├── logger.py        # Structured logging
│   └── __init__.py
├── data/
│   ├── flood_data.csv   # Training data
│   ├── flood_risk_model.joblib  # Trained model
│   └── __init__.py
├── config.py            # Environment configuration
├── init_db.py           # Database schema initialization
├── requirements.txt     # Python dependencies
└── tests/
    ├── conftest.py      # pytest fixtures
    ├── test_model.py
    ├── test_api.py
    └── test_config.py
```

### Key Design Patterns

1. **Repository Pattern:** Data access (database vs in-memory) abstracted in services
2. **Dependency Injection:** Database and logger injected via settings
3. **Configuration Management:** Environment variables via Settings class
4. **Structured Logging:** JSON-formatted logs with full context
5. **Input Validation:** Pydantic models with Field constraints and validators

## Feature Development Example: Adding a New Hazard

### 1. Update Model (`backend/services/model.py`)
```python
# Add to HAZARD_WEIGHTS
HAZARD_WEIGHTS = {
    'flood': 0.35,
    'earthquake': 0.15,
    'windstorm': 0.15,
    'air_quality': 0.15,
    'wildfire': 0.08,
    'landslide': 0.07,
    'industrial': 0.05,
    'new_hazard': 0.05  # New addition
}
```

### 2. Update API Request Model (`backend/api/main.py`)
```python
class PredictRequest(BaseModel):
    # ... existing fields ...
    new_hazard: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
```

### 3. Add to Frontend (`frontend/src/pages/RiskPrediction.jsx`)
```javascript
const HAZARD_CONTROLS = [
    // ... existing hazards ...
    ['newHazard', 'New Hazard Exposure']
];
```

### 4. Write Tests (`backend/tests/test_model.py`)
```python
def test_new_hazard_affects_overall_risk(self):
    """Verify new hazard impacts overall risk scoring."""
    # Test implementation
```

### 5. Update Documentation
- Update README.md multi-hazard table
- Update this CONTRIBUTING.md with any new requirements

## Local Data Store

The local review store is created automatically at `backend/data/urbanai_local.db`.
Do not commit that generated file. A hosted persistent provider must be selected and
implemented before production data is introduced.

## Deployment

### Production Checklist
- [ ] All tests passing with >70% coverage
- [ ] Environment variables configured
- [ ] Hosted data provider configured for production
- [ ] Frontend built: `npm run build`
- [ ] Backend running on appropriate port
- [ ] CORS origins configured correctly
- [ ] Logging enabled and monitored
- [ ] Hosted data backups configured

### Docker Deployment (Future)
Dockerfile configurations coming soon.

## Troubleshooting

### Common Issues

**Python module not found:**
```bash
# Ensure you're in the correct directory with venv activated
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Port already in use:**
```bash
# Change port in .env or command line
python -m uvicorn api.main:app --port 8001
```

**Operational data unavailable:**
```bash
# Check that the local API is running
curl http://localhost:8000/wards
# The local review database is created automatically on first request.
```

**Tests failing:**
```bash
# Ensure all dependencies installed
pip install -r requirements.txt
# Run with verbose output to see errors
python -m pytest -vv
```

## Getting Help

- Check existing [Issues](https://github.com) for similar problems
- Review [Architecture Documentation](docs/architecture.md)
- Open a new issue with:
  - What you were trying to do
  - What happened
  - What you expected to happen
  - Python/Node/OS versions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to URBANAi! 🎉
