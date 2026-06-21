# Deployment Guide

## Database: Neon or Supabase

1. Create a PostgreSQL project.
2. Copy the pooled connection string.
3. Set `DATABASE_URL` in Render using the SQLAlchemy format:

```text
postgresql+psycopg://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

## Backend: Render

1. Push this repository to GitHub.
2. Create a Render web service from `backend/` or use `render.yaml`.
3. Set environment variables:
   - `ENVIRONMENT=production`
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `CORS_ORIGINS=https://your-vercel-app.vercel.app`
   - SMTP settings if alert emails are required
4. Run `alembic upgrade head` in the Render build command.

## Frontend: Vercel

1. Import the repository in Vercel.
2. Set Root Directory to `frontend`.
3. Set `VITE_API_URL=https://your-render-service.onrender.com/api/v1`.
4. Deploy.

## AI Models

Free-tier hosts may not have enough CPU/RAM for large YOLO models. Start with `yolov8n.pt`, then move inference to a GPU worker or model-serving endpoint when traffic grows.

