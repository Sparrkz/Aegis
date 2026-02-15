import whois
import logging
from datetime import datetime, timezone
from typing import List, Dict
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class ReputationService:
    """
    Layer 2: URL and domain reputation analysis
    Checks domain age and flags suspicious URLs
    """

    def __init__(self):
        # Known malicious TLDs and patterns
        self.suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top']
        self.suspicious_keywords = ['verify', 'account', 'suspended', 'urgent', 'confirm', 'update', 'secure']

    async def get_domain_age(self, domain_or_url: str) -> int:
        """
        Get domain age in days
        Returns 0 if unable to determine
        """
        try:
            # Extract domain if a URL was passed
            domain = domain_or_url
            if '://' in domain:
                domain = urlparse(domain).netloc
            
            # Remove port if present
            domain = domain.split(':')[0]
            
            # For subdomains, we should check the root domain
            # Very basic approach: take the last two parts
            parts = domain.split('.')
            if len(parts) > 2:
                # Handle cases like .co.uk if needed, but for now just take last 2
                # A better approach would be using tldextract
                search_domain = '.'.join(parts[-2:])
            else:
                search_domain = domain

            logger.info(f"Querying WHOIS for {search_domain}")
            w = whois.whois(search_domain)

            if isinstance(w.creation_date, list):
                creation_date = w.creation_date[0]
            else:
                creation_date = w.creation_date

            if creation_date:
                # Ensure creation_date is a datetime object
                if isinstance(creation_date, datetime):
                    age_days = (datetime.now(timezone.utc) - creation_date.replace(tzinfo=timezone.utc)).days
                    logger.info(f"Domain {domain} age: {age_days} days")
                    return max(0, age_days)

            return 0
        except Exception as e:
            logger.warning(f"Failed to get domain age for {domain}: {e}")
            return 0

    def is_suspicious_url(self, url: str) -> tuple[bool, str]:
        """
        Check if URL has suspicious characteristics
        Returns (is_suspicious, reason)
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            path = parsed.path.lower()

            # Check for suspicious TLD
            for tld in self.suspicious_tlds:
                if domain.endswith(tld):
                    return True, f"Suspicious TLD: {tld}"

            # Check for suspicious keywords in path
            for keyword in self.suspicious_keywords:
                if keyword in path:
                    return True, f"Suspicious keyword in URL: {keyword}"

            # Check for IP address instead of domain
            if any(char.isdigit() for char in domain.replace('.', '')):
                parts = domain.split('.')
                if len(parts) == 4 and all(part.isdigit() for part in parts):
                    return True, "IP address used instead of domain"

            # Check for excessive subdomains (possible typosquatting)
            subdomain_count = domain.count('.')
            if subdomain_count > 3:
                return True, "Excessive subdomains"

            return False, "No issues detected"

        except Exception as e:
            logger.warning(f"Error analyzing URL {url}: {e}")
            return False, "Analysis failed"

    async def check_url_reputation(self, url: str) -> Dict[str, any]:
        """
        Perform reputation check on a single URL
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc

            # Get domain age
            domain_age = await self.get_domain_age(domain)

            # Check if URL is suspicious
            is_suspicious, reason = self.is_suspicious_url(url)

            # Determine reputation
            if is_suspicious:
                reputation = "dangerous"
            elif domain_age > 0 and domain_age < 30:
                reputation = "suspicious"
                reason = f"Recently registered domain ({domain_age} days old)"
            elif domain_age > 0 and domain_age < 90:
                reputation = "suspicious"
                reason = f"Relatively new domain ({domain_age} days old)"
            else:
                reputation = "safe"
                reason = "No issues detected"

            return {
                "url": url,
                "domainAge": domain_age,
                "reputation": reputation,
                "reason": reason if reputation != "safe" else None
            }

        except Exception as e:
            logger.error(f"Failed to check reputation for {url}: {e}")
            return {
                "url": url,
                "domainAge": 0,
                "reputation": "safe",
                "reason": "Check failed"
            }

    async def analyze_reputation(self, urls: List[str], sender_domain: str) -> Dict[str, any]:
        """
        Analyze reputation of all URLs in an email
        Returns overall status and flagged domains
        """
        logger.info(f"Analyzing reputation for {len(urls)} URLs")

        url_checks = []
        flagged_domains = []
        max_risk = "safe"

        for url in urls:
            check_result = await self.check_url_reputation(url)
            url_checks.append(check_result)

            # Track flagged domains
            if check_result["reputation"] in ["suspicious", "dangerous"]:
                parsed = urlparse(url)
                domain = parsed.netloc
                if domain not in flagged_domains:
                    flagged_domains.append(domain)

            # Update max risk level
            if check_result["reputation"] == "dangerous":
                max_risk = "dangerous"
            elif check_result["reputation"] == "suspicious" and max_risk != "dangerous":
                max_risk = "suspicious"

        return {
            "status": max_risk,
            "urls": url_checks,
            "flaggedDomains": flagged_domains
        }
