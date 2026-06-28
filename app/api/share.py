import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import Dashboard
from app.models.share import Share
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/shares", tags=["shares"])


class ShareCreate(BaseModel):
    dashboard_id: str
    access_level: str = "view"
    password: str | None = None
    expires_in_hours: int = 0
    max_views: int = 0
    allow_download: bool = False
    watermark: bool = True


@router.post("/")
def create_share(
    req: ShareCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    dashboard = db.query(Dashboard).filter(
        Dashboard.id == req.dashboard_id,
        Dashboard.user_id == user.id,
    ).first()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    share = Share(
        dashboard_id=req.dashboard_id,
        created_by=user.id,
        access_level=req.access_level,
        expires_at=(
            datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            + __import__("datetime").timedelta(hours=req.expires_in_hours)
            if req.expires_in_hours > 0
            else None
        ),
        max_views=req.max_views,
        allow_download=req.allow_download,
        watermark=req.watermark,
    )

    if req.password:
        from passlib.context import CryptContext
        pwd = CryptContext(schemes=["bcrypt"])
        share.password_hash = pwd.hash(req.password)

    db.add(share)
    db.commit()
    db.refresh(share)

    # Mark dashboard as shared
    dashboard.is_shared = True
    dashboard.share_id = share.id
    db.commit()

    return {
        "share_id": share.id,
        "url": f"/shared/{share.id}",
        "access_level": share.access_level,
        "expires_at": share.expires_at.isoformat() if share.expires_at else None,
        "max_views": share.max_views,
        "has_password": bool(share.password_hash),
    }


@router.get("/")
def list_shares(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    shares = db.query(Share).join(Dashboard).filter(
        Dashboard.user_id == user.id
    ).order_by(Share.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "dashboard_id": s.dashboard_id,
            "access_level": s.access_level,
            "is_active": s.is_active,
            "current_views": s.current_views,
            "max_views": s.max_views,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in shares
    ]


@router.delete("/{share_id}")
def delete_share(
    share_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    share = db.query(Share).filter(Share.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    dashboard = db.query(Dashboard).filter(Dashboard.id == share.dashboard_id).first()
    if dashboard and dashboard.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(share)
    if dashboard:
        dashboard.is_shared = False
        dashboard.share_id = None
    db.commit()

    return {"status": "deleted"}


@router.get("/public/{share_id}")
def get_shared_dashboard(
    share_id: str,
    db: Session = Depends(get_db),
):
    share = db.query(Share).filter(
        Share.id == share_id,
        Share.is_active == True,
    ).first()

    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link expired")

    if share.max_views > 0 and share.current_views >= share.max_views:
        raise HTTPException(status_code=410, detail="Share link max views reached")

    dashboard = db.query(Dashboard).filter(
        Dashboard.id == share.dashboard_id
    ).first()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    # Increment view count
    share.current_views += 1
    db.commit()

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "source_type": dashboard.source_type,
        "columns": dashboard.columns_meta,
        "data": dashboard.raw_data[:50],
        "total_rows": dashboard.row_count,
        "kpis": dashboard.kpi_mappings,
        "insights": dashboard.insights,
        "access_level": share.access_level,
        "allow_download": share.allow_download,
        "watermark": share.watermark,
    }
