import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app import config
from app.db import get_session
from app.main import app

TINY_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff"
    b"!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config.settings, "upload_dir", str(tmp_path / "uploads"))
    monkeypatch.setattr("app.main.init_db", lambda: None)  # tables already created on test engine
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    def override():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register(client, email="a@x.com", username="alice", password="password123"):
    r = client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert r.status_code == 201, r.text
    return r.json()


def login(client, email="a@x.com", password="password123"):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def upload_gif(client, token, title="funny cat", tags="cat, funny", description="a funny cat"):
    r = client.post(
        "/gifs",
        headers=auth_headers(token),
        files={"file": ("cat.gif", TINY_GIF, "image/gif")},
        data={"title": title, "description": description, "tags": tags},
    )
    assert r.status_code == 201, r.text
    return r.json()
