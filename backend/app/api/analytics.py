from typing import Any, Optional, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Keyword, Website, Brand, RankingResult, RankingChange, User
from app.schemas.schemas import (
    AnalyticsOverview, DistributionItem, MovementItem,
    LocationPerformanceItem, DevicePerformanceItem, TrendItem
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    kw_query = db.query(Keyword).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)

    keywords = kw_query.all()
    total_kw = len(keywords)

    tracked = 0
    top_3 = 0
    top_10 = 0
    top_20 = 0
    top_50 = 0
    top_100 = 0
    not_ranking = 0
    pos_sum = 0
    pos_count = 0

    improved = 0
    dropped = 0
    unchanged = 0

    for k in keywords:
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

        pos = lr.position if lr else None
        if pos and pos <= 100:
            tracked += 1
            pos_sum += pos
            pos_count += 1
            if pos <= 3:
                top_3 += 1
            if pos <= 10:
                top_10 += 1
            if pos <= 20:
                top_20 += 1
            if pos <= 50:
                top_50 += 1
            if pos <= 100:
                top_100 += 1
        else:
            not_ranking += 1

        if lc:
            if lc.change_type == "improved":
                improved += 1
            elif lc.change_type in ("dropped", "lost"):
                dropped += 1
            else:
                unchanged += 1
        elif lr:
            unchanged += 1

    avg_pos = round(pos_sum / pos_count, 1) if pos_count > 0 else 0.0

    return {
        "total_keywords": total_kw,
        "tracked_keywords": tracked,
        "top_3": top_3,
        "top_10": top_10,
        "top_20": top_20,
        "top_50": top_50,
        "top_100": top_100,
        "not_ranking": not_ranking,
        "improved": improved,
        "dropped": dropped,
        "unchanged": unchanged,
        "average_position": avg_pos
    }


@router.get("/distribution", response_model=List[DistributionItem])
def get_ranking_distribution(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    kw_query = db.query(Keyword).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)

    keywords = kw_query.all()
    total = len(keywords) or 1

    counts = {
        "Top 3 (1-3)": 0,
        "Top 10 (4-10)": 0,
        "Top 20 (11-20)": 0,
        "Top 50 (21-50)": 0,
        "Top 100 (51-100)": 0,
        "Not Ranking (101+)": 0
    }

    for k in keywords:
        lr = db.query(RankingResult).filter(RankingResult.keyword_id == k.id).order_by(RankingResult.checked_at.desc()).first()
        pos = lr.position if lr else None
        if not pos or pos > 100:
            counts["Not Ranking (101+)"] += 1
        elif pos <= 3:
            counts["Top 3 (1-3)"] += 1
        elif pos <= 10:
            counts["Top 10 (4-10)"] += 1
        elif pos <= 20:
            counts["Top 20 (11-20)"] += 1
        elif pos <= 50:
            counts["Top 50 (21-50)"] += 1
        elif pos <= 100:
            counts["Top 100 (51-100)"] += 1

    return [
        {
            "range": k,
            "count": v,
            "percentage": round((v / total) * 100, 1)
        }
        for k, v in counts.items()
    ]


@router.get("/movements")
def get_keyword_movements(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    kw_query = db.query(Keyword).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)

    keywords = kw_query.all()
    improvements = []
    drops = []

    for k in keywords:
        lc = db.query(RankingChange).filter(RankingChange.keyword_id == k.id).order_by(RankingChange.checked_at.desc()).first()
        if not lc:
            continue

        item = {
            "keyword_id": k.id,
            "keyword": k.keyword,
            "domain": k.website.domain if k.website else "",
            "previous_position": lc.previous_position,
            "current_position": lc.current_position,
            "change": lc.change,
            "change_type": lc.change_type
        }

        if lc.change_type == "improved":
            improvements.append(item)
        elif lc.change_type in ("dropped", "lost"):
            drops.append(item)

    improvements.sort(key=lambda x: x["change"], reverse=True)
    drops.sort(key=lambda x: x["change"])

    return {
        "biggest_improvements": improvements[:limit],
        "biggest_drops": drops[:limit]
    }


@router.get("/trends", response_model=List[TrendItem])
def get_analytics_trends(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    days: int = Query(30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Computes daily average position, top 10 count, and top 3 count across the time window.
    """
    kw_query = db.query(Keyword.id).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)
    kw_ids = [row[0] for row in kw_query.all()]

    if not kw_ids:
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(RankingResult)
        .filter(RankingResult.keyword_id.in_(kw_ids), RankingResult.checked_at >= cutoff)
        .order_by(RankingResult.checked_at.asc())
        .all()
    )

    by_date = {}
    for r in results:
        d_str = r.checked_at.strftime("%Y-%m-%d")
        if d_str not in by_date:
            by_date[d_str] = []
        if r.position and r.position <= 100:
            by_date[d_str].append(r.position)

    trends = []
    for d_str in sorted(by_date.keys()):
        pos_list = by_date[d_str]
        if pos_list:
            avg_p = round(sum(pos_list) / len(pos_list), 1)
            t10 = sum(1 for p in pos_list if p <= 10)
            t3 = sum(1 for p in pos_list if p <= 3)
            trends.append({
                "date": d_str,
                "avg_position": avg_p,
                "top_10_count": t10,
                "top_3_count": t3
            })

    return trends


@router.get("/locations", response_model=List[LocationPerformanceItem])
def get_location_performance(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    kw_query = db.query(Keyword).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)

    keywords = kw_query.all()
    loc_map = {}

    for k in keywords:
        loc = k.location or "Global"
        if loc not in loc_map:
            loc_map[loc] = {"total": 0, "top_10": 0, "pos_sum": 0, "pos_count": 0}

        loc_map[loc]["total"] += 1
        lr = db.query(RankingResult).filter(RankingResult.keyword_id == k.id).order_by(RankingResult.checked_at.desc()).first()
        if lr and lr.position and lr.position <= 100:
            loc_map[loc]["pos_sum"] += lr.position
            loc_map[loc]["pos_count"] += 1
            if lr.position <= 10:
                loc_map[loc]["top_10"] += 1

    result = []
    for loc, d in loc_map.items():
        avg_p = round(d["pos_sum"] / d["pos_count"], 1) if d["pos_count"] > 0 else 0.0
        result.append({
            "location": loc,
            "total_keywords": d["total"],
            "top_10_count": d["top_10"],
            "avg_position": avg_p
        })

    result.sort(key=lambda x: x["total_keywords"], reverse=True)
    return result


@router.get("/devices", response_model=List[DevicePerformanceItem])
def get_device_performance(
    brand_id: Optional[int] = Query(None),
    website_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    kw_query = db.query(Keyword).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)

    keywords = kw_query.all()
    dev_map = {
        "desktop": {"total": 0, "top_10": 0, "pos_sum": 0, "pos_count": 0},
        "mobile": {"total": 0, "top_10": 0, "pos_sum": 0, "pos_count": 0}
    }

    for k in keywords:
        dev = k.device.lower() if k.device.lower() in dev_map else "desktop"
        dev_map[dev]["total"] += 1

        lr = db.query(RankingResult).filter(RankingResult.keyword_id == k.id).order_by(RankingResult.checked_at.desc()).first()
        if lr and lr.position and lr.position <= 100:
            dev_map[dev]["pos_sum"] += lr.position
            dev_map[dev]["pos_count"] += 1
            if lr.position <= 10:
                dev_map[dev]["top_10"] += 1

    result = []
    for dev, d in dev_map.items():
        avg_p = round(d["pos_sum"] / d["pos_count"], 1) if d["pos_count"] > 0 else 0.0
        result.append({
            "device": dev.capitalize(),
            "total_keywords": d["total"],
            "top_10_count": d["top_10"],
            "avg_position": avg_p
        })
    return result
