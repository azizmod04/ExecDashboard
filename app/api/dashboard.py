from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import Dashboard, KpiDefinition
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])


@router.get("/")
def list_dashboards(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    dashboards = db.query(Dashboard).filter(
        Dashboard.user_id == user.id
    ).order_by(Dashboard.created_at.desc()).all()

    return [
        {
            "id": d.id,
            "name": d.name,
            "source_type": d.source_type,
            "status": d.status,
            "row_count": d.row_count,
            "col_count": d.col_count,
            "is_shared": d.is_shared,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in dashboards
    ]


@router.get("/{dashboard_id}")
def get_dashboard(
    dashboard_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == user.id,
    ).first()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    kpis = db.query(KpiDefinition).filter(
        KpiDefinition.dashboard_id == dashboard_id
    ).all()

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "source_type": dashboard.source_type,
        "status": dashboard.status,
        "columns": dashboard.columns_meta,
        "data": dashboard.raw_data[:100],
        "total_rows": dashboard.row_count,
        "kpis": [
            {
                "id": k.id,
                "name": k.name,
                "column_name": k.column_name,
                "current_value": k.current_value,
                "target_value": k.target_value,
                "trend": k.trend,
                "status": _compute_status(k.current_value, k.target_value, k.threshold_green, k.threshold_yellow),
            }
            for k in kpis
        ],
        "is_shared": dashboard.is_shared,
        "share_id": dashboard.share_id,
        "created_at": dashboard.created_at.isoformat() if dashboard.created_at else None,
    }


@router.delete("/{dashboard_id}")
def delete_dashboard(
    dashboard_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == user.id,
    ).first()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    db.delete(dashboard)
    db.commit()
    return {"status": "deleted"}


def _compute_status(current: float, target: float, green: float, yellow: float) -> str:
    if target == 0:
        return "pending"
    ratio = (current / target) * 100
    if ratio >= green:
        return "green"
    elif ratio >= yellow:
        return "yellow"
    return "red"
