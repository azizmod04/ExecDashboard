from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import Dashboard
from app.models.user import User
from app.api.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/insights", tags=["insights"])


class AnalysisRequest(BaseModel):
    dashboard_id: str
    lang: str = "ar"


class QuestionRequest(BaseModel):
    dashboard_id: str
    question: str
    lang: str = "ar"


@router.post("/analyze")
async def analyze_dashboard(
    req: AnalysisRequest,
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

    analysis = await ai_service.analyze(
        data=dashboard.raw_data or [],
        columns=dashboard.columns_meta or [],
        kpis=dashboard.kpi_mappings or [],
        lang=req.lang,
    )

    # Cache insights
    dashboard.insights = analysis
    db.commit()

    return analysis


@router.post("/ask")
async def ask_question(
    req: QuestionRequest,
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

    answer = await ai_service.ask_question(
        question=req.question,
        data=dashboard.raw_data or [],
        columns=dashboard.columns_meta or [],
        context=json.dumps(dashboard.insights) if dashboard.insights else None,
        lang=req.lang,
    )

    return {"question": req.question, "answer": answer}


import json
