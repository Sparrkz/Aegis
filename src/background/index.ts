import Browser from "webextension-polyfill"
import type {
  EmailContent,
  ScanResult,
  IdentityCheck,
  ReputationCheck,
  IntentAnalysis,
  SentriPhishConfig
} from "../types"
import {
  sanitizeForLLM,
  removePII,
  calculateOverallScore,
  identityToScore,
  reputationToScore
} from "../utils/security"

console.log("[SentriPhish] Background service worker initialized")

// Default configuration
const DEFAULT_CONFIG: SentriPhishConfig = {
  apiEndpoint: "http://localhost:8000",
  ollamaEndpoint: "http://localhost:11434",
  enabledLayers: {
    identity: true,
    reputation: true,
    intent: true
  }
}

// Get configuration from storage
async function getConfig(): Promise<SentriPhishConfig> {
  const result = await Browser.storage.local.get(["config"])
  return { ...DEFAULT_CONFIG, ...result.config }
}

// ============================================
// LAYER 1: Identity Check (DNS, SPF, DKIM, DMARC)
// ============================================

async function performIdentityCheck(email: EmailContent): Promise<IdentityCheck> {
  console.log("[SentriPhish] Performing identity check for:", email.senderDomain)

  try {
    const config = await getConfig()

    // Call backend API for DNS lookups
    const response = await fetch(`${config.apiEndpoint}/api/check-identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: email.senderDomain,
        sender: email.sender
      })
    })

    if (!response.ok) {
      throw new Error(`Identity check failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      status: data.verified ? "verified" : "unverified",
      spf: data.spf || false,
      dkim: data.dkim || false,
      dmarc: data.dmarc || false,
      domain: email.senderDomain
    }
  } catch (error) {
    console.error("[SentriPhish] Identity check error:", error)

    // Return unverified on error (backend might not be running)
    return {
      status: "failed",
      spf: false,
      dkim: false,
      dmarc: false,
      domain: email.senderDomain
    }
  }
}

// ============================================
// LAYER 2: Reputation Check (URL Analysis)
// ============================================

async function performReputationCheck(email: EmailContent): Promise<ReputationCheck> {
  console.log("[SentriPhish] Performing reputation check. URLs found:", email.urls.length)

  try {
    const config = await getConfig()

    // Call backend API for URL reputation checks
    const response = await fetch(`${config.apiEndpoint}/api/check-reputation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: email.urls,
        domain: email.senderDomain
      })
    })

    if (!response.ok) {
      throw new Error(`Reputation check failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      status: data.status || "safe",
      urls: data.urls || [],
      flaggedDomains: data.flaggedDomains || []
    }
  } catch (error) {
    console.error("[SentriPhish] Reputation check error:", error)

    // Return safe default on error
    return {
      status: "safe",
      urls: email.urls.map(url => ({
        url,
        domainAge: 0,
        reputation: "safe",
        reason: "Check failed"
      })),
      flaggedDomains: []
    }
  }
}

// ============================================
// LAYER 3: Intent Analysis (LLM)
// ============================================

async function performIntentAnalysis(email: EmailContent): Promise<IntentAnalysis> {
  console.log("[SentriPhish] Performing intent analysis with LLM")

  try {
    const config = await getConfig()

    // Sanitize email body for LLM (prevent prompt injection)
    const sanitizedBody = sanitizeForLLM(email.body)
    const cleanedBody = removePII(sanitizedBody)

    // Call backend API which orchestrates LLM via Ollama
    const response = await fetch(`${config.apiEndpoint}/api/analyze-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: email.subject,
        body: cleanedBody,
        sender: email.sender
      })
    })

    if (!response.ok) {
      throw new Error(`Intent analysis failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      riskScore: data.risk_score || 0,
      reason: data.reason || "Analysis complete",
      tactics: data.tactics || [],
      authority: data.authority || 0,
      urgency: data.urgency || 0,
      financialPressure: data.financial_pressure || 0
    }
  } catch (error) {
    console.error("[SentriPhish] Intent analysis error:", error)

    // Return safe default on error
    return {
      riskScore: 0,
      reason: "Unable to analyze intent - backend unavailable",
      tactics: [],
      authority: 0,
      urgency: 0,
      financialPressure: 0
    }
  }
}

// ============================================
// CENTRALIZED SCAN ORCHESTRATOR
// ============================================

async function scanEmail(email: EmailContent): Promise<ScanResult> {
  console.log("[SentriPhish] Starting multi-layer scan for email:", email.subject)

  const config = await getConfig()

  // Run all three layers in parallel for performance
  const [identity, reputation, intent] = await Promise.all([
    config.enabledLayers.identity
      ? performIdentityCheck(email)
      : Promise.resolve({
          status: "verified" as const,
          spf: true,
          dkim: true,
          dmarc: true,
          domain: email.senderDomain
        }),

    config.enabledLayers.reputation
      ? performReputationCheck(email)
      : Promise.resolve({
          status: "safe" as const,
          urls: [],
          flaggedDomains: []
        }),

    config.enabledLayers.intent
      ? performIntentAnalysis(email)
      : Promise.resolve({
          riskScore: 0,
          reason: "Intent analysis disabled",
          tactics: [],
          authority: 0,
          urgency: 0,
          financialPressure: 0
        })
  ])

  // Convert layer results to scores
  const identityScore = identityToScore(
    identity.status === "verified",
    identity.spf,
    identity.dkim,
    identity.dmarc
  )

  const reputationScore = reputationToScore(
    reputation.status,
    reputation.flaggedDomains.length
  )

  const intentScore = intent.riskScore

  // Calculate overall weighted score
  const overallScore = calculateOverallScore(identityScore, reputationScore, intentScore)

  const result: ScanResult = {
    riskScore: overallScore,
    identityLayer: identity,
    reputationLayer: reputation,
    intentLayer: intent,
    timestamp: Date.now()
  }

  console.log("[SentriPhish] Scan complete. Overall score:", overallScore)

  return result
}

// ============================================
// MESSAGE HANDLERS
// ============================================

Browser.runtime.onMessage.addListener(async (message, sender) => {
  console.log("[SentriPhish] Received message:", message.type)

  if (message.type === "SCAN_EMAIL") {
    try {
      const email = message.payload as EmailContent
      const result = await scanEmail(email)

      return { result }
    } catch (error) {
      console.error("[SentriPhish] Scan failed:", error)
      return {
        error: error instanceof Error ? error.message : "Scan failed"
      }
    }
  }

  return { error: "Unknown message type" }
})

// Listen for installation
Browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("[SentriPhish] Extension installed")

    // Set default configuration
    await Browser.storage.local.set({ config: DEFAULT_CONFIG })
  }
})

export {}
