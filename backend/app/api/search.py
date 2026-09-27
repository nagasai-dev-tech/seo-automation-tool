from typing import List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Keyword, Website, Brand, User
from app.schemas.schemas import SearchResultItem
from app.api.deps import get_current_user

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=List[SearchResultItem])
def global_search(
    q: str = Query(..., min_length=1),
    limit: int = 15,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    term = f"%{q.strip()}%"
    results: List[SearchResultItem] = []

    # 1. Keywords
    kws = db.query(Keyword).filter(Keyword.keyword.ilike(term)).limit(limit).all()
    for k in kws:
        results.append(SearchResultItem(
            type="keyword",
            id=k.id,
            title=k.keyword,
            subtitle=f"{k.website.domain if k.website else ''} ({k.location})",
            url=f"/keywords/{k.id}"
        ))

    # 2. Websites
    sites = db.query(Website).filter(Website.domain.ilike(term) | Website.name.ilike(term)).limit(limit).all()
    for s in sites:
        results.append(SearchResultItem(
            type="website",
            id=s.id,
            title=s.name or s.domain,
            subtitle=f"Domain: {s.domain} • Brand: {s.brand.name if s.brand else ''}",
            url=f"/websites"
        ))

    # 3. Brands
    brands = db.query(Brand).filter(Brand.name.ilike(term) | Brand.slug.ilike(term)).limit(limit).all()
    for b in brands:
        results.append(SearchResultItem(
            type="brand",
            id=b.id,
            title=b.name,
            subtitle=f"Slug: {b.slug}",
            url=f"/brands"
        ))

    # 4. Landing Pages
    lps = db.query(Keyword).filter(Keyword.landing_page_url.ilike(term)).limit(limit).all()
    for lp in lps:
        results.append(SearchResultItem(
            type="landing_page",
            id=lp.id,
            title=lp.landing_page_url,
            subtitle=f"Keyword: {lp.keyword} • {lp.website.domain if lp.website else ''}",
            url=f"/keywords/{lp.id}"
        ))

    return results[:limit]
