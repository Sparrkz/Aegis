// Sanitize text for LLM to prevent indirect prompt injection
export function sanitizeForLLM(text: string): string {
  if (!text) return ""

  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, "")

  // Remove JavaScript protocol URLs
  sanitized = sanitized.replace(/javascript:/gi, "")

  // Remove data URLs
  sanitized = sanitized.replace(/data:text\/html[^,]*,/gi, "")

  // Remove potential prompt injection patterns
  sanitized = sanitized.replace(/(?:ignore|disregard)\s+(?:previous|all)\s+(?:instructions?|commands?)/gi, "[FILTERED]")
  sanitized = sanitized.replace(/system\s*:\s*/gi, "[FILTERED]")
  sanitized = sanitized.replace(/\b(?:sudo|admin|root)\b\s+mode/gi, "[FILTERED]")

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim()

  // Limit length to prevent token exhaustion
  const MAX_LENGTH = 4000
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + "..."
  }

  return sanitized
}

// Remove PII from text
export function removePII(text: string): string {
  if (!text) return ""

  let cleaned = text

  // Remove email addresses
  cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")

  // Remove phone numbers (various formats)
  cleaned = cleaned.replace(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[PHONE]")

  // Remove credit card numbers
  cleaned = cleaned.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD]")

  // Remove SSN
  cleaned = cleaned.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]")

  return cleaned
}

// Extract and validate URLs from text
export function extractURLs(text: string): string[] {
  if (!text) return []

  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi
  const matches = text.match(urlRegex) || []

  // Deduplicate and validate
  const urls = [...new Set(matches)].filter(url => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })

  return urls
}

// Extract domain from email address
export function extractDomain(email: string): string {
  const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  return match ? match[1].toLowerCase() : ""
}

// Check if domain age is suspicious (< 30 days)
export function isDomainRecent(domainAge: number): boolean {
  return domainAge < 30
}

// Calculate overall risk score from layer results
export function calculateOverallScore(
  identityScore: number,
  reputationScore: number,
  intentScore: number
): number {
  // Weighted average: Intent 40%, Reputation 35%, Identity 25%
  const weights = {
    identity: 0.25,
    reputation: 0.35,
    intent: 0.40
  }

  const overall =
    identityScore * weights.identity +
    reputationScore * weights.reputation +
    intentScore * weights.intent

  return Math.round(overall)
}

// Convert identity check status to risk score
export function identityToScore(verified: boolean, spf: boolean, dkim: boolean, dmarc: boolean): number {
  if (verified && spf && dkim && dmarc) return 0 // Perfect
  if (!verified || (!spf && !dkim)) return 100 // Very suspicious
  if (!dmarc) return 30 // Missing DMARC only
  return 50 // Some failures
}

// Convert reputation status to risk score
export function reputationToScore(status: string, flaggedCount: number): number {
  if (status === "dangerous" || flaggedCount > 2) return 100
  if (status === "suspicious" || flaggedCount > 0) return 70
  return 0
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
