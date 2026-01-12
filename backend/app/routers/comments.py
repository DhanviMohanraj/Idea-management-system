from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.comment import Comment
from app.models.idea import Idea
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.get("/idea/{idea_id}", response_model=list[CommentResponse])
def list_comments_for_idea(
	idea_id: int,
	db: Session = Depends(get_db),
	current_user=Depends(get_current_user),
):
	idea = db.query(Idea).filter(Idea.id == idea_id).first()
	if not idea:
		raise HTTPException(status_code=404, detail="Idea not found")

	# Allow only owner or team lead to view comments
	if idea.user_id != current_user.id:
		from app.models.role import Role

		role = db.query(Role).filter(Role.id == current_user.role_id).first()
		if not role or role.role_name != "team_lead":
			raise HTTPException(status_code=403, detail="Not allowed")

	return db.query(Comment).filter(Comment.idea_id == idea_id).order_by(Comment.created_at.asc()).all()

@router.post("/idea/{idea_id}", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment_to_idea(
	idea_id: int,
	payload: CommentCreate,
	db: Session = Depends(get_db),
	current_user=Depends(get_current_user),
):
	idea = db.query(Idea).filter(Idea.id == idea_id).first()
	if not idea:
		raise HTTPException(status_code=404, detail="Idea not found")

	# Allow owner or team lead to comment
	if idea.user_id != current_user.id:
		from app.models.role import Role

		role = db.query(Role).filter(Role.id == current_user.role_id).first()
		if not role or role.role_name != "team_lead":
			raise HTTPException(status_code=403, detail="Not allowed")

	comment = Comment(
		idea_id=idea_id,
		comment_text=payload.comment_text,
		commented_by=current_user.id,
	)
	db.add(comment)
	db.commit()
	db.refresh(comment)
	return comment
