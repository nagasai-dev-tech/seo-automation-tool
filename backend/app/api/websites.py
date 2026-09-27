from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Website, Brand, Keyword, RankingResult, RankingChange, User
from app.schemas.schemas import WebsiteCreate, WebsiteUpdate, WebsiteOut, RankCheckJobOut
from app.api.deps import get_current_user
from app.services.job_service import create_and_start_job

router = APIRouter(prefix="/websites", tags=["Websites"])


@router.get("", response_model=List[WebsiteOut])
def list_websites(
    brand_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = db.query(Website)
    if brand_id:
        query = query.filter(Website.brand_id == brand_id)
    websites = query.order_by(Website.domain.asc()).all()

    result = []
    for w in websites:
        brand = db.query(Brand).filter(Brand.id == w.brand_id).first()
        kws = db.query(Keyword).filter(Keyword.website_id == w.id).all()
        kw_count = len(kws)

        top_10 = 0
        pos_sum = 0
        pos_count = 0
        improved = 0
        dropped = 0
        last_check_date = None

        for k in kws:
            lr = (
                db.query(RankingResult)
                .filter(RankingResult.keyword_id == k.id)
                .order_by(RankingResult.checked_at.desc())
                .first()
            )
            lc = (
                db.query(RankingChange)
                .filter(RankingChange.keyword_id == k.id)
                .order_by(RankingChange.checked_at.desc())
                .first()
            )

            if lr:
                if not last_check_date or lr.checked_at > last_check_date:
                    last_check_date = lr.checked_at
                if lr.position and lr.position <= 100:
                    pos_sum += lr.position
                    pos_count += 1
                    if lr.position <= 10:
                        top_10 += 1

            if lc:
                if lc.change_type == "improved":
                    improved += 1
                elif lc.change_type in ("dropped", "lost"):
                    dropped += 1

        avg_pos = round(pos_sum / pos_count, 1) if pos_count > 0 else None

        result.append({
            "id": w.id,
            "brand_id": w.brand_id,
            "domain": w.domain,
            "name": w.name,
            "country": w.country,
            "status": w.status,
            "created_at": w.created_at,
            "updated_at": w.updated_at,
            "brand_name": brand.name if brand else None,
            "keyword_count": kw_count,
            "avg_position": avg_pos,
            "top_10_count": top_10,
            "improved_count": improved,
            "dropped_count": dropped,
            "last_checked": last_check_date
        })
    return result


@router.post("", response_model=WebsiteOut, status_code=status.HTTP_201_CREATED)
def create_website(
    site_in: WebsiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    brand = db.query(Brand).filter(Brand.id == site_in.brand_id).first()
    if not brand:
        raise HTTPException(status_code=400, detail="Brand not found")

    existing = db.query(Website).filter(Website.domain == site_in.domain, Website.brand_id == site_in.brand_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Domain {site_in.domain} already exists under this brand.")

    website = Website(**site_in.model_dump())
    db.add(website)
    db.commit()
    db.refresh(website)

    return {
        **website.__dict__,
        "brand_name": brand.name,
        "keyword_count": 0,
        "avg_position": None,
        "top_10_count": 0,
        "improved_count": 0,
        "dropped_count": 0,
        "last_checked": None
    }


@router.get("/{website_id}", response_model=WebsiteOut)
def get_website(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    w = db.query(Website).filter(Website.id == website_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Website not found")

    brand = db.query(Brand).filter(Brand.id == w.brand_id).first()
    kws = db.query(Keyword).filter(Keyword.website_id == w.id).all()
    kw_count = len(kws)

    top_10 = 0
    pos_sum = 0
    pos_count = 0
    improved = 0
    dropped = 0
    last_check_date = None

    for k in kws:
        lr = db.query(RankingResult).filter(RankingResult.keyword_id == k.id).order_by(RankingResult.checked_at.desc()).first()
        lc = db.query(RankingChange).filter(RankingChange.keyword_id == k.id).order_by(RankingChange.checked_at.desc()).first()
        if lr:
            if not last_check_date or lr.checked_at > last_check_date:
                last_check_date = lr.checked_at
            if lr.position and lr.position <= 100:
                pos_sum += lr.position
                pos_count += 1
                if lr.position <= 10:
                    top_10 += 1
        if lc:
            if lc.change_type == "improved":
                improved += 1
            elif lc.change_type in ("dropped", "lost"):
                dropped += 1

    return {
        **w.__dict__,
        "brand_name": brand.name if brand else None,
        "keyword_count": kw_count,
        "avg_position": round(pos_sum / pos_count, 1) if pos_count > 0 else None,
        "top_10_count": top_10,
        "improved_count": improved,
        "dropped_count": dropped,
        "last_checked": last_check_date
    }


@router.put("/{website_id}", response_model=WebsiteOut)
def update_website(
    website_id: int,
    site_in: WebsiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    w = db.query(Website).filter(Website.id == website_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Website not found")

    for field, val in site_in.model_dump(exclude_unset=True).items():
        setattr(w, field, val)

    db.commit()
    db.refresh(w)

    brand = db.query(Brand).filter(Brand.id == w.brand_id).first()
    kw_count = db.query(Keyword).filter(Keyword.website_id == w.id).count()

    return {
        **w.__dict__,
        "brand_name": brand.name if brand else None,
        "keyword_count": kw_count,
        "avg_position": None,
        "top_10_count": 0,
        "improved_count": 0,
        "dropped_count": 0,
        "last_checked": None
    }


@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_website(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    w = db.query(Website).filter(Website.id == website_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Website not found")
    db.delete(w)
    db.commit()
    return None


@router.post("/{website_id}/check", response_model=RankCheckJobOut)
def trigger_website_rank_check(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    w = db.query(Website).filter(Website.id == website_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Website not found")

    job = create_and_start_job(db, website_id=w.id)
    return {
        **job.__dict__,
        "website_domain": w.domain,
        "brand_name": w.brand.name if w.brand else None
    }
