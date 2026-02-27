import asyncio
import dns.resolver
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class IdentityService:
    """
    Layer 1: Identity verification through DNS record checks
    Performs SPF, DKIM, and DMARC validation
    """

    def __init__(self):
        # Use reliable public DNS servers by default to avoid slow corporate resolvers
        self.resolver = dns.resolver.Resolver()
        self.resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
        # reduce timeout/lifetime for faster failure
        self.resolver.timeout = 5.0
        self.resolver.lifetime = 5.0

    async def check_spf(self, domain: str) -> bool:
        """Check if domain has valid SPF record"""
        try:
            answers = self.resolver.resolve(domain, 'TXT')
            for rdata in answers:
                txt_string = str(rdata).strip('"')
                if txt_string.startswith('v=spf1'):
                    logger.info(f"SPF record found for {domain}")
                    return True
            return False
        except Exception as e:
            logger.warning(f"SPF check failed for {domain}: {e}")
            return False

    async def check_dkim(self, domain: str) -> bool:
        """
        Check if domain has DKIM records
        Note: DKIM uses selector-based records, so we check for common selectors
        """
        common_selectors = ['default', 'google', 'k1', 's1', 's2', 'selector1', 'selector2']

        for selector in common_selectors:
            try:
                dkim_domain = f"{selector}._domainkey.{domain}"
                answers = self.resolver.resolve(dkim_domain, 'TXT')
                for rdata in answers:
                    txt_string = str(rdata).strip('"')
                    if 'v=DKIM1' in txt_string or 'k=rsa' in txt_string:
                        logger.info(f"DKIM record found for {domain} with selector {selector}")
                        return True
            except Exception:
                continue

        logger.warning(f"No DKIM records found for {domain}")
        return False

    async def check_dmarc(self, domain: str) -> bool:
        """Check if domain has valid DMARC record"""
        try:
            dmarc_domain = f"_dmarc.{domain}"
            answers = self.resolver.resolve(dmarc_domain, 'TXT')
            for rdata in answers:
                txt_string = str(rdata).strip('"')
                if txt_string.startswith('v=DMARC1'):
                    logger.info(f"DMARC record found for {domain}")
                    return True
            return False
        except Exception as e:
            logger.warning(f"DMARC check failed for {domain}: {e}")
            return False

    # simple in-memory cache to avoid repeated DNS lookups during a session
    _verification_cache: dict[str, Dict[str, any]] = {}

    async def verify_identity(self, domain: str, sender: str) -> Dict[str, any]:
        """
        Perform complete identity verification
        Returns dict with verification results
        """
        logger.info(f"Starting identity verification for domain: {domain}")

        # return cached result if available
        if domain in self._verification_cache:
            logger.debug(f"Using cached identity result for {domain}")
            return self._verification_cache[domain]

        # run checks concurrently with asyncio.gather for faster response
        spf_task = self.check_spf(domain)
        dkim_task = self.check_dkim(domain)
        dmarc_task = self.check_dmarc(domain)

        spf_valid, dkim_valid, dmarc_valid = await asyncio.gather(
            spf_task, dkim_task, dmarc_task
        )

        # Domain is verified if it has at least SPF and DMARC
        verified = spf_valid and dmarc_valid

        result = {
            "verified": verified,
            "spf": spf_valid,
            "dkim": dkim_valid,
            "dmarc": dmarc_valid,
            "domain": domain
        }

        self._verification_cache[domain] = result
        return result
