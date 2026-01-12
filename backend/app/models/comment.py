from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    comment_text = Column(Text, nullable=False)
    idea_id = Column(Integer, ForeignKey("ideas.id"), nullable=False)
    commented_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
