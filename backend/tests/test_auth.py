def test_register_login_me(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "full_name": "Test User", "password": "Password123!"},
    )
    assert response.status_code == 201

    login = client.post("/api/v1/auth/login", json={"email": "user@example.com", "password": "Password123!"})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "user@example.com"
