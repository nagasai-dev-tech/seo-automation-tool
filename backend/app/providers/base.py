from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel


class SERPResult(BaseModel):
    position: Optional[int] = None  # 1 to 100, or None / 101 for not found
    url_found: Optional[str] = None
    title: Optional[str] = None
    snippet: Optional[str] = None
    search_engine: str = "google"
    location: Optional[str] = None
    device: Optional[str] = None
    status: str = "success"  # success, not_found, failed
    error_message: Optional[str] = None


class BaseRankProvider(ABC):
    """
    Abstract Base Class for SERP rank tracking providers.
    """

    @abstractmethod
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
        """
        Check ranking for a keyword on target domain / URL.
        """
        pass
