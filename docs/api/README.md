# API Documentation

Reference documentation for URBANAi REST API endpoints.

## Quick Links

- **API Server:** http://localhost:8000
- **Interactive Swagger UI:** http://localhost:8000/docs
- **ReDoc Documentation:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

## Core Endpoints

### Health & Status
- `GET /` - API health check and version

### Ward Management
- `GET /wards` - List all wards with risk scores
- `GET /wards/{ward_id}` - Get specific ward details

### Risk Prediction
- `POST /wards/{ward_id}/predict` - Predict multi-hazard risk

### Interventions
- `GET /interventions` - List available interventions
- `POST /interventions` - Create intervention plan

### Simulation & Optimization
- `POST /wards/{ward_id}/simulate` - Simulate intervention outcomes
- `POST /optimize` - Optimize intervention selection

### Outcome Tracking
- `GET /outcomes` - Retrieve recorded outcomes
- `POST /outcomes` - Record outcome after implementation

## API Features

### Multi-Hazard Risk Scoring
Seven hazard components combined with normalized weights:
- Flood (35%)
- Earthquake (15%)
- Windstorm (15%)
- Air Quality (15%)
- Wildfire (8%)
- Landslide (7%)
- Industrial (5%)

### Input Validation
- Categorical fields: LOW, MEDIUM, HIGH
- Numeric constraints: positive values
- Enum validation: known intervention types

### Error Handling
- 400: Validation error
- 404: Resource not found
- 500: Server error (with details)

## Testing the API

### Using cURL
```bash
# Get wards
curl http://localhost:8000/wards

# Predict risk
curl -X POST http://localhost:8000/wards/24/predict \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Using Python Requests
```python
import requests

response = requests.post(
    'http://localhost:8000/wards/24/predict',
    json={
        'rainfall': 'HIGH',
        'drainageCapacity': 'LOW',
        'historicalWaterlogging': 'HIGH',
        'waterloggingSignals': 'HIGH',
        'elevation': 'MEDIUM',
        'earthquake': 'LOW',
        'windstorm': 'MEDIUM',
        'airQuality': 'MEDIUM',
        'wildfire': 'LOW',
        'landslide': 'LOW',
        'industrial': 'LOW'
    }
)
print(response.json())
```

### Using JavaScript/Fetch
```javascript
fetch('http://localhost:8000/wards/24/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rainfall: 'HIGH',
    drainageCapacity: 'LOW',
    historicalWaterlogging: 'HIGH',
    waterloggingSignals: 'HIGH',
    elevation: 'MEDIUM',
    earthquake: 'LOW',
    windstorm: 'MEDIUM',
    airQuality: 'MEDIUM',
    wildfire: 'LOW',
    landslide: 'LOW',
    industrial: 'LOW'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

## Response Format

### Success Response (200)
```json
{
  "riskProbability": 72.5,
  "floodRisk": 65.0,
  "hazardScores": {
    "flood": 65.0,
    "earthquake": 20.0,
    "windstorm": 55.0,
    "air_quality": 55.0,
    "wildfire": 20.0,
    "landslide": 20.0,
    "industrial": 20.0
  },
  "confidence": 0.87,
  "factors": [...],
  "explanation": "High flood risk due to rainfall and drainage issues"
}
```

### Error Response (400/404/500)
```json
{
  "detail": "Error message describing the issue"
}
```

## Advanced Features

### Filtering by Ward
All endpoints accept optional `ward_id` parameter to scope results.

### Pagination (Future)
Outcome and intervention endpoints will support pagination with `limit` and `offset`.

### Real-time Updates (Future)
WebSocket support for real-time prediction updates.

## Rate Limiting (Future)
Currently no rate limiting; will be implemented for production.

---

For complete endpoint details, visit the interactive API docs at `http://localhost:8000/docs` when the server is running.
