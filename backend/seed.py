"""OpenGIPHY demo-data seeder.

Seeds directly into the database via SQLModel (no running server needed).
GIF rows are created from the real GIF files bundled in ``seed_assets/``
next to this script: each file is copied into the uploads dir with a uuid
filename, exactly like a user upload.

Demo logins (passwords are demo-only, change in production):
    demo@example.com  / demo1234   (username: demo)
    alice@example.com / alice1234  (username: alice)
    bob@example.com   / bob1234    (username: bob)

Usage:
    python seed.py            # seed everything (idempotent-ish, skips existing)
    python seed.py --dry-run  # copy one sample GIF to /tmp, no DB writes

Reads DATABASE_URL and UPLOAD_DIR from app.config.settings, same as the app.
"""

from __future__ import annotations

import os
import shutil
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_assets")

# ----------------------------------------------------------------------------
# Demo users
# ----------------------------------------------------------------------------
DEMO_USERS = [
    {"email": "demo@example.com", "username": "demo", "password": "demo1234"},
    {"email": "alice@example.com", "username": "alice", "password": "alice1234"},
    {"email": "bob@example.com", "username": "bob", "password": "bob1234"},
]

# ----------------------------------------------------------------------------
# Demo GIFs. Each entry copies seed_assets/<file> into the uploads dir.
# "likes" lists the usernames that get a real Like row, so like_count always
# equals the number of Like rows and /gifs/trending (ordered by like_count
# desc, then newest) returns meaningful results.
# ----------------------------------------------------------------------------
GIF_SPECS = [
    {
        "file": "keyboard-cat.gif",
        "title": "Keyboard Cat",
        "description": "The legendary cat who plays the keyboard like a pro.",
        "tags": ["cat", "music", "funny", "classic"],
        "uploader": "demo",
        "views": 8940,
        "likes": ["demo", "alice", "bob"],
    },
    {
        "file": "slow-clap.gif",
        "title": "Slow Clap",
        "description": "When sarcasm deserves a standing ovation.",
        "tags": ["clap", "sarcasm", "reaction"],
        "uploader": "alice",
        "views": 6210,
        "likes": ["demo", "alice", "bob"],
    },
    {
        "file": "party-cat.gif",
        "title": "Party Cat",
        "description": "This cat parties harder than all of us.",
        "tags": ["cat", "party", "dance"],
        "uploader": "bob",
        "views": 5380,
        "likes": ["demo", "alice"],
    },
    {
        "file": "smug-cat.gif",
        "title": "Smug Cat",
        "description": "That face when you were right all along.",
        "tags": ["cat", "smug", "reaction"],
        "uploader": "demo",
        "views": 4920,
        "likes": ["alice", "bob"],
    },
    {
        "file": "pizza-time.gif",
        "title": "Pizza Time",
        "description": "Hot, cheesy and gone in sixty seconds.",
        "tags": ["pizza", "food", "yummy"],
        "uploader": "alice",
        "views": 7650,
        "likes": ["demo", "alice", "bob"],
    },
    {
        "file": "beat-drop.gif",
        "title": "Beat Drop",
        "description": "Even the Mona Lisa feels the bass drop.",
        "tags": ["music", "dj", "beat"],
        "uploader": "bob",
        "views": 4410,
        "likes": ["demo", "alice"],
    },
    {
        "file": "soccer-goal.gif",
        "title": "Wonder Goal",
        "description": "Giroud finds the top corner. Absolute scenes.",
        "tags": ["football", "goal", "sports"],
        "uploader": "demo",
        "views": 5870,
        "likes": ["alice", "bob"],
    },
    {
        "file": "ocean-wave.gif",
        "title": "Ocean Wave",
        "description": "Endless waves rolling in. Pure calm.",
        "tags": ["ocean", "waves", "nature", "loop"],
        "uploader": "alice",
        "views": 3980,
        "likes": ["demo"],
    },
    {
        "file": "rocket-launch.gif",
        "title": "Rocket Launch",
        "description": "NASA's SLS lifts off. Next stop, the Moon.",
        "tags": ["space", "rocket", "nasa", "launch"],
        "uploader": "bob",
        "views": 6540,
        "likes": ["demo", "alice"],
    },
    {
        "file": "best-friends-puppy.gif",
        "title": "Best Friends",
        "description": "A puppy and his favourite human, inseparable.",
        "tags": ["dog", "puppy", "cute", "friends"],
        "uploader": "demo",
        "views": 7230,
        "likes": ["alice", "bob"],
    },
    {
        "file": "oh-hi.gif",
        "title": "Oh Hi Mark",
        "description": "Oh hi there, didn't see you come in.",
        "tags": ["hello", "greeting", "movie", "funny"],
        "uploader": "alice",
        "views": 3560,
        "likes": ["demo", "bob"],
    },
    {
        "file": "shipped-it.gif",
        "title": "Shipped It",
        "description": "Deploy is green, sprint is done, the boss celebrates.",
        "tags": ["work", "celebration", "win"],
        "uploader": "bob",
        "views": 2890,
        "likes": ["demo", "alice"],
    },
    {
        "file": "you-got-this.gif",
        "title": "You Got This",
        "description": "A little push for the days that feel heavy.",
        "tags": ["motivation", "positive", "believe"],
        "uploader": "demo",
        "views": 3120,
        "likes": ["alice"],
    },
    {
        "file": "happy-dog.gif",
        "title": "Happy Dog",
        "description": "Pure joy on four legs, tail wagging at full speed.",
        "tags": ["dog", "happy", "cute"],
        "uploader": "alice",
        "views": 5480,
        "likes": ["demo", "bob"],
    },
    {
        "file": "facepalm.gif",
        "title": "Facepalm",
        "description": "For the moments words simply cannot fix.",
        "tags": ["facepalm", "reaction", "fail"],
        "uploader": "bob",
        "views": 4760,
        "likes": ["demo", "alice"],
    },
    {
        "file": "mind-blown.gif",
        "title": "Mind Blown",
        "description": "Wait... what just happened?",
        "tags": ["mindblown", "wow", "reaction"],
        "uploader": "demo",
        "views": 4190,
        "likes": ["bob"],
    },
    {
        "file": "laughing-hard.gif",
        "title": "Laughing Hard",
        "description": "The kind of laugh that makes your stomach hurt.",
        "tags": ["laugh", "funny", "lol"],
        "uploader": "alice",
        "views": 3650,
        "likes": ["demo", "bob"],
    },
    {
        "file": "thumbs-up.gif",
        "title": "Thumbs Up",
        "description": "Approved. Great job, keep going.",
        "tags": ["thumbsup", "yes", "goodjob"],
        "uploader": "bob",
        "views": 2340,
        "likes": ["alice"],
    },
    {
        "file": "dance-party.gif",
        "title": "Dance Party",
        "description": "Friday energy, bottled into a loop.",
        "tags": ["dance", "party", "friday"],
        "uploader": "demo",
        "views": 2980,
        "likes": ["alice", "bob"],
    },
    {
        "file": "sleepy-monday.gif",
        "title": "Sleepy Monday",
        "description": "Five more minutes, please. Mondays are hard.",
        "tags": ["sleepy", "monday", "work"],
        "uploader": "alice",
        "views": 1870,
        "likes": ["demo"],
    },
    {
        "file": "coffee-first.gif",
        "title": "Coffee First",
        "description": "Do not talk to me before this cup.",
        "tags": ["coffee", "morning", "fuel"],
        "uploader": "bob",
        "views": 2640,
        "likes": ["demo", "alice"],
    },
    {
        "file": "wow-surprised.gif",
        "title": "Oh Wow",
        "description": "A plot twist nobody saw coming.",
        "tags": ["wow", "surprise", "reaction"],
        "uploader": "demo",
        "views": 3310,
        "likes": ["alice", "bob"],
    },
    {
        "file": "high-five.gif",
        "title": "High Five",
        "description": "Up top, for every small win.",
        "tags": ["highfive", "win", "team"],
        "uploader": "alice",
        "views": 2150,
        "likes": ["demo"],
    },
    {
        "file": "namaste.gif",
        "title": "Namaste",
        "description": "Peace, gratitude and good vibes only.",
        "tags": ["namaste", "peace", "india"],
        "uploader": "bob",
        "views": 1540,
        "likes": [],
    },
    {
        "file": "bollywood-dance.gif",
        "title": "Bollywood Dance",
        "description": "Full filmy energy, dhol beats and big moves.",
        "tags": ["bollywood", "dance", "india", "celebration"],
        "uploader": "demo",
        "views": 2730,
        "likes": ["alice", "bob"],
    },
]


def seed() -> dict:
    """Seed users, GIFs and likes. Imports app modules lazily (dry-run stays light)."""
    from sqlmodel import Session, select

    from app.auth import hash_password
    from app.config import settings
    from app.db import engine, init_db
    from app.models import Gif, Like, User

    init_db()
    os.makedirs(settings.upload_dir, exist_ok=True)

    created_users, skipped_users = 0, 0
    created_gifs, skipped_gifs = 0, 0
    created_likes = 0

    with Session(engine) as session:
        users_by_name: dict[str, User] = {}
        for spec in DEMO_USERS:
            existing = session.exec(
                select(User).where(User.email == spec["email"])
            ).first()
            if existing:
                skipped_users += 1
                users_by_name[spec["username"]] = existing
                continue
            user = User(
                email=spec["email"],
                username=spec["username"],
                hashed_password=hash_password(spec["password"]),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            users_by_name[spec["username"]] = user
            created_users += 1

        for spec in GIF_SPECS:
            existing = session.exec(
                select(Gif).where(Gif.title == spec["title"])
            ).first()
            if existing:
                skipped_gifs += 1
                continue

            asset_path = os.path.join(ASSETS_DIR, spec["file"])
            if not os.path.isfile(asset_path):
                print(f"WARNING: seed asset missing, skipping: {asset_path}")
                skipped_gifs += 1
                continue

            filename = f"{uuid.uuid4().hex}.gif"
            file_path = os.path.join(settings.upload_dir, filename)
            shutil.copyfile(asset_path, file_path)

            gif = Gif(
                user_id=users_by_name[spec["uploader"]].id,
                title=spec["title"],
                description=spec["description"],
                tags=spec["tags"],
                file_path=file_path,
                file_url=f"/uploads/{filename}",
                view_count=spec["views"],
                like_count=len(spec["likes"]),
            )
            session.add(gif)
            session.commit()
            session.refresh(gif)
            created_gifs += 1

            for liker_name in spec["likes"]:
                liker = users_by_name[liker_name]
                if session.get(Like, (liker.id, gif.id)) is None:
                    session.add(Like(user_id=liker.id, gif_id=gif.id))
                    created_likes += 1
            session.commit()

    return {
        "users_created": created_users,
        "users_skipped": skipped_users,
        "gifs_created": created_gifs,
        "gifs_skipped": skipped_gifs,
        "likes_created": created_likes,
    }


def dry_run() -> str:
    """Copy one bundled seed GIF to /tmp without touching the DB."""
    src = os.path.join(ASSETS_DIR, GIF_SPECS[0]["file"])
    path = "/tmp/opengiphy-dryrun.gif"
    shutil.copyfile(src, path)
    size = os.path.getsize(path)
    return f"{path} ({size} bytes)"


if __name__ == "__main__":
    if "--dry-run" in sys.argv:
        print("dry-run GIF:", dry_run())
    else:
        result = seed()
        print("Seed complete:", result)
        print("Demo logins:")
        for u in DEMO_USERS:
            print(f"  {u['email']} / {u['password']}")
