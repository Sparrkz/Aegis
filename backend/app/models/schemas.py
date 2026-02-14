from pydantic import BaseModel
from typing import List, Optional

# Request Models
class IdentityCheckRequest(BaseModel):
    domain: str
    sender: str

class ReputationCheckRequest(BaseModel):
    urls: List[str]
    domain: str

class IntentAnalysisRequest(BaseModel):
    subject: str
    body: str
    sender: str

# Response Models
class IdentityCheckResponse(BaseModel):
    verified: bool
    spf: bool
    dkim: bool
    dmarc: bool
    domain: str

class URLCheck(BaseModel):
    url: str
    domainAge: int
    reputation: str  # "safe", "suspicious", "dangerous"
    reason: Optional[str] = None

class ReputationCheckResponse(BaseModel):
    status: str  # "safe", "suspicious", "dangerous"
    urls: List[URLCheck]
    flaggedDomains: List[str]

class IntentAnalysisResponse(BaseModel):
    risk_score: int
    reason: str
    tactics: List[str]
    authority: int
    urgency: int
    financial_pressure: int
