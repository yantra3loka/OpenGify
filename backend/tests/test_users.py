from .conftest import auth_headers, login, register, upload_gif


def setup_two_users(client):
    register(client)  # alice / a@x.com
    alice = login(client)
    register(client, email="b@x.com", username="bob")
    bob = login(client, email="b@x.com")
    return alice, bob


def test_liked_requires_auth(client):
    assert client.get("/users/me/liked").status_code == 401


def test_liked_lists_my_likes_recent_first(client):
    alice, bob = setup_two_users(client)
    g1 = upload_gif(client, bob, title="bob one")
    g2 = upload_gif(client, bob, title="bob two")
    g3 = upload_gif(client, bob, title="bob three")

    ah = auth_headers(alice)
    client.post(f"/gifs/{g1['id']}/like", headers=ah)
    client.post(f"/gifs/{g3['id']}/like", headers=ah)

    page = client.get("/users/me/liked", headers=ah).json()
    assert page["total"] == 2
    # most recently liked first
    assert [i["id"] for i in page["items"]] == [g3["id"], g1["id"]]
    assert all(i["liked_by_me"] is True for i in page["items"])
    assert page["items"][0]["uploader"]["username"] == "bob"

    # pagination params follow the list conventions
    p1 = client.get("/users/me/liked", headers=ah, params={"page": 1, "limit": 1}).json()
    assert p1["total"] == 2
    assert len(p1["items"]) == 1
    assert p1["items"][0]["id"] == g3["id"]


def test_liked_excludes_other_users_likes(client):
    alice, bob = setup_two_users(client)
    g1 = upload_gif(client, alice, title="alice gif")
    g2 = upload_gif(client, alice, title="another gif")

    client.post(f"/gifs/{g1['id']}/like", headers=auth_headers(alice))
    client.post(f"/gifs/{g2['id']}/like", headers=auth_headers(bob))
    client.post(f"/gifs/{g1['id']}/like", headers=auth_headers(bob))

    mine = client.get("/users/me/liked", headers=auth_headers(alice)).json()
    assert mine["total"] == 1
    assert [i["id"] for i in mine["items"]] == [g1["id"]]

    bobs = client.get("/users/me/liked", headers=auth_headers(bob)).json()
    assert bobs["total"] == 2
    assert {i["id"] for i in bobs["items"]} == {g1["id"], g2["id"]}


def test_update_my_username(client):
    alice, _bob = setup_two_users(client)
    r = client.patch(
        "/users/me", json={"username": "alice2"}, headers=auth_headers(alice)
    )
    assert r.status_code == 200, r.text
    assert r.json()["username"] == "alice2"
    assert r.json()["email"] == "a@x.com"

    # reachable under the new name, gone under the old one
    assert client.get("/users/alice2").status_code == 200
    assert client.get("/users/alice").status_code == 404
    me = client.get("/auth/me", headers=auth_headers(alice))
    assert me.json()["username"] == "alice2"


def test_update_my_username_taken(client):
    alice, _bob = setup_two_users(client)
    r = client.patch("/users/me", json={"username": "bob"}, headers=auth_headers(alice))
    assert r.status_code == 409


def test_update_my_username_same_name_is_noop(client):
    alice, _bob = setup_two_users(client)
    r = client.patch(
        "/users/me", json={"username": "alice"}, headers=auth_headers(alice)
    )
    assert r.status_code == 200
    assert r.json()["username"] == "alice"


def test_update_my_username_anonymous(client):
    assert client.patch("/users/me", json={"username": "alice2"}).status_code == 401


def test_update_my_username_too_short(client):
    alice, _bob = setup_two_users(client)
    r = client.patch("/users/me", json={"username": "ab"}, headers=auth_headers(alice))
    assert r.status_code == 422


def test_change_password_success(client):
    alice, _bob = setup_two_users(client)
    r = client.post(
        "/users/me/change-password",
        json={
            "current_password": "password123",
            "new_password": "brand-new-pass",
            "confirm_password": "brand-new-pass",
        },
        headers=auth_headers(alice),
    )
    assert r.status_code == 200, r.text
    assert r.json()["message"] == "Password updated successfully"

    assert login(client, password="brand-new-pass")
    old = client.post("/auth/login", json={"email": "a@x.com", "password": "password123"})
    assert old.status_code == 401


def test_change_password_wrong_current(client):
    alice, _bob = setup_two_users(client)
    r = client.post(
        "/users/me/change-password",
        json={
            "current_password": "not-my-password",
            "new_password": "brand-new-pass",
            "confirm_password": "brand-new-pass",
        },
        headers=auth_headers(alice),
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Current password is incorrect"
    assert login(client)  # unchanged


def test_change_password_confirm_mismatch(client):
    alice, _bob = setup_two_users(client)
    r = client.post(
        "/users/me/change-password",
        json={
            "current_password": "password123",
            "new_password": "brand-new-pass",
            "confirm_password": "different-pass",
        },
        headers=auth_headers(alice),
    )
    assert r.status_code == 422
    assert login(client)  # unchanged


def test_change_password_anonymous(client):
    r = client.post(
        "/users/me/change-password",
        json={
            "current_password": "password123",
            "new_password": "brand-new-pass",
            "confirm_password": "brand-new-pass",
        },
    )
    assert r.status_code == 401
