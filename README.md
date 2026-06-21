# Hawkvision

Hawkvision is a production-oriented full-stack AI SaaS platform for object detection, tracking, analytics, reporting, and alerting across images, videos, and camera streams.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, ShadCN-style components, React Query, Recharts
- Backend: FastAPI, Python, SQLAlchemy, Alembic, JWT, role-based access control
- AI: YOLOv8 integration point with a deterministic local fallback, DeepSORT-style tracking service abstraction
- Database: PostgreSQL in production, SQLite fallback for development
- Deployment: Vercel frontend, Render backend, Neon/Supabase PostgreSQL, Docker Compose

## Quick Start

On Windows, after installing dependencies, launch both services with:

```powershell
.\start-hawkvision.ps1
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m scripts.seed
python -m scripts.download_model
uvicorn app.main:app --reload
```

API docs are available at `http://localhost:8000/api/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

Demo credentials after seeding:

- Admin: `admin@hawkvision.ai` / `Admin123!`
- User: `analyst@hawkvision.ai` / `Analyst123!`

## Docker

```bash
copy .env.example .env
docker compose up --build
```

## Architecture

```text
frontend/
  src/components
  src/pages
  src/layouts
  src/hooks
  src/services
  src/store
  src/types

backend/
  app/api
  app/core
  app/models
  app/schemas
  app/services
  app/repositories
  app/database
  app/utils
```

## Production Notes

- Set a strong `SECRET_KEY`.
- Use managed PostgreSQL through Neon or Supabase.
- Configure `CORS_ORIGINS` with the Vercel domain.
- Configure SMTP variables before enabling email alerts.
- Real inference is enabled by default with the official pretrained YOLOv8 Small COCO model.
- Ultralytics is AGPL-3.0 licensed. Review its licensing terms before offering a closed-source commercial service.
- Store uploaded media in object storage such as S3, R2, or Supabase Storage for production.

See [docs/API.md](docs/API.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
