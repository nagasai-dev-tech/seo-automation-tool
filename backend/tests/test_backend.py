import pytest
from app.services.ranking_engine import calculate_ranking_change, generate_ranking_alerts
from app.models.models import Keyword, Website, Brand
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token


def test_password_hashing():
    pwd = "SecurePassword123!"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token():
    email = "test@aventionseo.com"
    token = create_access_token(email)
    decoded = decode_access_token(token)
    assert decoded == email


def test_ranking_change_calculation():
    # Improved: 15 -> 8
    diff, chg_type = calculate_ranking_change(15, 8)
    assert diff == 7
    assert chg_type == "improved"

    # Dropped: 5 -> 14
    diff, chg_type = calculate_ranking_change(5, 14)
    assert diff == -9
    assert chg_type == "dropped"

    # Unchanged: 8 -> 8
    diff, chg_type = calculate_ranking_change(8, 8)
    assert diff == 0
    assert chg_type == "unchanged"

    # New: no previous
    diff, chg_type = calculate_ranking_change(None, 10)
    assert chg_type == "new"

    # Lost: was 10, now unranked (101)
    diff, chg_type = calculate_ranking_change(10, 101)
    assert chg_type == "lost"

    # Gained from unranked to 12
    diff, chg_type = calculate_ranking_change(101, 12)
    assert chg_type == "improved"


def test_ranking_alerts_generation():
    fake_site = Website(domain="testsite.com")
    fake_kw = Keyword(id=1, keyword="enterprise erp", website=fake_site)

    # 1. Dropped 5+ positions
    alerts = generate_ranking_alerts(fake_kw, previous_position=4, current_position=11)
    alert_types = [a.type for a in alerts]
    assert "rank_drop_5" in alert_types
    assert "out_of_top_10" in alert_types

    # 2. Entered Top 3
    alerts_top3 = generate_ranking_alerts(fake_kw, previous_position=8, current_position=2)
    types_top3 = [a.type for a in alerts_top3]
    assert "entered_top_3" in types_top3

    # 3. Completely lost ranking
    alerts_lost = generate_ranking_alerts(fake_kw, previous_position=15, current_position=None)
    types_lost = [a.type for a in alerts_lost]
    assert "lost_ranking" in types_lost
