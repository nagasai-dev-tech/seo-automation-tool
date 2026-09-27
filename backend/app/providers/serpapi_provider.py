import requests
from typing import Optional
from app.providers.base import BaseRankProvider, SERPResult
from app.core.config import settings


class SerpApiProvider(BaseRankProvider):
    """
    SerpApi Google Search API rank provider.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SERPAPI_KEY
        self.base_url = "https://serpapi.com/search"

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
        if not self.api_key:
            return SERPResult(
                status="failed",
                error_message="SerpApi key not configured in environment."
            )

        params = {
            "api_key": self.api_key,
            "engine": search_engine,
            "q": keyword,
            "num": 100,
            "device": "desktop" if device.lower() == "desktop" else "mobile",
            "hl": language or "en",
        }
        if location and location != "Global":
            params["location"] = location

        try:
            resp = requests.get(self.base_url, params=params, timeout=20)
            if resp.status_code != 200:
                return SERPResult(
                    status="failed",
                    error_message=f"SerpApi error HTTP {resp.status_code}: {resp.text}"
                )

            data = resp.json()
            organic_results = data.get("organic_results", [])
            target_clean = domain.lower().replace("http://", "").replace("https://", "").strip("/")
            domain_bare = target_clean.replace("www.", "")

            for result in organic_results:
                link = result.get("link", "")
                link_lower = link.lower()
                if (target_clean and target_clean in link_lower) or (domain_bare and domain_bare in link_lower):
                    return SERPResult(
                        position=result.get("position"),
                        url_found=link,
                        title=result.get("title"),
                        snippet=result.get("snippet"),
                        search_engine=search_engine,
                        location=location,
                        device=device,
                        status="success"
                    )

            return SERPResult(
                position=101,
                status="not_found",
                location=location,
                device=device,
                search_engine=search_engine
            )
        except Exception as e:
            return SERPResult(
                status="failed",
                error_message=f"Exception calling SerpApi: {str(e)}"
            )
