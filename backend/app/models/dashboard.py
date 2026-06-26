import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON, Float, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    source_file = Column(String, nullable=True)
    status = Column(String, default="processing")

    columns_meta = Column(JSON, default=list)
    raw_data = Column(JSON, default=list)
    kpi_mappings = Column(JSON, default=list)
    insights = Column(JSON, default=dict)

    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)

    is_shared = Column(Boolean, default=False)
    share_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="dashboards")
    kpis = relationship("KpiDefinition", back_populates="dashboard", cascade="all, delete-orphan")
    shares = relationship("Share", back_populates="dashboard", cascade="all, delete-orphan")


class KpiDefinition(Base):
    __tablename__ = "kpi_definitions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey("dashboards.id"), nullable=False)
    name = Column(String, nullable=False)
    column_name = Column(String, nullable=False)
    target_value = Column(Float, default=0)
    current_value = Column(Float, default=0)
    threshold_green = Column(Float, default=90)
    threshold_yellow = Column(Float, default=70)
    unit = Column(String, default="%")
    trend = Column(String, default="stable")

    dashboard = relationship("Dashboard", back_populates="kpis")
