from fastapi import FastAPI
from app.routers import auth
from app.routers import ideas
from app.database import Base
from app.database import engine, Base
from app import models
# Import ALL models so SQLAlchemy knows them
from app.models.role import Role
from app.models.user import User
from app.models.idea import Idea
from app.models.comment import Comment
from app.models.attachment import Attachment
from app.models.idea_status_history import IdeaStatusHistory


app = FastAPI()

# Create all tables
Base.metadata.create_all(bind=engine)
app.include_router(auth.router)
app.include_router(ideas.router)

