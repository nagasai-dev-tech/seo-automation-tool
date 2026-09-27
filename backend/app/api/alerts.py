from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Alert, Keyword, Website, Brand, User
from app.schemas.schemas import AlertOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertOut])
def list_alerts(
    severity: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    brand_id: Optional[int] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = db.query(Alert).join(Keyword).join(Website)
    if severity and severity != "all":
        query = query.filter(Alert.severity == severity)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
    if brand_id:
        query = query.filter(Website.brand_id == brand_id)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    result = []
    for a in alerts:
        brand = db.query(Brand).filter(Brand.id == a.keyword.website.brand_id).first() if (a.keyword and a.keyword.website) else None
        result.append({
            "id": a.id,
            "keyword_id": a.keyword_id,
            "keyword_text": a.keyword.keyword if a.keyword else None,
            "website_domain": a.keyword.website.domain if (a.keyword and a.keyword.website) else None,
            "brand_name": brand.name if brand else None,
            "type": a.type,
            "message": a.message,
            "severity": a.severity,
            "is_read": a.is_read,
            "created_at": a.created_at
        })
    return result


@router.put("/{alert_id}/read", response_model=AlertOut)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    db.commit()
    db.refresh(alert)

    brand = db.query(Brand).filter(Brand.id == alert.keyword.website.brand_id).first() if (alert.keyword and alert.keyword.website) else None
    return {
        "id": alert.id,
        "keyword_id": alert.keyword_id,
        "keyword_text": alert.keyword.keyword if alert.keyword else None,
        "website_domain": alert.keyword.website.domain if (alert.keyword and alert.keyword.website) else None,
        "brand_name": brand.name if brand else None,
        "type": alert.type,
        "message": alert.message,
        "severity": alert.severity,
        "is_read": alert.is_read,
        "created_at": alert.created_at
    }


@router.put("/mark-all-read")
def mark_all_alerts_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All alerts marked as read."}
