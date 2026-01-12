from pydantic import BaseModel
from datetime import datetime

from app.schemas.comment import CommentResponse

class IdeaCreate(BaseModel):
    title: str
    description: str

class IdeaUpdate(BaseModel):
    title: str
    description: str

class IdeaResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IdeaOwner(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class IdeaWithOwner(BaseModel):
    id: int
    title: str
    description: str
    status: str
    created_at: datetime
    user_id: int
    owner: IdeaOwner
    comments: list[CommentResponse] = []

    class Config:
        from_attributes = True
