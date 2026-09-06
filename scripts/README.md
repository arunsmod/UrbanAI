# Scripts & Utilities

This folder contains startup and maintenance scripts for URBANAi.

## Scripts

**Note:** In the current setup, use the root `launch_urbanai.bat` or PowerShell commands directly to start services.

### Future Scripts
- `init-db.ps1` - Database initialization
- `setup-dev.ps1` - Development environment setup
- `deploy.ps1` - Production deployment automation
- `backup-db.ps1` - Database backup utility
- `health-check.ps1` - System health monitoring

## Running Services Manually

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api.main:app --reload
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
cd backend
pytest
```
