from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.models import Keyword, RankingResult, RankingChange, Alert
from app.providers import get_rank_provider, BaseRankProvider


def calculate_ranking_change(
    previous_position: Optional[int],
    current_position: Optional[int]
) -> Tuple[int, str]:
    """
    Computes position change and change_type.
    change = previous_position - current_position
    Positive change means rank improved (e.g. 15 -> 8 is +7).
    Negative change means rank dropped (e.g. 5 -> 14 is -9).
    """
    # If no previous check existed at all
    if previous_position is None:
        return (0, "new")

    # Treat unranked/not found as 101
    prev_pos = previous_position if previous_position <= 100 else 101
    curr_pos = current_position if (current_position is not None and current_position <= 100) else 101

    if prev_pos <= 100 and curr_pos > 100:
        return (prev_pos - curr_pos, "lost")

    if prev_pos > 100 and curr_pos <= 100:
        return (prev_pos - curr_pos, "improved")

    if prev_pos > 100 and curr_pos > 100:
        return (0, "unchanged")

    diff = prev_pos - curr_pos
    if diff > 0:
        change_type = "improved"
    elif diff < 0:
        change_type = "dropped"
    else:
        change_type = "unchanged"

    return (diff, change_type)


def generate_ranking_alerts(
    keyword: Keyword,
    previous_position: Optional[int],
    current_position: Optional[int]
) -> List[Alert]:
    """
    Evaluates ranking changes and generates appropriate alerts.
    """
    alerts = []
    kw_text = keyword.keyword
    domain = keyword.website.domain if keyword.website else "website"

    prev = previous_position if (previous_position and previous_position <= 100) else None
    curr = current_position if (current_position and current_position <= 100) else None

    # 1. Stopped ranking / lost completely
    if prev is not None and curr is None:
        alerts.append(Alert(
            keyword_id=keyword.id,
            type="lost_ranking",
            message=f'Keyword "{kw_text}" completely lost its ranking on {domain} (previously #{prev}).',
            severity="critical"
        ))
        return alerts

    # 2. Entered Top 3
    if curr is not None and curr <= 3 and (prev is None or prev > 3):
        alerts.append(Alert(
            keyword_id=keyword.id,
            type="entered_top_3",
            message=f'Keyword "{kw_text}" reached Top 3 (now #{curr}) on {domain}!',
            severity="info"
        ))

    # 3. Entered Top 10
    elif curr is not None and curr <= 10 and (prev is None or prev > 10):
        alerts.append(Alert(
            keyword_id=keyword.id,
            type="entered_top_10",
            message=f'Keyword "{kw_text}" entered Top 10 (now #{curr}) on {domain}!',
            severity="info"
        ))

    # 4. Dropped out of Top 10
    if prev is not None and prev <= 10 and (curr is None or curr > 10):
        alerts.append(Alert(
            keyword_id=keyword.id,
            type="out_of_top_10",
            message=f'Keyword "{kw_text}" dropped out of Top 10 (was #{prev}, now #{curr or "Not Ranking"}).',
            severity="critical"
        ))

    # 5. Dropped out of Top 20
    elif prev is not None and prev <= 20 and (curr is None or curr > 20):
        alerts.append(Alert(
            keyword_id=keyword.id,
            type="out_of_top_20",
            message=f'Keyword "{kw_text}" dropped out of Top 20 (was #{prev}, now #{curr or "Not Ranking"}).',
            severity="warning"
        ))

    # 6. Dropped by 5+ positions
    if prev is not None and curr is not None:
        drop = curr - prev
        if drop >= 5:
            severity = "critical" if drop >= 10 else "warning"
            alerts.append(Alert(
                keyword_id=keyword.id,
                type="rank_drop_5",
                message=f'Keyword "{kw_text}" dropped by {drop} positions from #{prev} to #{curr}.',
                severity=severity
            ))

    return alerts


def process_keyword_ranking(
    db: Session,
    keyword: Keyword,
    provider: Optional[BaseRankProvider] = None
) -> Tuple[RankingResult, RankingChange, List[Alert]]:
    """
    Executes a rank check for a single keyword, records the result, calculates change,
    and creates alerts if criteria are met.
    """
    if not provider:
        provider = get_rank_provider()

    domain = keyword.website.domain if keyword.website else ""
    target_url = keyword.target_url or keyword.landing_page_url

    # Perform check
    serp_result = provider.check_ranking(
        keyword=keyword.keyword,
        domain=domain,
        target_url=target_url,
        location=keyword.location,
        country=keyword.country,
        language=keyword.language,
        device=keyword.device,
        search_engine=keyword.search_engine
    )

    now = datetime.now(timezone.utc)

    # Get most recent previous result
    latest_result = (
        db.query(RankingResult)
        .filter(RankingResult.keyword_id == keyword.id)
        .order_by(RankingResult.checked_at.desc())
        .first()
    )
    prev_pos = latest_result.position if latest_result else None

    # Create new RankingResult
    curr_pos = serp_result.position
    rank_res = RankingResult(
        keyword_id=keyword.id,
        checked_at=now,
        position=curr_pos,
        url_found=serp_result.url_found,
        title=serp_result.title,
        snippet=serp_result.snippet,
        search_engine=keyword.search_engine,
        location=keyword.location,
        device=keyword.device,
        status=serp_result.status
    )
    db.add(rank_res)

    # Compute change
    change_val, change_type = calculate_ranking_change(prev_pos, curr_pos)
    rank_change = RankingChange(
        keyword_id=keyword.id,
        previous_position=prev_pos,
        current_position=curr_pos,
        change=change_val,
        checked_at=now,
        change_type=change_type
    )
    db.add(rank_change)

    # Check for alerts
    alerts = generate_ranking_alerts(keyword, prev_pos, curr_pos)
    for alert in alerts:
        db.add(alert)

    db.commit()
    db.refresh(rank_res)
    db.refresh(rank_change)

    return (rank_res, rank_change, alerts)
