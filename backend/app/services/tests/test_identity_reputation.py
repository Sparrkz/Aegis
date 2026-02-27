import asyncio
import pytest

from app.services.identity_service import IdentityService
from app.services.reputation_service import ReputationService


def test_identity_cache_and_parallel(monkeypatch):
    svc = IdentityService()
    # monkeypatch DNS resolver methods to simulate fast results
    async def fake_check(domain):
        await asyncio.sleep(0)
        return True

    monkeypatch.setattr(svc, "check_spf", fake_check)
    monkeypatch.setattr(svc, "check_dkim", fake_check)
    monkeypatch.setattr(svc, "check_dmarc", fake_check)

    result1 = asyncio.run(svc.verify_identity("example.com", "sender@example.com"))
    result2 = asyncio.run(svc.verify_identity("example.com", "sender@example.com"))

    assert result1 == result2
    assert result1["verified"]


def test_reputation_whois_fallback(monkeypatch):
    svc = ReputationService()
    # simulate absence of whois module or attribute
    monkeypatch.setattr(svc, "_age_cache", {})
    # monkeypatch global whois to None
    import app.services.reputation_service as mod
    monkeypatch.setattr(mod, "whois", None)

    age = asyncio.run(svc.get_domain_age("example.com"))
    assert age == 0
