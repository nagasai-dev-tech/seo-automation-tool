from typing import Optional
from app.providers.base import BaseRankProvider, SERPResult
from app.providers.mock_provider import MockRankProvider
from app.providers.dataforseo_provider import DataForSEOProvider
from app.providers.serpapi_provider import SerpApiProvider
from app.core.config import settings


def get_rank_provider(provider_name: Optional[str] = None) -> BaseRankProvider:
    provider = (provider_name or settings.RANK_PROVIDER or "mock").lower()
    if provider == "dataforseo":
        return DataForSEOProvider()
    elif provider == "serpapi":
        return SerpApiProvider()
    else:
        return MockRankProvider()


__all__ = [
    "BaseRankProvider",
    "SERPResult",
    "MockRankProvider",
    "DataForSEOProvider",
    "SerpApiProvider",
    "get_rank_provider",
]
