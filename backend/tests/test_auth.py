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
