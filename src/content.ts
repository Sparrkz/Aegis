import type { PlasmoCSConfig } from "plasmo"
import { mountSentriPhishOverlay } from "./components/SentriPhishOverlay"
import { getEmailExtractor } from "./utils/emailExtractors"
import { debounce } from "./utils/security"
import type { EmailContent, ExtensionMessage, ScanResult } from "./types"

export const config: PlasmoCSConfig = {
  matches: [
    "https://mail.google.com/*",
    "https://outlook.live.com/*",
    "https://outlook.office365.com/*",
    "https://outlook.office.com/*",
    "https://www.linkedin.com/*"
  ],
  all_frames: false
}

console.log("[SentriPhish] Content script loaded")

// Mount the overlay UI with Shadow DOM
mountSentriPhishOverlay()

// Get the appropriate email extractor for the current site
const extractor = getEmailExtractor()

if (!extractor) {
  console.log("[SentriPhish] No compatible email platform detected")
} else {
  console.log("[SentriPhish] Email extractor initialized")

  // Debounced scan function to avoid excessive API calls
  const scanEmail = debounce(async (email: EmailContent) => {
    console.log("[SentriPhish] Scanning email:", email.subject)

    // Send scanning status to overlay
    window.postMessage(
      {
        type: "SCAN_RESULT",
        payload: null,
        timestamp: Date.now()
      } as ExtensionMessage,
      "*"
    )

    try {
      // Request scan from background script
      const response = await chrome.runtime.sendMessage({
        type: "SCAN_EMAIL",
        payload: email,
        timestamp: Date.now()
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Send result to overlay
      window.postMessage(
        {
          type: "SCAN_RESULT",
          payload: response.result as ScanResult,
          timestamp: Date.now()
        } as ExtensionMessage,
        "*"
      )

      console.log("[SentriPhish] Scan complete. Score:", response.result.overallScore)
    } catch (error) {
      console.error("[SentriPhish] Scan error:", error)

      window.postMessage(
        {
          type: "ERROR",
          payload: {
            message: error instanceof Error ? error.message : "Scan failed"
          },
          timestamp: Date.now()
        } as ExtensionMessage,
        "*"
      )
    }
  }, 1000)

  // Start observing email changes
  extractor.observeChanges((email) => {
    scanEmail(email)
  })

  // Initial scan if email is already loaded
  setTimeout(() => {
    const email = extractor.extractEmail()
    if (email && email.body) {
      scanEmail(email)
    }
  }, 2000)
}

// Listen for manual scan requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CURRENT_EMAIL" && extractor) {
    const email = extractor.extractEmail()
    sendResponse({ email })
    return true
  }
})

export {}
