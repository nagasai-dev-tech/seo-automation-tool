import base64
import requests
from typing import Optional
from app.providers.base import BaseRankProvider, SERPResult
from app.core.config import settings


class DataForSEOProvider(BaseRankProvider):
    """
    DataForSEO SERP API integration (v3 SERP API).
    """

    def __init__(self, login: Optional[str] = None, password: Optional[str] = None):
        self.login = login or settings.DATAFORSEO_LOGIN
        self.password = password or settings.DATAFORSEO_PASSWORD
        self.base_url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"

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
        if not self.login or not self.password:
            return SERPResult(
                status="failed",
                error_message="DataForSEO credentials (login/password) not configured in environment."
            )

        cred_bytes = f"{self.login}:{self.password}".encode("utf-8")
        auth_header = "Basic " + base64.b64encode(cred_bytes).decode("utf-8")

        payload = [{
            "keyword": keyword,
            "location_name": location if location != "Global" else "United States",
            "language_code": language or "en",
            "device": device.lower(),
            "os": "windows" if device.lower() == "desktop" else "android",
            "depth": 100
        }]

        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }

        try:
            resp = requests.post(self.base_url, json=payload, headers=headers, timeout=20)
            if resp.status_code != 200:
                return SERPResult(
                    status="failed",
                    error_message=f"DataForSEO error HTTP {resp.status_code}: {resp.text}"
                )

            data = resp.json()
            tasks = data.get("tasks", [])
            if not tasks or not tasks[0].get("result"):
                return SERPResult(
                    position=101,
                    status="not_found",
                    location=location,
                    device=device,
                    search_engine=search_engine
                )

            items = tasks[0]["result"][0].get("items", [])
            target_clean = domain.lower().replace("http://", "").replace("https://", "").strip("/")

            for item in items:
                if item.get("type") == "organic":
                    item_url = item.get("url", "")
                    if target_clean in item_url.lower():
                        return SERPResult(
                            position=item.get("rank_absolute") or item.get("rank_group"),
                            url_found=item_url,
                            title=item.get("title"),
                            snippet=item.get("description"),
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
                error_message=f"Exception calling DataForSEO: {str(e)}"
            )
