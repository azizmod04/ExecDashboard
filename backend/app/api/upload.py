import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import Dashboard, KpiDefinition
from app.api.auth import get_current_user
from app.models.user import User
from app.services.parser import parse_file
from app.services.kpi_service import kpi_service

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    ext = file.filename.split('.')[-1].lower() if "." in file.filename else ""
    if ext not in ["xlsx", "xls", "csv", "pbix", "twb", "twbx"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 50 MB limit")

    try:
        parsed = await parse_file(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Find the sheet with the most data
    main_sheet = None
    max_rows = 0
    for sheet in parsed.get("sheets", []):
        sheet_data = parsed["data"].get(sheet, {})
        if sheet_data.get("totalRows", 0) > max_rows:
            max_rows = sheet_data["totalRows"]
            main_sheet = sheet

    data = []
    columns = []
    if main_sheet:
        data = parsed["data"][main_sheet].get("rows", [])
        columns = parsed["data"][main_sheet].get("columns", [])

    # Auto-detect KPIs
    auto_kpis = kpi_service.auto_detect_kpis(data, columns)
    field_suggestions = kpi_service.get_field_suggestions(columns)
    quality = kpi_service.analyze_data_quality(data, columns)

    # Create dashboard record
    dashboard = Dashboard(
        user_id=user.id,
        name=file.filename.rsplit(".", 1)[0],
        source_type=parsed.get("type", "unknown"),
        source_file=file.filename,
        status="ready",
        columns_meta=columns,
        raw_data=data[:500],
        kpi_mappings=auto_kpis,
        row_count=len(data),
        col_count=len(columns),
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)

    # Store KPI definitions
    for akpi in auto_kpis:
        kpi_def = KpiDefinition(
            dashboard_id=dashboard.id,
            name=akpi["name"],
            column_name=akpi["column_name"],
            target_value=akpi["target_value"],
            current_value=akpi["current_value"],
            trend=akpi["trend"],
        )
        db.add(kpi_def)
    db.commit()

    return {
        "dashboard_id": dashboard.id,
        "name": dashboard.name,
        "source_type": dashboard.source_type,
        "row_count": dashboard.row_count,
        "col_count": dashboard.col_count,
        "sheets": parsed.get("sheets", []),
        "kpis": auto_kpis,
        "field_suggestions": field_suggestions,
        "data_quality": quality,
    }
