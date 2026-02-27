from fastapi import FastAPI, HTTPException
import aiohttp
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

from app.models.schemas import (
    IdentityCheckRequest,
    IdentityCheckResponse,
    ReputationCheckRequest,
    ReputationCheckResponse,
    IntentAnalysisRequest,
    IntentAnalysisResponse
)
from app.services.identity_service import IdentityService
from app.services.reputation_service import ReputationService
from app.services.intent_service import IntentService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aegis API",
    description="Backend API for Aegis phishing detection system",
    version="1.0.0"
)

# Configure CORS for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",
        "https://mail.google.com",
        "https://outlook.live.com",
        "https://outlook.office.com",
        "https://outlook.office365.com",
        "https://www.linkedin.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ollama_endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")

identity_service = IdentityService()
reputation_service = ReputationService()
intent_service = IntentService(ollama_endpoint=ollama_endpoint)

# Track Ollama availability for health checks
ollama_available = False


@app.on_event("startup")
async def startup_checks():
    """Perform lightweight startup checks (Ollama availability)"""
    global ollama_available
    logger.info("Running startup checks...")
    try:
        async with aiohttp.ClientSession() as session:
            # Try a simple GET to the Ollama base endpoint
            async with session.get(f"{ollama_endpoint}", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                ollama_available = resp.status == 200
    except Exception as e:
        logger.warning(f"Ollama health check failed: {e}")
        ollama_available = False
    logger.info(f"Ollama available: {ollama_available}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Aegis API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "identity": "ready",
            "reputation": "ready",
            "intent": "ready"
        }
    }

# ============================================
# LAYER 1: Identity Check Endpoint
# ============================================

@app.post("/api/check-identity", response_model=IdentityCheckResponse)
async def check_identity(request: IdentityCheckRequest):
    """
    Perform DNS-based identity verification (SPF, DKIM, DMARC)
    """
    try:
        logger.info(f"Identity check requested for domain: {request.domain}")

        result = await identity_service.verify_identity(
            domain=request.domain,
            sender=request.sender
        )

        return IdentityCheckResponse(**result)

    except Exception as e:
        logger.error(f"Identity check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Identity check failed: {str(e)}")

# ============================================
# LAYER 2: Reputation Check Endpoint
# ============================================

@app.post("/api/check-reputation", response_model=ReputationCheckResponse)
async def check_reputation(request: ReputationCheckRequest):
    """
    Analyze URL reputation and domain age
    """
    try:
        logger.info(f"Reputation check requested for {len(request.urls)} URLs")

        result = await reputation_service.analyze_reputation(
            urls=request.urls,
            sender_domain=request.domain
        )

        return ReputationCheckResponse(**result)

    except Exception as e:
        logger.error(f"Reputation check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reputation check failed: {str(e)}")

# ============================================
# LAYER 3: Intent Analysis Endpoint
# ============================================

@app.post("/api/analyze-intent", response_model=IntentAnalysisResponse)
async def analyze_intent(request: IntentAnalysisRequest):
    """
    Perform LLM-based intent analysis for phishing tactics
    """
    try:
        logger.info(f"Intent analysis requested for email: {request.subject[:50]}")

        result = await intent_service.analyze_intent(
            subject=request.subject,
            body=request.body,
            sender=request.sender
        )

        return IntentAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"Intent analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Intent analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
