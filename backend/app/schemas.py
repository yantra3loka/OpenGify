from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- auth ---


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    """No-verification password reset (product decision): knowing the
    account's email is enough to set a new password. Same password
    rules as register."""
    email: EmailStr
    new_password: str = Field(min_length=8)
    confirm_password: str


class UpdateProfileRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
    confirm_password: str


class MessageResponse(BaseModel):
    message: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- public shapes (mirror openapi.yaml) ---


class UploaderPublic(BaseModel):
    username: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    created_at: datetime


class GifPublic(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    tags: list[str] = []
    file_url: str
    view_count: int
    like_count: int
    liked_by_me: bool = False
    uploader: UploaderPublic
    created_at: datetime


class GifPage(BaseModel):
    items: list[GifPublic]
    page: int
    page_size: int
    total: int


class ProfilePublic(BaseModel):
    user: UserPublic
    gifs: GifPage
