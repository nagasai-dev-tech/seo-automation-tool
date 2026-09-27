from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index, Float
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="seo_member", nullable=False)  # admin, manager, seo_member, viewer
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, paused, archived
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    websites = relationship("Website", back_populates="brand", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="brand", cascade="all, delete-orphan")


class Website(Base):
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    domain = Column(String(255), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    country = Column(String(100), default="Global", nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, paused
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    brand = relationship("Brand", back_populates="websites")
    keywords = relationship("Keyword", back_populates="website", cascade="all, delete-orphan")
    jobs = relationship("RankCheckJob", back_populates="website", cascade="all, delete-orphan")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    keyword = Column(String(255), nullable=False, index=True)
    landing_page_url = Column(String(500), nullable=False)
    location = Column(String(150), default="Global", nullable=False)
    country = Column(String(100), default="Global", nullable=False)
    language = Column(String(20), default="en", nullable=False)
    device = Column(String(50), default="desktop", nullable=False)  # desktop, mobile
    search_engine = Column(String(50), default="google", nullable=False)
    target_url = Column(String(500), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, paused
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    website = relationship("Website", back_populates="keywords")
    ranking_results = relationship("RankingResult", back_populates="keyword", cascade="all, delete-orphan")
    ranking_changes = relationship("RankingChange", back_populates="keyword", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="keyword", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_keywords_site_kw", "website_id", "keyword"),
    )


class RankingResult(Base):
    __tablename__ = "ranking_results"

    id = Column(Integer, primary_key=True, index=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False, index=True)
    checked_at = Column(DateTime, default=utcnow, nullable=False, index=True)
    position = Column(Integer, nullable=True)  # 1..100, or 101+ / not found
    url_found = Column(String(500), nullable=True)
    title = Column(String(500), nullable=True)
    snippet = Column(Text, nullable=True)
    search_engine = Column(String(50), default="google", nullable=False)
    location = Column(String(150), nullable=True)
    device = Column(String(50), nullable=True)
    status = Column(String(50), default="success", nullable=False)  # success, failed, not_found

    keyword = relationship("Keyword", back_populates="ranking_results")

    __table_args__ = (
        Index("idx_rankings_kw_checked", "keyword_id", "checked_at"),
    )


class RankingChange(Base):
    __tablename__ = "ranking_changes"

    id = Column(Integer, primary_key=True, index=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_position = Column(Integer, nullable=True)
    current_position = Column(Integer, nullable=True)
    change = Column(Integer, default=0, nullable=False)
    checked_at = Column(DateTime, default=utcnow, nullable=False, index=True)
    change_type = Column(String(50), default="unchanged", nullable=False)  # improved, dropped, unchanged, new, lost

    keyword = relationship("Keyword", back_populates="ranking_changes")

    __table_args__ = (
        Index("idx_changes_kw_checked", "keyword_id", "checked_at"),
    )


class RankCheckJob(Base):
    __tablename__ = "rank_check_jobs"

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id", ondelete="SET NULL"), nullable=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    total_keywords = Column(Integer, default=0, nullable=False)
    processed_keywords = Column(Integer, default=0, nullable=False)
    successful = Column(Integer, default=0, nullable=False)
    failed = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="queued", nullable=False)  # queued, running, completed, failed, cancelled
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    website = relationship("Website", back_populates="jobs")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    report_type = Column(String(50), default="weekly", nullable=False)  # weekly, monthly, on_demand
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    file_url = Column(String(500), nullable=True)
    data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    brand = relationship("Brand", back_populates="reports")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(100), nullable=False)  # rank_drop_5, out_of_top_10, entered_top_10, entered_top_3, lost_ranking
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="warning", nullable=False)  # critical, warning, info
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)

    keyword = relationship("Keyword", back_populates="alerts")


class SchedulerSetting(Base):
    __tablename__ = "scheduler_settings"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), default="mon", nullable=False)
    time_str = Column(String(20), default="06:00", nullable=False)
    timezone = Column(String(100), default="Asia/Kolkata", nullable=False)
    frequency = Column(String(50), default="weekly", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
