from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=30)
    hashed_password: str
    created_at: datetime = Field(default_factory=utcnow)

    gifs: list["Gif"] = Relationship(back_populates="uploader")
    likes: list["Like"] = Relationship(back_populates="user")


class Gif(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    title: str = Field(max_length=120, index=True)
    description: Optional[str] = Field(default=None, max_length=500)
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    file_path: str
    file_url: str
    view_count: int = Field(default=0)
    like_count: int = Field(default=0)  # denormalized for trending sort
    created_at: datetime = Field(default_factory=utcnow)

    uploader: Optional[User] = Relationship(back_populates="gifs")
    likes: list["Like"] = Relationship(back_populates="gif")


class Like(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    gif_id: int = Field(foreign_key="gif.id", primary_key=True)
    created_at: datetime = Field(default_factory=utcnow)

    user: Optional[User] = Relationship(back_populates="likes")
    gif: Optional[Gif] = Relationship(back_populates="likes")


class Report(SQLModel, table=True):
    """Basic flagging record for the report-GIF feature."""

    id: Optional[int] = Field(default=None, primary_key=True)
    gif_id: int = Field(foreign_key="gif.id", index=True)
    reporter_id: Optional[int] = Field(default=None, foreign_key="user.id")
    reason: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=utcnow)
