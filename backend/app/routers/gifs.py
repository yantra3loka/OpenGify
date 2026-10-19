import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import String, func
from sqlmodel import Session, col, select

from ..auth import get_current_user, get_optional_user
from ..config import settings
from ..db import get_session
from ..models import Gif, Like, Report, User
from ..schemas import GifPage, GifPublic, UploaderPublic

router = APIRouter(prefix="/gifs", tags=["gifs"])

GIF_MAGIC = (b"GIF87a", b"GIF89a")


def _ensure_upload_dir() -> str:
    d = settings.upload_dir
    os.makedirs(d, exist_ok=True)
    return d


def to_public(gif: Gif, liked_by_me: bool = False) -> GifPublic:
    return GifPublic(
        id=gif.id,
        title=gif.title,
        description=gif.description,
        tags=gif.tags or [],
        file_url=gif.file_url,
        view_count=gif.view_count,
        like_count=gif.like_count,
        liked_by_me=liked_by_me,
        uploader=UploaderPublic(username=gif.uploader.username if gif.uploader else "unknown"),
        created_at=gif.created_at,
    )


def paginate(query, page: int, page_size: int, session: Session, me: Optional[User]):
    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    rows = session.exec(query.offset((page - 1) * page_size).limit(page_size)).all()
    liked_ids: set[int] = set()
    if me is not None and rows:
        liked_ids = set(
            session.exec(
                select(Like.gif_id).where(
                    Like.user_id == me.id, col(Like.gif_id).in_([g.id for g in rows])
                )
            ).all()
        )
    return GifPage(
        items=[to_public(g, g.id in liked_ids) for g in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("", response_model=GifPage)
def list_gifs(
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session),
    me: Optional[User] = Depends(get_optional_user),
):
    page, page_size = max(1, page), min(50, max(1, page_size))
    q = select(Gif).order_by(col(Gif.created_at).desc())
    return paginate(q, page, page_size, session, me)


@router.post("", response_model=GifPublic, status_code=status.HTTP_201_CREATED)
async def upload_gif(
    file: UploadFile = File(...),
    title: str = Form(..., max_length=120),
    description: Optional[str] = Form(default=None, max_length=500),
    tags: Optional[str] = Form(default=None),
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    contents = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"File too large (max {settings.max_upload_mb} MB)")
    if not contents.startswith(GIF_MAGIC):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only GIF files are accepted")

    tag_list = [t.strip() for t in (tags or "").replace(",", " ").split() if t.strip()][:10]

    filename = f"{uuid.uuid4().hex}.gif"
    upload_dir = _ensure_upload_dir()
    path = os.path.join(upload_dir, filename)
    with open(path, "wb") as f:
        f.write(contents)

    gif = Gif(
        user_id=me.id,
        title=title,
        description=description,
        tags=tag_list,
        file_path=path,
        file_url=f"/uploads/{filename}",
    )
    session.add(gif)
    session.commit()
    session.refresh(gif)
    gif.uploader = me
    return to_public(gif)


@router.get("/search", response_model=GifPage)
def search_gifs(
    q: str,
    tag: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session),
    me: Optional[User] = Depends(get_optional_user),
):
    page, page_size = max(1, page), min(50, max(1, page_size))
    like = f"%{q}%"
    stmt = select(Gif).where(
        col(Gif.title).ilike(like)
        | col(Gif.description).ilike(like)
        | func.cast(col(Gif.tags), String).ilike(like)
    )
    if tag:
        # tags stored as JSON array '["a","b"]' — match the quoted token (PG + SQLite)
        stmt = stmt.where(func.cast(col(Gif.tags), String).like(f'%"{tag}"%'))
    stmt = stmt.order_by(col(Gif.created_at).desc())
    return paginate(stmt, page, page_size, session, me)


@router.get("/trending", response_model=GifPage)
def trending_gifs(
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session),
    me: Optional[User] = Depends(get_optional_user),
):
    page, page_size = max(1, page), min(50, max(1, page_size))
    stmt = select(Gif).order_by(col(Gif.like_count).desc(), col(Gif.created_at).desc())
    return paginate(stmt, page, page_size, session, me)


@router.get("/{gif_id}", response_model=GifPublic)
def gif_detail(
    gif_id: int,
    session: Session = Depends(get_session),
    me: Optional[User] = Depends(get_optional_user),
):
    gif = session.get(Gif, gif_id)
    if gif is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "GIF not found")
    gif.view_count += 1
    session.add(gif)
    session.commit()
    session.refresh(gif)
    liked = False
    if me is not None:
        liked = session.get(Like, (me.id, gif.id)) is not None
    return to_public(gif, liked)


@router.post("/{gif_id}/like", response_model=GifPublic)
def like_gif(
    gif_id: int,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    gif = session.get(Gif, gif_id)
    if gif is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "GIF not found")
    if session.get(Like, (me.id, gif.id)) is None:
        session.add(Like(user_id=me.id, gif_id=gif.id))
        gif.like_count += 1
        session.add(gif)
        session.commit()
        session.refresh(gif)
    return to_public(gif, True)


@router.delete("/{gif_id}/like", response_model=GifPublic)
def unlike_gif(
    gif_id: int,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    gif = session.get(Gif, gif_id)
    if gif is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "GIF not found")
    like = session.get(Like, (me.id, gif.id))
    if like is not None:
        session.delete(like)
        gif.like_count = max(0, gif.like_count - 1)
        session.add(gif)
        session.commit()
        session.refresh(gif)
    return to_public(gif, False)


@router.post("/{gif_id}/report")
def report_gif(
    gif_id: int,
    body: Optional[dict] = None,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    gif = session.get(Gif, gif_id)
    if gif is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "GIF not found")
    reason = (body or {}).get("reason")
    session.add(Report(gif_id=gif.id, reporter_id=me.id, reason=reason))
    session.commit()
    return {"ok": True}
