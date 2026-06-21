# Hawkvision API

Base path: `/api/v1`

Interactive documentation:

- Swagger: `/api/docs`
- ReDoc: `/api/redoc`

## Authentication

`POST /auth/register`

Creates a user account.

`POST /auth/login`

Returns a bearer token.

`GET /auth/me`

Returns the current user profile.

## Detection

`POST /detections/image`

Upload an image with optional `confidence_threshold` and `model_name`.

`POST /detections/video`

Upload a video and create a processing job.

`POST /detections/webcam`

Accepts webcam frame uploads from the frontend.

`GET /detections`

Search, filter, sort, and paginate detection history.

`GET /detections/{id}`

Returns detection details and tracked objects.

## Analytics

`GET /analytics/summary`

Returns total detections, average confidence, class counts, trend data, and recent events.

## Reports

`GET /reports/detections.csv`

Exports filtered detection history as CSV.

`GET /reports/detections.xlsx`

Exports filtered detection history as Excel.

`GET /reports/detections.pdf`

Exports a PDF summary report.

## Alerts

`GET /alerts/rules`

Lists alert rules.

`POST /alerts/rules`

Creates an alert rule.

`PATCH /alerts/rules/{id}`

Updates an alert rule.

`GET /alerts/events`

Lists detection-triggered alert events.

