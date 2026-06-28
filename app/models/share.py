import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Share(Base):
    __tablename__ = "shares"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey("dashboards.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)

    access_level = Column(String, default="view")
    password_hash = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    max_views = Column(Integer, default=0)
    current_views = Column(Integer, default=0)
    allow_download = Column(Boolean, default=False)
    watermark = Column(Boolean, default=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dashboard = relationship("Dashboard", back_populates="shares")
