# URBANAi Project Structure

## Runtime layout

```text
HACKNOVA/
├── backend/
│   ├── api/
│   │   ├── main.py                 FastAPI routes and application startup
│   │   └── auth.py                 Local development authentication
│   ├── config/
│   │   └── config.py               Environment-driven settings
│   ├── data/
│   │   ├── flood_data.csv          Provisioned model training data
│   │   └── flood_risk_model.joblib Trained flood-risk model artifact
│   ├── services/
│   │   ├── model.py                Flood model and multi-hazard scoring
│   │   ├── local_database.py        SQLite review database
│   │   └── logger.py               Logging helpers
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/             Shared dashboard components
│   │   ├── pages/                  Dashboard routes and workflows
│   │   └── services/api.js         FastAPI client
│   ├── public/_redirects            Netlify SPA routing
│   ├── package.json
│   └── vite.config.js
├── tests/backend/                  Backend unit and integration tests
├── docs/                           Architecture, API, guides, deployment
├── scripts/                        Local startup helpers
├── netlify.toml                    Netlify frontend configuration
├── render.yaml                     Render backend configuration
├── .env.example                    Local/deployment variable template
└── .gitignore                      Secret and generated-file protection
```

## Deployment status

- Local review data uses SQLite and is generated at `backend/data/urbanai_local.db`.
- The SQLite file is ignored and must not be treated as durable production storage.
- Netlify hosts the frontend using `netlify.toml`.
- Render hosts the FastAPI service using `render.yaml`.
- A hosted provider migration, such as Firebase, must be completed before using real persistent production data.

See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) and [docs/deployment/GITHUB_BACKUP.md](docs/deployment/GITHUB_BACKUP.md) for the handoff steps.
