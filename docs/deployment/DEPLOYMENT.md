# Infrastructure & Deployment Guide

This directory is reserved for runtime and delivery configuration:

- Docker and local service definitions
- Kubernetes manifests
- CI/CD workflows
- Monitoring and health checks
- Backup and recovery configuration
- Security and IAM integration

## Development Deployment

### Local Development (Current)
For local development:
```bash
# Windows - Automatic launch
launch_urbanai.bat

# Or manual PowerShell
./start.ps1
```

**Configuration via `.env`:**
```
ENVIRONMENT=development
API_HOST=0.0.0.0
API_PORT=8000
ENABLE_LOGGING=true
ENABLE_VALIDATION=true
```

**Ports:**
- Frontend: http://localhost:5173 (React Vite dev server)
- Backend: http://localhost:8000 (FastAPI)
- API Docs: http://localhost:8000/docs (Swagger UI)

## Production Deployment

### Pre-Deployment Checklist
- [ ] `.env` configured with `ENVIRONMENT=production`
- [ ] Local SQLite review verified
- [ ] Hosted operational data provider selected before production
- [ ] Frontend built: `cd frontend && npm run build`
- [ ] Backend requirements installed: `pip install -r requirements.txt`
- [ ] All tests passing: `pytest --cov=backend`
- [ ] CORS_ORIGINS configured for your domain
- [ ] Logging enabled and monitored

### Free Render deployment

The root `render.yaml` defines the FastAPI service. Create a Render Blueprint from the GitHub repository and keep the web service on the Free plan for the initial demo.

Set these values in Render:

```text
CORS_ORIGINS=https://your-site.netlify.app
ADMIN_EMAIL=admin@urbanai.gov
ADMIN_PASSWORD_HASH=<generated PBKDF2 hash>
```

Render installs `backend/requirements.txt` and runs Uvicorn on the assigned `$PORT`. Free services sleep when idle. The local SQLite file is for review only and is not durable production storage.

### Render warm-up workflow

The repository includes `.github/workflows/warm-render-backend.yml`, which pings `https://urbanai-api.onrender.com/` every 14 minutes and can also be started manually from the GitHub Actions tab.

The workflow already contains the public Render URL. A `RENDER_HEALTH_URL` GitHub repository secret is optional and can override it if the backend URL changes:

```text
RENDER_HEALTH_URL=https://urbanai-api.onrender.com/
```

This is only a best-effort warm-up. GitHub scheduled workflows can be delayed or skipped, and Render may still cold-start the service. Test the deployed site immediately before the hackathon presentation and keep frontend demo fallback data available.

### Configuration for Production

**`.env` Settings:**
```
ENVIRONMENT=production
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["https://yourdomain.com"]
LOG_LEVEL=INFO
ENABLE_LOGGING=true
ENABLE_VALIDATION=true
```

### Local data setup

No setup is required for local review. The API creates `backend/data/urbanai_local.db` automatically from `backend/data/flood_data.csv`.

### Production data setup

Replace the local SQLite adapter with the selected hosted provider, credentials, access rules, and ingestion process before production deployment.

### Running Backend Service

**Using Python ASGI server (Production-ready):**
```bash
cd backend
pip install gunicorn
gunicorn api.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

**Or direct with uvicorn:**
```bash
python -m uvicorn api.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4
```

### Running Frontend Service

**Build for production:**
```bash
cd frontend
npm run build
# Creates dist/ folder with optimized bundle
```

**Serve static files:**
```bash
# Using Node.js
npx serve -s dist -l 3000

# Or with Python SimpleHTTPServer
cd dist
python -m http.server 8080

# Or with any web server (Nginx, Apache, etc.)
```

## Monitoring & Logging

### Application Logs

Logs are structured JSON format (if `ENABLE_LOGGING=true`):
```json
{
  "timestamp": "2024-08-31T19:14:40.663000",
  "level": "INFO",
  "logger_name": "urbanai",
  "message": "Created intervention for ward 24: drain_cleaning",
  "module": "main",
  "function": "create_intervention",
  "line": 422
}
```

**View logs:**
```bash
# Real-time logs
tail -f backend.log

# Filter by level
grep "ERROR" backend.log

# Search for specific feature
grep "prediction" backend.log
```

### Health Check

```bash
# Check if API is running
curl http://localhost:8000/

# Expected response:
# {"message": "URBANAi API", "status": "ok", "version": "0.1.0"}
```

### Database Monitoring

```bash
# Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public';

# Check recent outcomes
SELECT * FROM outcomes ORDER BY created_at DESC LIMIT 10;

# Check intervention status
SELECT status, COUNT(*) as count FROM simulations GROUP BY status;
```

## Backup & Recovery

### Database Backup

```bash
# Full backup
pg_dump urbanai > urbanai_backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump urbanai | gzip > urbanai_backup_$(date +%Y%m%d).sql.gz
```

### Database Restore

```bash
# From plain text backup
psql urbanai < urbanai_backup_20240831.sql

# From compressed backup
gunzip -c urbanai_backup_20240831.sql.gz | psql urbanai
```

### Application Data Backup

```bash
# Backup model and data files
tar -czf urbanai_data_$(date +%Y%m%d).tar.gz \
  backend/data/flood_risk_model.joblib \
  backend/data/flood_data.csv \
  .env
```

## Troubleshooting

### Port Already in Use

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in .env
API_PORT=8001
```

### API Data Connection Failed

```bash
# Check the local API and SQLite review store
curl http://localhost:8000/
curl http://localhost:8000/wards
```

### Memory Issues

```bash
# Increase worker processes carefully
# Too many workers = high memory, few workers = low throughput
gunicorn api.main:app --workers 4  # Typical: CPU_count * 2 + 1
```

## Docker Deployment (Future)

Placeholder for Dockerfile and docker-compose configuration:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend .
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Performance Tuning

### Database Connection Pool

Adjust in `.env`:
```
DATABASE_POOL_SIZE=10  # Default
DATABASE_POOL_SIZE=20  # High traffic
```

### API Server Workers

For N CPU cores:
```bash
# Recommended: (CPU_count * 2) + 1
# Example: 4 CPUs → 9 workers
gunicorn api.main:app --workers 9
```

### Frontend Optimization

Already included:
- Vite code splitting
- Tailwind CSS minification
- React production build
- Lazy loading for routes

## Security Considerations

- Keep `.env` file secure (not in version control)
- Use strong database passwords
- Enable HTTPS in production
- Configure CORS_ORIGINS to specific domains
- Regularly update dependencies: `pip list --outdated`
- Use environment-specific credentials
- Monitor logs for suspicious activity

## Useful Commands

```bash
# Install in production mode
pip install -r requirements.txt --no-dev

# Check API status
curl -I http://localhost:8000/

# Test prediction endpoint
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

# View all wards
curl http://localhost:8000/wards | python -m json.tool
```

---

For development setup, see [CONTRIBUTING.md](../../CONTRIBUTING.md)
For API documentation, see http://localhost:8000/docs
For architecture overview, see [docs/architecture.md](../../docs/architecture.md)

