from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.idea import Idea
from app.schemas.idea import IdeaCreate, IdeaUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/ideas", tags=["Ideas"])


# Create idea (Team Member)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_idea(
    data: IdeaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    idea = Idea(
        title=data.title,
        description=data.description,
        user_id=current_user.id,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea


# Get own ideas
@router.get("/my")
def get_my_ideas(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Idea).filter(Idea.user_id == current_user.id).all()

# Get idea by ID
@router.get("/{idea_id}")
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea

# Update idea
@router.put("/{idea_id}")
def update_idea(idea_id: int, data: IdeaUpdate, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    idea.title = data.title
    idea.description = data.description
    db.commit()
    db.refresh(idea)
    return idea

# Delete idea
@router.delete("/{idea_id}")
def delete_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    db.delete(idea)
    db.commit()
    return {"message": "Idea deleted successfully"}
