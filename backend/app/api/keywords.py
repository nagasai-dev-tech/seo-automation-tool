import csv
import io
from typing import List, Any, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.models.models import Keyword, Website, Brand, RankingResult, RankingChange, Alert, User
from app.schemas.schemas import (
    KeywordCreate, KeywordUpdate, KeywordOut, KeywordDetailOut,
    KeywordImportSummary, RankingHistoryItem, RankingChangeOut, RankingResultOut
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/keywords", tags=["Keywords"])


@router.get("", response_model=List[KeywordOut])
def list_keywords(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    location: Optional[str] = Query(None),
    device: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("keyword"),
    order: Optional[str] = Query("asc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = db.query(Keyword).join(Website)
    if brand_id:
        query = query.filter(Website.brand_id == brand_id)
    if website_id:
        query = query.filter(Keyword.website_id == website_id)
    if location and location != "all":
        query = query.filter(Keyword.location == location)
    if device and device != "all":
        query = query.filter(Keyword.device == device)
    if status_filter and status_filter != "all":
        query = query.filter(Keyword.status == status_filter)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Keyword.keyword.ilike(s),
                Keyword.landing_page_url.ilike(s),
                Website.domain.ilike(s)
            )
        )

    # Sorting
    if sort_by == "keyword":
        col = Keyword.keyword
    elif sort_by == "created_at":
        col = Keyword.created_at
    else:
        col = Keyword.id

    query = query.order_by(desc(col) if order == "desc" else asc(col))
    offset = (page - 1) * limit
    keywords = query.offset(offset).limit(limit).all()

    result = []
    for k in keywords:
        brand = db.query(Brand).filter(Brand.id == k.website.brand_id).first() if k.website else None
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

        result.append({
            "id": k.id,
            "website_id": k.website_id,
            "keyword": k.keyword,
            "landing_page_url": k.landing_page_url,
            "location": k.location,
            "country": k.country,
            "language": k.language,
            "device": k.device,
            "search_engine": k.search_engine,
            "target_url": k.target_url,
            "status": k.status,
            "created_at": k.created_at,
            "updated_at": k.updated_at,
            "brand_name": brand.name if brand else None,
            "website_domain": k.website.domain if k.website else None,
            "current_position": lr.position if lr else None,
            "previous_position": lc.previous_position if lc else None,
            "position_change": lc.change if lc else 0,
            "change_type": lc.change_type if lc else "unchanged",
            "last_checked": lr.checked_at if lr else None
        })
    return result


@router.post("", response_model=KeywordOut, status_code=status.HTTP_201_CREATED)
def create_keyword(
    keyword_in: KeywordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    site = db.query(Website).filter(Website.id == keyword_in.website_id).first()
    if not site:
        raise HTTPException(status_code=400, detail="Website not found")

    keyword = Keyword(**keyword_in.model_dump())
    db.add(keyword)
    db.commit()
    db.refresh(keyword)

    brand = site.brand
    return {
        **keyword.__dict__,
        "brand_name": brand.name if brand else None,
        "website_domain": site.domain,
        "current_position": None,
        "previous_position": None,
        "position_change": 0,
        "change_type": "unchanged",
        "last_checked": None
    }


@router.get("/{keyword_id}", response_model=KeywordDetailOut)
def get_keyword_detail(
    keyword_id: int,
    range_days: int = Query(30, alias="range"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    k = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not k:
        raise HTTPException(status_code=404, detail="Keyword not found")

    brand = db.query(Brand).filter(Brand.id == k.website.brand_id).first() if k.website else None
    
    # Latest SERP result
    latest_result = (
        db.query(RankingResult)
        .filter(RankingResult.keyword_id == k.id)
        .order_by(RankingResult.checked_at.desc())
        .first()
    )
    latest_change = (
        db.query(RankingChange)
        .filter(RankingChange.keyword_id == k.id)
        .order_by(RankingChange.checked_at.desc())
        .first()
    )

    kw_out = {
        "id": k.id,
        "website_id": k.website_id,
        "keyword": k.keyword,
        "landing_page_url": k.landing_page_url,
        "location": k.location,
        "country": k.country,
        "language": k.language,
        "device": k.device,
        "search_engine": k.search_engine,
        "target_url": k.target_url,
        "status": k.status,
        "created_at": k.created_at,
        "updated_at": k.updated_at,
        "brand_name": brand.name if brand else None,
        "website_domain": k.website.domain if k.website else None,
        "current_position": latest_result.position if latest_result else None,
        "previous_position": latest_change.previous_position if latest_change else None,
        "position_change": latest_change.change if latest_change else 0,
        "change_type": latest_change.change_type if latest_change else "unchanged",
        "last_checked": latest_result.checked_at if latest_result else None
    }

    # History entries
    cutoff = datetime.now(timezone.utc) - timedelta(days=range_days)
    results = (
        db.query(RankingResult)
        .filter(RankingResult.keyword_id == k.id, RankingResult.checked_at >= cutoff)
        .order_by(RankingResult.checked_at.asc())
        .all()
    )
    history_items = [
        RankingHistoryItem(
            date=r.checked_at.strftime("%Y-%m-%d"),
            position=r.position,
            url_found=r.url_found,
            title=r.title,
            snippet=r.snippet
        )
        for r in results
    ]

    # Recent changes
    recent_changes = (
        db.query(RankingChange)
        .filter(RankingChange.keyword_id == k.id)
        .order_by(RankingChange.checked_at.desc())
        .limit(10)
        .all()
    )

    return {
        "keyword": kw_out,
        "history": history_items,
        "recent_changes": recent_changes,
        "serp_preview": latest_result
    }


@router.put("/{keyword_id}", response_model=KeywordOut)
def update_keyword(
    keyword_id: int,
    kw_in: KeywordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    k = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not k:
        raise HTTPException(status_code=404, detail="Keyword not found")

    for field, val in kw_in.model_dump(exclude_unset=True).items():
        setattr(k, field, val)

    db.commit()
    db.refresh(k)

    brand = db.query(Brand).filter(Brand.id == k.website.brand_id).first() if k.website else None
    lr = db.query(RankingResult).filter(RankingResult.keyword_id == k.id).order_by(RankingResult.checked_at.desc()).first()
    lc = db.query(RankingChange).filter(RankingChange.keyword_id == k.id).order_by(RankingChange.checked_at.desc()).first()

    return {
        **k.__dict__,
        "brand_name": brand.name if brand else None,
        "website_domain": k.website.domain if k.website else None,
        "current_position": lr.position if lr else None,
        "previous_position": lc.previous_position if lc else None,
        "position_change": lc.change if lc else 0,
        "change_type": lc.change_type if lc else "unchanged",
        "last_checked": lr.checked_at if lr else None
    }


@router.delete("/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_keyword(
    keyword_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    k = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not k:
        raise HTTPException(status_code=404, detail="Keyword not found")
    db.delete(k)
    db.commit()
    return None


@router.post("/import", response_model=KeywordImportSummary)
async def import_keywords_csv(
    website_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Import keywords in bulk via CSV.
    Validates CSV columns: keyword, landing_page, location, country, language, device.
    Returns counts for total, valid, invalid, duplicate, and imported rows.
    """
    site = db.query(Website).filter(Website.id == website_id).first()
    if not site:
        raise HTTPException(status_code=400, detail="Target website not found.")

    contents = await file.read()
    try:
        decoded = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = contents.decode("latin-1")

    reader = csv.reader(io.StringIO(decoded))
    header = next(reader, None)
    if not header:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    # Normalize header mapping
    header_lower = [h.strip().lower() for h in header]
    try:
        kw_idx = header_lower.index("keyword")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="CSV missing required 'keyword' column in header. Expected format: keyword,landing_page,location,country,language,device"
        )
    
    lp_idx = header_lower.index("landing_page") if "landing_page" in header_lower else (
        header_lower.index("landing_page_url") if "landing_page_url" in header_lower else -1
    )
    loc_idx = header_lower.index("location") if "location" in header_lower else -1
    cntry_idx = header_lower.index("country") if "country" in header_lower else -1
    lang_idx = header_lower.index("language") if "language" in header_lower else -1
    dev_idx = header_lower.index("device") if "device" in header_lower else -1

    existing_kws = {
        k.keyword.lower().strip()
        for k in db.query(Keyword).filter(Keyword.website_id == website_id).all()
    }

    total_rows = 0
    valid_rows = 0
    invalid_rows = 0
    duplicate_rows = 0
    imported_count = 0
    errors = []

    to_insert = []
    seen_in_batch = set()

    for line_num, row in enumerate(reader, start=2):
        if not row or not any(row):
            continue
        total_rows += 1

        kw_val = row[kw_idx].strip() if len(row) > kw_idx else ""
        if not kw_val:
            invalid_rows += 1
            errors.append(f"Row {line_num}: Empty keyword value.")
            continue

        lp_val = row[lp_idx].strip() if (lp_idx >= 0 and len(row) > lp_idx) else "/"
        loc_val = row[loc_idx].strip() if (loc_idx >= 0 and len(row) > loc_idx) else "Global"
        cntry_val = row[cntry_idx].strip() if (cntry_idx >= 0 and len(row) > cntry_idx) else "Global"
        lang_val = row[lang_idx].strip() if (lang_idx >= 0 and len(row) > lang_idx) else "en"
        dev_val = row[dev_idx].strip().lower() if (dev_idx >= 0 and len(row) > dev_idx) else "desktop"

        if dev_val not in ("desktop", "mobile"):
            dev_val = "desktop"

        kw_clean = kw_val.lower()
        if kw_clean in existing_kws or kw_clean in seen_in_batch:
            duplicate_rows += 1
            continue

        seen_in_batch.add(kw_clean)
        valid_rows += 1

        new_kw = Keyword(
            website_id=website_id,
            keyword=kw_val,
            landing_page_url=lp_val,
            location=loc_val or "Global",
            country=cntry_val or "Global",
            language=lang_val or "en",
            device=dev_val,
            status="active"
        )
        to_insert.append(new_kw)

    if to_insert:
        db.bulk_save_objects(to_insert)
        db.commit()
        imported_count = len(to_insert)

    return {
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
        "duplicate_rows": duplicate_rows,
        "imported_count": imported_count,
        "errors": errors[:10]  # First 10 errors
    }


@router.get("/export/csv")
def export_keywords_csv(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Keyword).join(Website)
    if brand_id:
        query = query.filter(Website.brand_id == brand_id)
    if website_id:
        query = query.filter(Keyword.website_id == website_id)
    keywords = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Keyword", "Domain", "Landing Page", "Location", "Country", "Device", "Status"])

    for k in keywords:
        writer.writerow([
            k.id,
            k.keyword,
            k.website.domain if k.website else "",
            k.landing_page_url,
            k.location,
            k.country,
            k.device,
            k.status
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=keywords_export.csv"}
    )
