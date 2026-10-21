from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from ..auth import get_current_user
from ..config import settings
from ..db import get_session, init_db
from ..models import User
from ..schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    Token,
    UserPublic,
)
from ..auth import create_access_token, hash_password, verify_password


def build_auth_router():
    from fastapi import APIRouter

    router = APIRouter(prefix="/auth", tags=["auth"])

    @router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
    def register(body: RegisterRequest, session: Session = Depends(get_session)):
        if session.exec(select(User).where(User.email == body.email)).first():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
        if session.exec(select(User).where(User.username == body.username)).first():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username already taken")
        user = User(email=body.email, username=body.username, hashed_password=hash_password(body.password))
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    @router.post("/login", response_model=Token)
    def login(body: LoginRequest, session: Session = Depends(get_session)):
        user = session.exec(select(User).where(User.email == body.email)).first()
        if user is None or not verify_password(body.password, user.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
        return Token(access_token=create_access_token(user.id))

    @router.post("/forgot-password", response_model=MessageResponse)
    def forgot_password(body: ForgotPasswordRequest, session: Session = Depends(get_session)):
        # No verification step by design: the account email alone is enough.
        if body.new_password != body.confirm_password:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "New password and confirm password do not match",
            )
        user = session.exec(select(User).where(User.email == body.email)).first()
        if user is None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND, "No account found with that email address"
            )
        user.hashed_password = hash_password(body.new_password)
        session.add(user)
        session.commit()
        return MessageResponse(message="Password updated successfully")

    @router.get("/me", response_model=UserPublic)
    def me(user: User = Depends(get_current_user)):
        return user

    return router
