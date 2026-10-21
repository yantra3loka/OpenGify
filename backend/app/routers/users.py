from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, col, select

from ..auth import get_current_user, get_optional_user, hash_password, verify_password
from ..db import get_session
from ..models import Gif, Like, User
from ..routers.gifs import paginate
from ..schemas import (
    ChangePasswordRequest,
    GifPage,
    MessageResponse,
    ProfilePublic,
    UpdateProfileRequest,
    UserPublic,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/liked", response_model=GifPage)
def my_liked_gifs(
    page: int = 1,
    limit: int = 12,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    page, limit = max(1, page), min(50, max(1, limit))
    q = (
        select(Gif)
        .join(Like, col(Like.gif_id) == Gif.id)
        .where(Like.user_id == me.id)
        .order_by(col(Like.created_at).desc())
    )
    return paginate(q, page, limit, session, me)


@router.patch("/me", response_model=UserPublic)
def update_my_profile(
    body: UpdateProfileRequest,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    if body.username != me.username:
        taken = session.exec(select(User).where(User.username == body.username)).first()
        if taken is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
        me.username = body.username
        session.add(me)
        session.commit()
        session.refresh(me)
    return me


@router.post("/me/change-password", response_model=MessageResponse)
def change_my_password(
    body: ChangePasswordRequest,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, me.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "New password and confirm password do not match",
        )
    me.hashed_password = hash_password(body.new_password)
    session.add(me)
    session.commit()
    return MessageResponse(message="Password updated successfully")


@router.get("/{username}", response_model=ProfilePublic)
def user_profile(
    username: str,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session),
    me: Optional[User] = Depends(get_optional_user),
):
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    page, page_size = max(1, page), min(50, max(1, page_size))
    q = select(Gif).where(Gif.user_id == user.id).order_by(col(Gif.created_at).desc())
    return ProfilePublic(user=user, gifs=paginate(q, page, page_size, session, me))
