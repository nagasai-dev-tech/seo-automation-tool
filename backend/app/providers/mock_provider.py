import hashlib
import random
from typing import Optional
from app.providers.base import BaseRankProvider, SERPResult


class MockRankProvider(BaseRankProvider):
    """
    Mock SERP provider for local development, demo, and automated testing.
    Generates realistic SERP positions and metadata deterministically.
    """

    def check_ranking(
        self,
        keyword: str,
        domain: str,
        target_url: Optional[str] = None,
        location: str = "Global",
        country: str = "Global",
        language: str = "en",
        device: str = "desktop",
        search_engine: str = "google"
    ) -> SERPResult:
        # Create deterministic seed from inputs
        seed_str = f"{keyword.lower()}:{domain.lower()}:{location.lower()}:{device.lower()}"
        seed_val = int(hashlib.md5(seed_str.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(seed_val)

        # Baseline position between 1 and 45 for most relevant keywords, or unranked for 5%
        is_unranked = rng.random() < 0.05
        if is_unranked:
            return SERPResult(
                position=101,
                url_found=None,
                title=None,
                snippet=None,
                search_engine=search_engine,
                location=location,
                device=device,
                status="not_found"
            )

        # Base rank: 1 to 35
        base_pos = (seed_val % 35) + 1
        # Random minor fluctuation (-3 to +3)
        drift = random.randint(-2, 2)
        pos = max(1, min(100, base_pos + drift))

        path = target_url or f"https://{domain}/{keyword.lower().replace(' ', '-')}"
        if not path.startswith("http"):
            path = f"https://{domain}{path if path.startswith('/') else '/' + path}"

        title = f"{keyword.title()} | Expert Solutions by {domain}"
        snippet = (
            f"Discover high-performance {keyword} designed to scale your business. "
            f"Official site for {domain} offering top-tier services in {location}."
        )

        return SERPResult(
            position=pos,
            url_found=path,
            title=title,
            snippet=snippet,
            search_engine=search_engine,
            location=location,
            device=device,
            status="success"
        )
