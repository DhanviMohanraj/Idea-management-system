from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
	comment_text: str


class CommentResponse(BaseModel):
	id: int
	comment_text: str
	idea_id: int
	commented_by: int
	created_at: datetime

	class Config:
		from_attributes = True
