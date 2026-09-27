import os
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Report, Brand, Website, Keyword, RankingResult, RankingChange, Alert
from app.services.pdf_generator import generate_seo_pdf_report
from app.services.email_service import send_weekly_seo_email


def build_report_data_for_brand(
    db: Session,
    brand_id: Optional[int] = None,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None
) -> Dict[str, Any]:
    if not period_end:
        period_end = datetime.now(timezone.utc)
    if not period_start:
        period_start = period_end - timedelta(days=7)

    # Keywords query
    kw_query = db.query(Keyword).join(Website)
    if brand_id:
        kw_query = kw_query.filter(Website.brand_id == brand_id)
    keywords = kw_query.all()
    kw_ids = [k.id for k in keywords]

    total_keywords = len(keywords)
    tracked_keywords = 0
    top_3 = 0
    top_10 = 0
    top_20 = 0
    top_50 = 0
    top_100 = 0
    not_ranking = 0
    pos_sum = 0
    pos_count = 0

    improved_count = 0
    dropped_count = 0
    unchanged_count = 0

    top_improvements = []
    top_drops = []

    for kw in keywords:
        # Latest result
        latest_res = (
            db.query(RankingResult)
            .filter(RankingResult.keyword_id == kw.id)
            .order_by(RankingResult.checked_at.desc())
            .first()
        )
        # Latest change
        latest_chg = (
            db.query(RankingChange)
            .filter(RankingChange.keyword_id == kw.id)
            .order_by(RankingChange.checked_at.desc())
            .first()
        )

        pos = latest_res.position if latest_res else None
        if pos and pos <= 100:
            tracked_keywords += 1
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

        if latest_chg:
            if latest_chg.change_type == "improved":
                improved_count += 1
                top_improvements.append({
                    "keyword_id": kw.id,
                    "keyword": kw.keyword,
                    "domain": kw.website.domain if kw.website else "",
                    "previous_position": latest_chg.previous_position,
                    "current_position": latest_chg.current_position,
                    "change": latest_chg.change
                })
            elif latest_chg.change_type in ("dropped", "lost"):
                dropped_count += 1
                top_drops.append({
                    "keyword_id": kw.id,
                    "keyword": kw.keyword,
                    "domain": kw.website.domain if kw.website else "",
                    "previous_position": latest_chg.previous_position,
                    "current_position": latest_chg.current_position,
                    "change": latest_chg.change
                })
            else:
                unchanged_count += 1

    avg_pos = round(pos_sum / pos_count, 1) if pos_count > 0 else 0.0

    # Sort improvements and drops
    top_improvements.sort(key=lambda x: x["change"], reverse=True)
    top_drops.sort(key=lambda x: x["change"])

    # Website breakdown
    web_query = db.query(Website)
    if brand_id:
        web_query = web_query.filter(Website.brand_id == brand_id)
    websites = web_query.all()
    website_stats = []
    for w in websites:
        w_kws = [k for k in keywords if k.website_id == w.id]
        w_count = len(w_kws)
        w_top10 = 0
        w_pos_sum = 0
        w_pos_c = 0
        w_imp = 0
        w_drp = 0
        for wk in w_kws:
            lr = db.query(RankingResult).filter(RankingResult.keyword_id == wk.id).order_by(RankingResult.checked_at.desc()).first()
            lc = db.query(RankingChange).filter(RankingChange.keyword_id == wk.id).order_by(RankingChange.checked_at.desc()).first()
            if lr and lr.position and lr.position <= 100:
                w_pos_sum += lr.position
                w_pos_c += 1
                if lr.position <= 10:
                    w_top10 += 1
            if lc:
                if lc.change_type == "improved":
                    w_imp += 1
                elif lc.change_type in ("dropped", "lost"):
                    w_drp += 1

        website_stats.append({
            "domain": w.domain,
            "keyword_count": w_count,
            "avg_position": round(w_pos_sum / w_pos_c, 1) if w_pos_c > 0 else None,
            "top_10_count": w_top10,
            "improved_count": w_imp,
            "dropped_count": w_drp
        })

    # Recent alerts
    alerts_query = db.query(Alert).filter(Alert.created_at >= period_start)
    if kw_ids:
        alerts_query = alerts_query.filter(Alert.keyword_id.in_(kw_ids))
    recent_alerts_objs = alerts_query.order_by(Alert.created_at.desc()).limit(10).all()
    recent_alerts = [
        {"severity": a.severity, "message": a.message, "created_at": a.created_at.isoformat()}
        for a in recent_alerts_objs
    ]

    # Generate factual observations (no hallucinated SEO data)
    recommendations = []
    if improved_count > 0:
        recommendations.append(f"{improved_count} keywords improved their ranking positions this week.")
    if top_10 > 0:
        recommendations.append(f"{top_10} keywords are currently ranking within the Google Top 10.")
    if top_3 > 0:
        recommendations.append(f"{top_3} keywords hold high-value Top 3 positions.")
    if dropped_count > 0:
        recommendations.append(f"{dropped_count} keywords experienced downward movement or dropped positions.")
    if not_ranking > 0:
        recommendations.append(f"{not_ranking} keywords currently rank outside the top 100 and need on-page optimization.")

    brand_name = "All Brands"
    if brand_id:
        b_obj = db.query(Brand).filter(Brand.id == brand_id).first()
        if b_obj:
            brand_name = b_obj.name

    kpi_data = {
        "total_keywords": total_keywords,
        "tracked_keywords": tracked_keywords,
        "top_3": top_3,
        "top_10": top_10,
        "top_20": top_20,
        "top_50": top_50,
        "top_100": top_100,
        "not_ranking": not_ranking,
        "improved": improved_count,
        "dropped": dropped_count,
        "unchanged": unchanged_count,
        "average_position": avg_pos
    }

    return {
        "brand_id": brand_id,
        "brand_name": brand_name,
        "period_start": period_start,
        "period_end": period_end,
        "kpi_data": kpi_data,
        "top_improvements": top_improvements,
        "top_drops": top_drops,
        "website_stats": website_stats,
        "recent_alerts": recent_alerts,
        "recommendations": recommendations
    }


def create_weekly_report(
    db: Session,
    brand_id: Optional[int] = None,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None
) -> Report:
    """
    Builds data, generates PDF, creates Report DB entry, and sends email.
    """
    data = build_report_data_for_brand(db, brand_id, period_start, period_end)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    brand_slug = f"brand_{brand_id}" if brand_id else "all_brands"
    filename = f"seo_report_{brand_slug}_{timestamp}.pdf"
    
    reports_dir = os.path.join(os.getcwd(), "uploads", "reports")
    pdf_path = os.path.join(reports_dir, filename)

    generate_seo_pdf_report(
        output_path=pdf_path,
        brand_name=data["brand_name"],
        period_start=data["period_start"],
        period_end=data["period_end"],
        kpi_data=data["kpi_data"],
        top_improvements=data["top_improvements"],
        top_drops=data["top_drops"],
        website_stats=data["website_stats"],
        recent_alerts=data["recent_alerts"],
        recommendations=data["recommendations"]
    )

    report = Report(
        brand_id=brand_id,
        report_type="weekly",
        period_start=data["period_start"],
        period_end=data["period_end"],
        file_url=f"/api/reports/download/{filename}",
        data_json=json.dumps(data, default=str),
        created_at=datetime.now(timezone.utc)
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Trigger email dispatch
    send_weekly_seo_email(
        brand_name=data["brand_name"],
        kpi_data=data["kpi_data"],
        pdf_path=pdf_path
    )

    return report


def generate_weekly_reports_all_brands(db: Session):
    """
    Generates reports for all brands plus an aggregate report.
    """
    create_weekly_report(db, brand_id=None)
    brands = db.query(Brand).filter(Brand.status == "active").all()
    for b in brands:
        create_weekly_report(db, brand_id=b.id)
