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
