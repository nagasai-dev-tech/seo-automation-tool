from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ----------------- User & Auth Schemas -----------------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "seo_member"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    email: Optional[str] = None


# ----------------- Brand Schemas -----------------
class BrandBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: str = "active"


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: Optional[str] = None


class BrandOut(BrandBase):
    id: int
    created_at: datetime
    updated_at: datetime
    website_count: Optional[int] = 0
    keyword_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ----------------- Website Schemas -----------------
class WebsiteBase(BaseModel):
    brand_id: int
    domain: str
    name: str
    country: str = "Global"
    status: str = "active"


class WebsiteCreate(WebsiteBase):
    pass


class WebsiteUpdate(BaseModel):
    brand_id: Optional[int] = None
    domain: Optional[str] = None
    name: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None


class WebsiteOut(WebsiteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    brand_name: Optional[str] = None
    keyword_count: Optional[int] = 0
    avg_position: Optional[float] = None
    top_10_count: Optional[int] = 0
    improved_count: Optional[int] = 0
    dropped_count: Optional[int] = 0
    last_checked: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------- Keyword Schemas -----------------
class KeywordBase(BaseModel):
    website_id: int
    keyword: str
    landing_page_url: str
    location: str = "Global"
    country: str = "Global"
    language: str = "en"
    device: str = "desktop"
    search_engine: str = "google"
    target_url: Optional[str] = None
    status: str = "active"


class KeywordCreate(KeywordBase):
    pass


class KeywordUpdate(BaseModel):
    website_id: Optional[int] = None
    keyword: Optional[str] = None
    landing_page_url: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = None
    device: Optional[str] = None
    search_engine: Optional[str] = None
    target_url: Optional[str] = None
    status: Optional[str] = None


class KeywordOut(KeywordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    brand_name: Optional[str] = None
    website_domain: Optional[str] = None
    current_position: Optional[int] = None
    previous_position: Optional[int] = None
    position_change: Optional[int] = 0
    change_type: Optional[str] = "unchanged"
    last_checked: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CSVImportRow(BaseModel):
    keyword: str
    landing_page: str
    location: Optional[str] = "Global"
    country: Optional[str] = "Global"
    language: Optional[str] = "en"
    device: Optional[str] = "desktop"


class KeywordImportSummary(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    imported_count: int
    errors: List[str] = []


# ----------------- Ranking Result & History Schemas -----------------
class RankingResultOut(BaseModel):
    id: int
    keyword_id: int
    checked_at: datetime
    position: Optional[int] = None
    url_found: Optional[str] = None
    title: Optional[str] = None
    snippet: Optional[str] = None
    search_engine: str
    location: Optional[str] = None
    device: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class RankingChangeOut(BaseModel):
    id: int
    keyword_id: int
    previous_position: Optional[int] = None
    current_position: Optional[int] = None
    change: int
    checked_at: datetime
    change_type: str

    model_config = ConfigDict(from_attributes=True)


class RankingHistoryItem(BaseModel):
    date: str
    position: Optional[int] = None
    url_found: Optional[str] = None
    title: Optional[str] = None
    snippet: Optional[str] = None


class KeywordDetailOut(BaseModel):
    keyword: KeywordOut
    history: List[RankingHistoryItem]
    recent_changes: List[RankingChangeOut]
    serp_preview: Optional[RankingResultOut] = None


# ----------------- Job Schemas -----------------
class JobRunRequest(BaseModel):
    website_id: Optional[int] = None
    brand_id: Optional[int] = None


class RankCheckJobOut(BaseModel):
    id: int
    website_id: Optional[int] = None
    brand_id: Optional[int] = None
    website_domain: Optional[str] = None
    brand_name: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_keywords: int
    processed_keywords: int
    successful: int
    failed: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Alert Schemas -----------------
class AlertOut(BaseModel):
    id: int
    keyword_id: int
    keyword_text: Optional[str] = None
    website_domain: Optional[str] = None
    brand_name: Optional[str] = None
    type: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Report Schemas -----------------
class ReportGenerateRequest(BaseModel):
    brand_id: Optional[int] = None
    report_type: str = "weekly"
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class ReportOut(BaseModel):
    id: int
    brand_id: Optional[int] = None
    brand_name: Optional[str] = None
    report_type: str
    period_start: datetime
    period_end: datetime
    file_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Analytics Schemas -----------------
class AnalyticsOverview(BaseModel):
    total_keywords: int
    tracked_keywords: int
    top_3: int
    top_10: int
    top_20: int
    top_50: int
    top_100: int
    not_ranking: int
    improved: int
    dropped: int
    unchanged: int
    average_position: float


class DistributionItem(BaseModel):
    range: str
    count: int
    percentage: float


class MovementItem(BaseModel):
    keyword_id: int
    keyword: str
    domain: str
    previous_position: Optional[int]
    current_position: Optional[int]
    change: int
    change_type: str


class LocationPerformanceItem(BaseModel):
    location: str
    total_keywords: int
    top_10_count: int
    avg_position: float


class DevicePerformanceItem(BaseModel):
    device: str
    total_keywords: int
    top_10_count: int
    avg_position: float


class TrendItem(BaseModel):
    date: str
    avg_position: float
    top_10_count: int
    top_3_count: int


# ----------------- Settings Schemas -----------------
class SchedulerSettingOut(BaseModel):
    id: int
    day_of_week: str
    time_str: str
    timezone: str
    frequency: str
    is_active: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SchedulerSettingUpdate(BaseModel):
    day_of_week: Optional[str] = None
    time_str: Optional[str] = None
    timezone: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


# ----------------- Global Search -----------------
class SearchResultItem(BaseModel):
    type: str  # "keyword", "website", "brand", "landing_page"
    id: int
    title: str
    subtitle: Optional[str] = None
    url: Optional[str] = None
