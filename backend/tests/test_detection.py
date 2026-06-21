def authenticate(client) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={"email": "vision@example.com", "full_name": "Vision User", "password": "Password123!"},
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "vision@example.com", "password": "Password123!"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_image_detection_updates_analytics(client):
    headers = authenticate(client)
    response = client.post(
        "/api/v1/detections/image",
        headers=headers,
        files={"file": ("camera.png", b"test-image", "image/png")},
        data={"confidence_threshold": "0.55", "model_name": "yolov8n"},
    )

    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "completed"
    assert result["total_objects"] > 0
    assert len(result["tracked_objects"]) == result["total_objects"]

    analytics = client.get("/api/v1/analytics/summary", headers=headers)
    assert analytics.status_code == 200
    assert analytics.json()["total_detections"] == 1
