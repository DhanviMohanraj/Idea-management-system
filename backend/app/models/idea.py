from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="Submitted")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ideas")
    comments = relationship("Comment", back_populates="idea", cascade="all, delete-orphan")
    status_history = relationship(
        "IdeaStatusHistory",
        back_populates="idea",
        cascade="all, delete-orphan",
        order_by="IdeaStatusHistory.changed_at",
    )
