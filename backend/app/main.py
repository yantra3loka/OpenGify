from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import os

from .config import settings
from .db import init_db
from .routers.auth import build_auth_router
from .routers.gifs import router as gifs_router
from .routers.users import router as users_router


def create_app() -> FastAPI:
    app = FastAPI(title="OpenGIPHY API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    os.makedirs(settings.upload_dir, exist_ok=True)

    @app.on_event("startup")
    def _startup():
        init_db()

    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(build_auth_router())
    app.include_router(gifs_router)
    app.include_router(users_router)
    return app


app = create_app()
