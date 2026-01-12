from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.routers import auth
from app.routers import ideas
from app.database import engine, Base

# Import ALL models so SQLAlchemy knows them
from app.models.role import Role
from app.models.user import User
from app.models.idea import Idea
from app.models.comment import Comment
from app.models.attachment import Attachment
from app.models.idea_status_history import IdeaStatusHistory


def seed_roles() -> None:
	"""Ensure default roles exist so registration with role_id 1/2 works.

	id=1 → team_member
	id=2 → team_lead
	"""
	with Session(engine) as session:
		if not session.query(Role).filter(Role.id == 1).first():
			session.add(Role(id=1, role_name="team_member", description="Regular team member"))

		if not session.query(Role).filter(Role.id == 2).first():
			session.add(Role(id=2, role_name="team_lead", description="Team lead with approval rights"))

		session.commit()


app = FastAPI()

# Allow frontend running on localhost to call this API
app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:5175",
		"http://localhost:5176",
		"http://localhost:5177",
		"http://localhost:5178",  # current Vite dev server port
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Create all tables and seed base data
Base.metadata.create_all(bind=engine)
seed_roles()

app.include_router(auth.router)
app.include_router(ideas.router)

