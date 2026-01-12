from pydantic import BaseModel
from datetime import datetime

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
