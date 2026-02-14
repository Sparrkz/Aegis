export interface ScanResult {
  riskScore: number
  identityLayer: IdentityCheck
  reputationLayer: ReputationCheck
  intentLayer: IntentAnalysis
  timestamp: number
}

export interface IdentityCheck {
  status: "verified" | "unverified" | "failed"
  spf: boolean
  dkim: boolean
  dmarc: boolean
  domain: string
}

export interface ReputationCheck {
  status: "safe" | "suspicious" | "dangerous"
  urls: URLCheck[]
  flaggedDomains: string[]
}

export interface URLCheck {
  url: string
  domainAge: number
  reputation: "safe" | "suspicious" | "dangerous"
  reason?: string
}

export interface IntentAnalysis {
  riskScore: number
  reason: string
  tactics: string[]
  authority: number
  urgency: number
  financialPressure: number
}

export interface EmailContent {
  subject: string
  sender: string
  senderDomain: string
  body: string
  urls: string[]
  timestamp: number
}

export interface AegisConfig {
  apiEndpoint: string
  ollamaEndpoint: string
  enabledLayers: {
    identity: boolean
    reputation: boolean
    intent: boolean
  }
}

// Message types for extension communication
export type MessageType =
  | "SCAN_EMAIL"
  | "SCAN_RESULT"
  | "TOGGLE_OVERLAY"
  | "UPDATE_SCORE"
  | "GET_CURRENT_EMAIL"
  | "ERROR"

export interface ExtensionMessage<T = any> {
  type: MessageType
  payload: T
  timestamp: number
}

// UI State
export interface OverlayState {
  isVisible: boolean
  isExpanded: boolean
  position: { x: number; y: number }
  currentScan?: ScanResult
  isScanning: boolean
  error?: string
}
