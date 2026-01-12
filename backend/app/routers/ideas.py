from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.comment import Comment
from app.models.idea import Idea
from app.models.idea_status_history import IdeaStatusHistory
from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaUpdate
from app.schemas.comment import CommentCreate
from app.core.deps import get_current_user
from app.core.deps import require_team_lead, require_team_member

router = APIRouter(prefix="/ideas", tags=["Ideas"])


ALLOWED_STATUSES = {"Submitted", "In Review", "Approved", "Rejected"}


def _build_comment_map(db: Session, idea_ids: list[int]) -> dict[int, list[Comment]]:
    comment_map: dict[int, list[Comment]] = {}
    if not idea_ids:
        return comment_map
    for c in (
        db.query(Comment)
        .filter(Comment.idea_id.in_(idea_ids))
        .order_by(Comment.created_at.asc())
        .all()
    ):
        comment_map.setdefault(c.idea_id, []).append(c)
    return comment_map


def _serialize_idea(idea: Idea, owner: User | None, comments: list[Comment]):
    return {
        "id": idea.id,
        "title": idea.title,
        "description": idea.description,
        "status": idea.status,
        "user_id": idea.user_id,
        "created_at": idea.created_at,
        "owner": {
            "id": owner.id if owner else idea.user_id,
            "name": owner.name if owner else "",
            "email": owner.email if owner else "",
        },
        "comments": [
            {
                "id": c.id,
                "comment_text": c.comment_text,
                "idea_id": c.idea_id,
                "commented_by": c.commented_by,
                "created_at": c.created_at,
            }
            for c in comments
        ],
    }


# Create idea (Team Member)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_idea(
    data: IdeaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_team_member),
):
    idea = Idea(
        title=data.title,
        description=data.description,
        user_id=current_user.id,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    owner = db.query(User).filter(User.id == idea.user_id).first()
    comments = db.query(Comment).filter(Comment.idea_id == idea.id).all()
    return _serialize_idea(idea, owner, comments)


# Get own ideas
@router.get("/my")
def get_my_ideas(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ideas = (
        db.query(Idea)
        .filter(Idea.user_id == current_user.id)
        .order_by(Idea.created_at.desc())
        .all()
    )
    idea_ids = [i.id for i in ideas]
    comment_map = _build_comment_map(db, idea_ids)
    owner = db.query(User).filter(User.id == current_user.id).first()
    return [_serialize_idea(i, owner, comment_map.get(i.id, [])) for i in ideas]


@router.get("/all")
def get_all_ideas(
    db: Session = Depends(get_db),
    current_user=Depends(require_team_lead),
):
    # Return enriched shape used by frontend (owner + comments)
    ideas = db.query(Idea).order_by(Idea.created_at.desc()).all()
    user_map = {u.id: u for u in db.query(User).all()}
    comment_map = _build_comment_map(db, [i.id for i in ideas])

    result = []
    for idea in ideas:
        owner = user_map.get(idea.user_id)
        result.append(_serialize_idea(idea, owner, comment_map.get(idea.id, [])))
    return result

# Get idea by ID
@router.get("/{idea_id}")
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea

# Update idea
@router.put("/{idea_id}")
def update_idea(
    idea_id: int,
    data: IdeaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    if idea.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if idea.status in {"Approved", "Rejected"}:
        raise HTTPException(status_code=400, detail="Cannot edit after final decision")

    idea.title = data.title
    idea.description = data.description
    db.commit()
    db.refresh(idea)
    owner = db.query(User).filter(User.id == idea.user_id).first()
    comments = db.query(Comment).filter(Comment.idea_id == idea.id).order_by(Comment.created_at.asc()).all()
    return _serialize_idea(idea, owner, comments)

# Delete idea
@router.delete("/{idea_id}")
def delete_idea(
    idea_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    if idea.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if idea.status in {"Approved", "Rejected"}:
        raise HTTPException(status_code=400, detail="Cannot delete after final decision")

    db.delete(idea)
    db.commit()
    return {"message": "Idea deleted successfully"}


@router.patch("/{idea_id}/status")
def set_status(
    idea_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_team_lead),
):
    status_value = (payload.get("status") or "").strip()
    if status_value not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    old = idea.status
    idea.status = status_value
    db.add(
        IdeaStatusHistory(
            idea_id=idea.id,
            old_status=old,
            new_status=status_value,
            changed_by=current_user.id,
        )
    )
    db.commit()
    db.refresh(idea)
    return {"ok": True}


@router.post("/{idea_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    idea_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_team_lead),
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    comment = Comment(
        idea_id=idea_id,
        comment_text=payload.comment_text,
        commented_by=current_user.id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"ok": True}


def _format_day_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def _week_start(dt: datetime) -> datetime:
    # Monday-based week start
    d = datetime(dt.year, dt.month, dt.day)
    day = (d.weekday() + 0)  # Monday=0 already
    return d - timedelta(days=day)


@router.get("/metrics/summary")
def metrics_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_team_lead),
):
    ideas = db.query(Idea).all()

    total = len(ideas)
    open_count = sum(1 for i in ideas if i.status == "Submitted")
    in_progress = sum(1 for i in ideas if i.status == "In Review")
    approved = sum(1 for i in ideas if i.status == "Approved")
    rejected = sum(1 for i in ideas if i.status == "Rejected")
    completed = approved + rejected

    now = datetime.now()
    day_buckets: dict[str, int] = {}
    week_buckets: dict[str, int] = {}

    for idea in ideas:
        created = idea.created_at or now
        day_key = _format_day_key(created)
        day_buckets[day_key] = day_buckets.get(day_key, 0) + 1
        wk = _week_start(created)
        wk_key = _format_day_key(wk)
        week_buckets[wk_key] = week_buckets.get(wk_key, 0) + 1

    last7_days = []
    for idx in range(7):
        d = now - timedelta(days=(6 - idx))
        key = _format_day_key(d)
        last7_days.append({"key": key, "count": day_buckets.get(key, 0)})

    last4_weeks = []
    for idx in range(4):
        d = now - timedelta(days=idx * 7)
        wk_key = _format_day_key(_week_start(d))
        last4_weeks.append({"key": wk_key, "count": week_buckets.get(wk_key, 0)})
    last4_weeks = list(reversed(last4_weeks))

    from app.models.user import User

    users = {u.id: u for u in db.query(User).all()}
    by_whom: dict[str, dict] = {}
    for idea in ideas:
        owner = users.get(idea.user_id)
        email = (owner.email if owner else "unknown").lower()
        entry = by_whom.get(email) or {
            "ownerEmail": owner.email if owner else "Unknown",
            "ownerName": owner.name if owner else "",
            "total": 0,
            "open": 0,
            "inProgress": 0,
            "completed": 0,
        }
        entry["total"] += 1
        if idea.status == "Submitted":
            entry["open"] += 1
        if idea.status == "In Review":
            entry["inProgress"] += 1
        if idea.status in {"Approved", "Rejected"}:
            entry["completed"] += 1
        by_whom[email] = entry

    by_whom_list = sorted(by_whom.values(), key=lambda x: x["total"], reverse=True)

    return {
        "total": total,
        "open": open_count,
        "inProgress": in_progress,
        "approved": approved,
        "rejected": rejected,
        "completed": completed,
        "last7Days": last7_days,
        "last4Weeks": last4_weeks,
        "byWhom": by_whom_list,
    }
