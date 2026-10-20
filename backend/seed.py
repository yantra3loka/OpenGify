"""OpenGIPHY demo-data seeder.

Seeds directly into the database via SQLModel (no running server needed)
and writes real animated GIF files into the uploads dir.

Demo logins (passwords are demo-only, change in production):
    demo@example.com  / demo1234   (username: demo)
    alice@example.com / alice1234  (username: alice)
    bob@example.com   / bob1234    (username: bob)

Usage:
    python seed.py            # seed everything (idempotent-ish, skips existing)
    python seed.py --dry-run  # generate one sample GIF to /tmp, no DB writes

Reads DATABASE_URL and UPLOAD_DIR from app.config.settings, same as the app.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ----------------------------------------------------------------------------
# Demo users
# ----------------------------------------------------------------------------
DEMO_USERS = [
    {"email": "demo@example.com", "username": "demo", "password": "demo1234"},
    {"email": "alice@example.com", "username": "alice", "password": "alice1234"},
    {"email": "bob@example.com", "username": "bob", "password": "bob1234"},
]

# ----------------------------------------------------------------------------
# Demo GIFs: (title, description, tags, bg color, accent color, views, likes)
# likes = number of Like rows to create (spread 0-3 across 3 demo users),
# so /gifs/trending (ordered by like_count desc) returns meaningful results.
# ----------------------------------------------------------------------------
GIF_SPECS = [
    (
        "Dancing Cat",
        "A groovy cat that just can't stop moving.",
        ["cat", "dance", "funny"],
        (45, 45, 60), (255, 194, 14),
        1520, 3,
    ),
    (
        "Rocket Launch",
        "3... 2... 1... liftoff!",
        ["space", "rocket"],
        (20, 20, 40), (255, 90, 90),
        1180, 3,
    ),
    (
        "Coffee Loop",
        "Endless coffee for endless code.",
        ["coffee", "loop", "morning"],
        (60, 40, 25), (200, 150, 90),
        940, 2,
    ),
    (
        "Neon Wave",
        "Synthwave vibes in a loop.",
        ["neon", "wave", "aesthetic", "loop"],
        (25, 10, 45), (0, 255, 200),
        810, 2,
    ),
    (
        "Happy Doggo",
        "Pure joy, wagging forever.",
        ["dog", "happy", "cute"],
        (40, 60, 35), (255, 220, 100),
        660, 2,
    ),
    (
        "Pixel Sunset",
        "An 8-bit sun dips below the horizon.",
        ["pixel", "sunset", "art"],
        (70, 25, 50), (255, 140, 60),
        520, 1,
    ),
    (
        "Bouncing Ball",
        "It bounces. That's the whole GIF. You're welcome.",
        ["ball", "bounce", "funny"],
        (30, 50, 70), (120, 220, 255),
        430, 1,
    ),
    (
        "Disco Party",
        "Saturday night, compressed to 1 second.",
        ["disco", "party", "music"],
        (50, 20, 60), (255, 80, 200),
        310, 1,
    ),
    (
        "Floating Astronaut",
        "Drifting through the void, peacefully.",
        ["space", "astronaut", "chill"],
        (10, 15, 30), (180, 200, 255),
        220, 0,
    ),
    (
        "Rainy Day",
        "Cozy rain loop for focus time.",
        ["rain", "cozy", "lofi"],
        (35, 45, 55), (140, 180, 220),
        140, 0,
    ),
]

GIF_W, GIF_H, FRAMES = 320, 240, 8


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def make_animated_gif(path: str, title: str, bg: tuple, accent: tuple) -> None:
    """Generate a small real animated GIF: moving dot + title text."""
    from PIL import Image, ImageDraw, ImageFont

    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
        small = ImageFont.truetype("DejaVuSans.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
        small = ImageFont.load_default()

    frames = []
    for i in range(FRAMES):
        img = Image.new("RGB", (GIF_W, GIF_H), bg)
        d = ImageDraw.Draw(img)

        # moving accent dot (the "animation")
        x = 24 + int(i * (GIF_W - 48) / (FRAMES - 1))
        y = 60 + int(18 * (1 if i % 2 == 0 else -1) * (i % 3) / 2)
        d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=accent)

        # title text, centered
        tb = d.textbbox((0, 0), title, font=font)
        d.text(((GIF_W - (tb[2] - tb[0])) / 2, 110), title, font=font, fill=(255, 255, 255))

        # frame progress dots
        for j in range(FRAMES):
            cx = GIF_W // 2 - (FRAMES * 14) // 2 + j * 14 + 7
            r = 5 if j == i else 3
            d.ellipse([cx - r, 205 - r, cx + r, 205 + r],
                      fill=accent if j == i else (120, 120, 140))

        d.text((10, GIF_H - 22), "OpenGIPHY demo", font=small, fill=(160, 160, 170))
        frames.append(img)

    frames[0].save(
        path, save_all=True, append_images=frames[1:],
        duration=140, loop=0, optimize=False,
    )


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
        users: list[User] = []
        for spec in DEMO_USERS:
            existing = session.exec(
                select(User).where(User.email == spec["email"])
            ).first()
            if existing:
                skipped_users += 1
                users.append(existing)
                continue
            user = User(
                email=spec["email"],
                username=spec["username"],
                hashed_password=hash_password(spec["password"]),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            users.append(user)
            created_users += 1

        for idx, (title, desc, tags, bg, accent, views, n_likes) in enumerate(GIF_SPECS):
            existing = session.exec(
                select(Gif).where(Gif.title == title)
            ).first()
            if existing:
                skipped_gifs += 1
                continue

            uploader = users[idx % len(users)]
            filename = f"seed-{slugify(title)}.gif"
            file_path = os.path.join(settings.upload_dir, filename)
            make_animated_gif(file_path, title, bg, accent)

            gif = Gif(
                user_id=uploader.id,
                title=title,
                description=desc,
                tags=tags,
                file_path=file_path,
                file_url=f"/uploads/{filename}",
                view_count=views,
                like_count=0,
            )
            session.add(gif)
            session.commit()
            session.refresh(gif)
            created_gifs += 1

            for liker in users[:n_likes]:
                if session.get(Like, (liker.id, gif.id)) is None:
                    session.add(Like(user_id=liker.id, gif_id=gif.id))
                    created_likes += 1
            gif.like_count = n_likes
            session.add(gif)
            session.commit()

    return {
        "users_created": created_users,
        "users_skipped": skipped_users,
        "gifs_created": created_gifs,
        "gifs_skipped": skipped_gifs,
        "likes_created": created_likes,
    }


def dry_run() -> str:
    """Generate one sample GIF to /tmp without touching the DB."""
    os.makedirs("/tmp", exist_ok=True)
    path = "/tmp/opengiphy-dryrun.gif"
    title, _, _, bg, accent, _, _ = GIF_SPECS[0]
    make_animated_gif(path, title, bg, accent)
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
