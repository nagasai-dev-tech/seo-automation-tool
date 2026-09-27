from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import SchedulerSetting, User
from app.schemas.schemas import SchedulerSettingOut, SchedulerSettingUpdate, UserOut, UserCreate, UserUpdate
from app.api.deps import get_current_user, require_role
from app.services.scheduler_service import update_scheduler_job

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/scheduler", response_model=SchedulerSettingOut)
def get_scheduler_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    setting = db.query(SchedulerSetting).first()
    if not setting:
        setting = SchedulerSetting(
            day_of_week=settings.DEFAULT_SCHEDULE_DAY,
            time_str=settings.DEFAULT_SCHEDULE_TIME,
            timezone=settings.DEFAULT_SCHEDULE_TIMEZONE,
            frequency="weekly",
            is_active=True
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.put("/scheduler", response_model=SchedulerSettingOut)
def update_scheduler_settings(
    update_in: SchedulerSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
) -> Any:
    setting = db.query(SchedulerSetting).first()
    if not setting:
        setting = SchedulerSetting()
        db.add(setting)

    for field, val in update_in.model_dump(exclude_unset=True).items():
        setattr(setting, field, val)

    db.commit()
    db.refresh(setting)

    # Update active scheduler
    try:
        update_scheduler_job(
            day_of_week=setting.day_of_week,
            time_str=setting.time_str,
            tz_str=setting.timezone,
            is_active=setting.is_active
        )
    except Exception as e:
        pass

    return setting


@router.get("/provider")
def get_provider_settings(
    current_user: User = Depends(get_current_user)
) -> Any:
    return {
        "current_provider": settings.RANK_PROVIDER,
        "available_providers": [
            {"id": "mock", "name": "Mock Rank Provider (Local / Sandbox)", "configured": True},
            {"id": "dataforseo", "name": "DataForSEO SERP API v3", "configured": bool(settings.DATAFORSEO_LOGIN and settings.DATAFORSEO_PASSWORD)},
            {"id": "serpapi", "name": "SerpApi Google Organic Search", "configured": bool(settings.SERPAPI_KEY)}
        ]
    }


@router.put("/provider")
def set_provider_settings(
    provider_name: str,
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    prov = provider_name.lower().strip()
    if prov not in ("mock", "dataforseo", "serpapi"):
        raise HTTPException(status_code=400, detail="Invalid provider. Must be 'mock', 'dataforseo', or 'serpapi'.")
    settings.RANK_PROVIDER = prov
    return {"status": "success", "current_provider": settings.RANK_PROVIDER}


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user_admin(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.name is not None:
        target.name = user_in.name
    if user_in.email is not None:
        target.email = user_in.email
    if user_in.role is not None:
        target.role = user_in.role
    if user_in.password:
        target.password_hash = get_password_hash(user_in.password)

    db.commit()
    db.refresh(target)
    return target


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(target)
    db.commit()
    return None
