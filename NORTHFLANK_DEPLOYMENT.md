# Northflank Deployment Checklist

Use this when deploying the YieldLens backend on Northflank.

## Target Architecture

```text
GitHub Pages frontend
  -> Northflank FastAPI backend
  -> Northflank PostgreSQL addon
```

## Backend Service

- Repository: `NikhilMotwaniiii/YieldLens`
- Build type: Dockerfile
- Dockerfile path: `/backend/Dockerfile`
- Build context: `/backend`
- Public HTTP port: `8000`
- Health check path: `/health`

The Docker startup script runs:

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
```

## Database

Create a PostgreSQL addon in the same Northflank project and link its secrets to the backend service.

The backend accepts either:

- `DATABASE_URL`
- `POSTGRES_URI`

Northflank's PostgreSQL addon can expose connection values through linked addon secrets. If both are present, `DATABASE_URL` wins.

## Runtime Environment

Set these on the backend service:

```text
BACKEND_CORS_ORIGINS=https://nikhilmotwaniiii.github.io,http://localhost:3000,http://127.0.0.1:3000
BOND_PROVIDER=demo
ENVIRONMENT=production
```

Optional live-data provider variables:

```text
LIVE_BOND_SEARCH_URL=
LIVE_BOND_DETAIL_URL=
LIVE_BOND_API_KEY=
```

Only set live provider values when a legitimate licensed/free provider is available.

## Verification

After deployment, open:

```text
https://YOUR-NORTHFLANK-SERVICE_URL/health
```

Expected response:

```json
{"status":"ok"}
```

Then test from GitHub Pages by temporarily setting the API base in the browser console:

```js
localStorage.setItem("yieldlens-api-base", "https://YOUR-NORTHFLANK-SERVICE_URL");
location.reload();
```

Create a portfolio, add a bond, refresh the page, and confirm the portfolio persists.

After testing, replace the default `API_BASE` in `docs/index.html` with the final Northflank URL and push the change.
