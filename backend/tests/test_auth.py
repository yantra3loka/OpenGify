from .conftest import login, register


def test_register_and_login(client):
    u = register(client)
    assert u["username"] == "alice"
    token = login(client)
    assert token

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "a@x.com"


def test_register_duplicate_email(client):
    register(client)
    r = client.post(
        "/auth/register",
        json={"email": "a@x.com", "username": "bob", "password": "password123"},
    )
    assert r.status_code == 400


def test_register_duplicate_username(client):
    register(client)
    r = client.post(
        "/auth/register",
        json={"email": "b@x.com", "username": "alice", "password": "password123"},
    )
    assert r.status_code == 400


def test_login_wrong_password(client):
    register(client)
    r = client.post("/auth/login", json={"email": "a@x.com", "password": "nope-nope-nope"})
    assert r.status_code == 401


def test_me_unauthorized(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_forgot_password_success_new_password_logs_in(client):
    register(client)
    r = client.post(
        "/auth/forgot-password",
        json={
            "email": "a@x.com",
            "new_password": "brand-new-pass",
            "confirm_password": "brand-new-pass",
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["message"] == "Password updated successfully"

    token = login(client, password="brand-new-pass")
    assert token
    old = client.post("/auth/login", json={"email": "a@x.com", "password": "password123"})
    assert old.status_code == 401


def test_forgot_password_unknown_email(client):
    r = client.post(
        "/auth/forgot-password",
        json={
            "email": "ghost@x.com",
            "new_password": "brand-new-pass",
            "confirm_password": "brand-new-pass",
        },
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "No account found with that email address"


def test_forgot_password_confirm_mismatch(client):
    register(client)
    r = client.post(
        "/auth/forgot-password",
        json={
            "email": "a@x.com",
            "new_password": "brand-new-pass",
            "confirm_password": "different-pass",
        },
    )
    assert r.status_code == 422
    # password unchanged
    assert login(client)


def test_forgot_password_short_password_rejected(client):
    register(client)
    r = client.post(
        "/auth/forgot-password",
        json={"email": "a@x.com", "new_password": "short", "confirm_password": "short"},
    )
    assert r.status_code == 422
