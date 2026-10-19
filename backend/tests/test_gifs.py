from .conftest import TINY_GIF, auth_headers, login, register, upload_gif


def setup_user(client):
    register(client)
    return login(client)


def test_upload_and_list(client):
    token = setup_user(client)
    g = upload_gif(client, token)
    assert g["title"] == "funny cat"
    assert set(g["tags"]) == {"cat", "funny"}
    assert g["file_url"].startswith("/uploads/")
    assert g["uploader"]["username"] == "alice"

    page = client.get("/gifs").json()
    assert page["total"] == 1
    assert page["items"][0]["id"] == g["id"]


def test_upload_rejects_non_gif(client):
    token = setup_user(client)
    r = client.post(
        "/gifs",
        headers=auth_headers(token),
        files={"file": ("x.png", b"not-a-gif", "image/png")},
        data={"title": "nope"},
    )
    assert r.status_code == 400


def test_upload_requires_auth(client):
    r = client.post(
        "/gifs",
        files={"file": ("c.gif", TINY_GIF, "image/gif")},
        data={"title": "nope"},
    )
    assert r.status_code == 401


def test_detail_increments_views(client):
    token = setup_user(client)
    g = upload_gif(client, token)
    d1 = client.get(f"/gifs/{g['id']}").json()
    d2 = client.get(f"/gifs/{g['id']}").json()
    assert d2["view_count"] == d1["view_count"] + 1


def test_detail_404(client):
    assert client.get("/gifs/99999").status_code == 404


def test_like_unlike(client):
    token = setup_user(client)
    g = upload_gif(client, token)
    h = auth_headers(token)

    liked = client.post(f"/gifs/{g['id']}/like", headers=h).json()
    assert liked["like_count"] == 1
    assert liked["liked_by_me"] is True

    # idempotent
    liked2 = client.post(f"/gifs/{g['id']}/like", headers=h).json()
    assert liked2["like_count"] == 1

    unliked = client.delete(f"/gifs/{g['id']}/like", headers=h).json()
    assert unliked["like_count"] == 0
    assert unliked["liked_by_me"] is False


def test_search(client):
    token = setup_user(client)
    upload_gif(client, token, title="funny cat", tags="cat", description="a silly cat")
    upload_gif(client, token, title="doggo meme", tags="dog", description="a dog meme")

    res = client.get("/gifs/search", params={"q": "cat"}).json()
    assert res["total"] == 1
    assert res["items"][0]["title"] == "funny cat"

    by_tag = client.get("/gifs/search", params={"q": "meme", "tag": "dog"}).json()
    assert by_tag["total"] == 1


def test_trending_orders_by_likes(client):
    token = setup_user(client)
    g1 = upload_gif(client, token, title="first")
    g2 = upload_gif(client, token, title="second")
    h = auth_headers(token)
    client.post(f"/gifs/{g2['id']}/like", headers=h)

    items = client.get("/gifs/trending").json()["items"]
    assert items[0]["id"] == g2["id"]


def test_report(client):
    token = setup_user(client)
    g = upload_gif(client, token)
    r = client.post(
        f"/gifs/{g['id']}/report",
        headers=auth_headers(token),
        json={"reason": "spam"},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_profile(client):
    token = setup_user(client)
    upload_gif(client, token, title="mine")
    p = client.get("/users/alice").json()
    assert p["user"]["username"] == "alice"
    assert p["gifs"]["total"] == 1

    assert client.get("/users/nobody").status_code == 404
