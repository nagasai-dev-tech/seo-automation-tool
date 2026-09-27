import io
import csv
from typing import List, Any, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.models.models import Keyword, Website, Brand, RankingResult, RankingChange, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/rankings", tags=["Rankings"])


@router.get("")
def list_rankings_overview(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    location: Optional[str] = Query(None),
    device: Optional[str] = Query(None),
    position_filter: Optional[str] = Query(None),  # top3, top10, top20, top50, top100, unranked
    change_filter: Optional[str] = Query(None),    # improved, dropped, unchanged, new, lost
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("current_position"),
    order: Optional[str] = Query("asc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Returns ranking overview with previous, current, change, trend, and last checked.
    Supports comprehensive filtering, sorting and pagination.
    """
    query = db.query(Keyword).join(Website)
    if brand_id:
        query = query.filter(Website.brand_id == brand_id)
    if website_id:
        query = query.filter(Keyword.website_id == website_id)
    if location and location != "all":
        query = query.filter(Keyword.location == location)
    if device and device != "all":
        query = query.filter(Keyword.device == device)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Keyword.keyword.ilike(s),
                Keyword.landing_page_url.ilike(s),
                Website.domain.ilike(s)
            )
        )

    all_kws = query.all()
    rows = []

    for k in all_kws:
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

        curr_pos = lr.position if lr else None
        prev_pos = lc.previous_position if lc else None
        chg = lc.change if lc else 0
        chg_type = lc.change_type if lc else ("new" if not lr else "unchanged")

        # Position filter
        if position_filter and position_filter != "all":
            if position_filter == "top3" and (curr_pos is None or curr_pos > 3):
                continue
            elif position_filter == "top10" and (curr_pos is None or curr_pos > 10):
                continue
            elif position_filter == "top20" and (curr_pos is None or curr_pos > 20):
                continue
            elif position_filter == "top50" and (curr_pos is None or curr_pos > 50):
                continue
            elif position_filter == "top100" and (curr_pos is None or curr_pos > 100):
                continue
            elif position_filter == "unranked" and (curr_pos is not None and curr_pos <= 100):
                continue

        # Change filter
        if change_filter and change_filter != "all":
            if change_filter != chg_type:
                continue

        # Trend symbol
        if chg > 0:
            trend = "↑"
        elif chg < 0:
            trend = "↓"
        else:
            trend = "→"

        brand = db.query(Brand).filter(Brand.id == k.website.brand_id).first() if k.website else None

        rows.append({
            "keyword_id": k.id,
            "keyword": k.keyword,
            "landing_page_url": k.landing_page_url,
            "domain": k.website.domain if k.website else "",
            "brand_name": brand.name if brand else "",
            "brand_id": brand.id if brand else None,
            "website_id": k.website_id,
            "location": k.location,
            "device": k.device,
            "previous_position": prev_pos,
            "current_position": curr_pos,
            "change": chg,
            "change_type": chg_type,
            "trend": trend,
            "title": lr.title if lr else None,
            "snippet": lr.snippet if lr else None,
            "url_found": lr.url_found if lr else None,
            "last_checked": lr.checked_at.isoformat() if lr else None,
            "status": k.status
        })

    # Sort rows
    reverse = (order == "desc")
    if sort_by == "current_position":
        # sort None to the end
        rows.sort(key=lambda r: (r["current_position"] is None, r["current_position"] or 999), reverse=reverse)
    elif sort_by == "previous_position":
        rows.sort(key=lambda r: (r["previous_position"] is None, r["previous_position"] or 999), reverse=reverse)
    elif sort_by == "change":
        rows.sort(key=lambda r: r["change"], reverse=reverse)
    elif sort_by == "keyword":
        rows.sort(key=lambda r: r["keyword"].lower(), reverse=reverse)
    elif sort_by == "last_checked":
        rows.sort(key=lambda r: (r["last_checked"] is None, r["last_checked"] or ""), reverse=reverse)

    total_count = len(rows)
    offset = (page - 1) * limit
    paginated = rows[offset: offset + limit]

    return {
        "items": paginated,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit if total_count > 0 else 1
    }


@router.get("/history/{keyword_id}")
def get_keyword_ranking_history(
    keyword_id: int,
    range: str = Query("30d"),  # 7d, 30d, 90d, custom
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    days = 30
    if range == "7d":
        days = 7
    elif range == "90d":
        days = 90

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(RankingResult)
        .filter(RankingResult.keyword_id == keyword_id, RankingResult.checked_at >= cutoff)
        .order_by(RankingResult.checked_at.asc())
        .all()
    )

    history = [
        {
            "date": r.checked_at.strftime("%Y-%m-%d"),
            "checked_at": r.checked_at.isoformat(),
            "position": r.position if (r.position and r.position <= 100) else None,
            "url_found": r.url_found,
            "title": r.title,
            "snippet": r.snippet
        }
        for r in results
    ]
    return history


@router.get("/export/csv")
def export_rankings_csv(
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
    writer.writerow([
        "Keyword", "Domain", "Landing Page", "Location", "Device",
        "Previous Position", "Current Position", "Change", "Trend", "Last Checked"
    ])

    for k in keywords:
        lr = db.query(RankingResult).filter(RankingResult.keyword_id == k.id).order_by(RankingResult.checked_at.desc()).first()
        lc = db.query(RankingChange).filter(RankingChange.keyword_id == k.id).order_by(RankingChange.checked_at.desc()).first()
        prev = f"#{lc.previous_position}" if lc and lc.previous_position and lc.previous_position <= 100 else "Unranked"
        curr = f"#{lr.position}" if lr and lr.position and lr.position <= 100 else "Unranked"
        chg = f"+{lc.change}" if lc and lc.change > 0 else (str(lc.change) if lc else "0")
        trend = "↑" if lc and lc.change > 0 else ("↓" if lc and lc.change < 0 else "→")
        dt = lr.checked_at.strftime("%Y-%m-%d %H:%M") if lr else "Never"

        writer.writerow([
            k.keyword,
            k.website.domain if k.website else "",
            k.landing_page_url,
            k.location,
            k.device,
            prev,
            curr,
            chg,
            trend,
            dt
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=avention_rankings_export.csv"}
    )
