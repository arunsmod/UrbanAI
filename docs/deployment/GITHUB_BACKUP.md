# GitHub Backup and Deployment Handoff

## Before upload

Confirm these files are not committed:

- `.env`
- `.venv/`
- `frontend/node_modules/`
- `frontend/dist/`
- `backend/data/urbanai_local.db`
- logs and local editor files

The repository `.gitignore` covers these paths. Never commit passwords, tokens, or generated deployment secrets.

## Local Git commands

Run these from the repository root after installing Git:

```powershell
git init
git add .
git status
git commit -m "Prepare URBANAi deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/HACKNOVA.git
git push -u origin main
```

## Hosting handoff

- Netlify reads `netlify.toml` and builds from `frontend/`.
- Render reads `render.yaml` and runs the FastAPI service from `backend/`.
- Set `VITE_API_URL` in Netlify to the public Render API URL.
- Set `CORS_ORIGINS` in Render to the public Netlify URL.