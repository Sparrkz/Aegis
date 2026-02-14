import type { EmailContent } from "../types"

// Base extractor interface
export interface EmailExtractor {
  canExtract(): boolean
  extractEmail(): EmailContent | null
  observeChanges(callback: (email: EmailContent) => void): void
}

// Gmail Extractor
class GmailExtractor implements EmailExtractor {
  canExtract(): boolean {
    return window.location.hostname.includes("mail.google.com")
  }

  extractEmail(): EmailContent | null {
    // Gmail uses dynamic class names, so we use role attributes
    const emailView = document.querySelector('[role="main"]')
    if (!emailView) return null

    try {
      // Extract sender
      const senderElement = emailView.querySelector('[email]')
      const sender = senderElement?.getAttribute("email") || ""
      const senderDomain = sender.split("@")[1] || ""

      // Extract subject
      const subjectElement = emailView.querySelector('h2[data-thread-perm-id]')
      const subject = subjectElement?.textContent?.trim() || ""

      // Extract body
      const bodyElement = emailView.querySelector('[data-message-id] .a3s')
      const body = bodyElement?.textContent?.trim() || ""

      // Extract URLs
      const linkElements = bodyElement?.querySelectorAll("a[href]") || []
      const urls = Array.from(linkElements)
        .map(link => (link as HTMLAnchorElement).href)
        .filter(href => href.startsWith("http"))

      return {
        subject,
        sender,
        senderDomain,
        body,
        urls,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error("[Aegis] Gmail extraction error:", error)
      return null
    }
  }

  observeChanges(callback: (email: EmailContent) => void): void {
    const observer = new MutationObserver(() => {
      const email = this.extractEmail()
      if (email && email.body) {
        callback(email)
      }
    })

    // Observe main content area
    const mainContent = document.querySelector('[role="main"]')
    if (mainContent) {
      observer.observe(mainContent, {
        childList: true,
        subtree: true
      })
    }
  }
}

// Outlook Extractor
class OutlookExtractor implements EmailExtractor {
  canExtract(): boolean {
    const hostname = window.location.hostname
    return (
      hostname.includes("outlook.live.com") ||
      hostname.includes("outlook.office.com") ||
      hostname.includes("outlook.office365.com")
    )
  }

  extractEmail(): EmailContent | null {
    try {
      // Outlook Web App uses specific data attributes
      const readingPane = document.querySelector('[role="region"][aria-label*="Reading pane"]')
      if (!readingPane) return null

      // Extract sender
      const senderElement = readingPane.querySelector('[data-convid]')
      const sender = senderElement?.getAttribute("title") || ""
      const senderDomain = sender.split("@")[1] || ""

      // Extract subject
      const subjectElement = readingPane.querySelector('[role="heading"]')
      const subject = subjectElement?.textContent?.trim() || ""

      // Extract body
      const bodyElement = readingPane.querySelector('[role="document"]')
      const body = bodyElement?.textContent?.trim() || ""

      // Extract URLs
      const linkElements = readingPane.querySelectorAll("a[href]") || []
      const urls = Array.from(linkElements)
        .map(link => (link as HTMLAnchorElement).href)
        .filter(href => href.startsWith("http"))

      return {
        subject,
        sender,
        senderDomain,
        body,
        urls,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error("[Aegis] Outlook extraction error:", error)
      return null
    }
  }

  observeChanges(callback: (email: EmailContent) => void): void {
    const observer = new MutationObserver(() => {
      const email = this.extractEmail()
      if (email && email.body) {
        callback(email)
      }
    })

    // Observe reading pane
    const readingPane = document.querySelector('[role="region"]')
    if (readingPane) {
      observer.observe(readingPane, {
        childList: true,
        subtree: true
      })
    }
  }
}

// LinkedIn Extractor (for messaging)
class LinkedInExtractor implements EmailExtractor {
  canExtract(): boolean {
    return window.location.hostname.includes("linkedin.com")
  }

  extractEmail(): EmailContent | null {
    try {
      const messageThread = document.querySelector('[class*="msg-thread"]')
      if (!messageThread) return null

      // Extract sender
      const senderElement = messageThread.querySelector('[class*="msg-s-message-list-item__link"]')
      const sender = senderElement?.textContent?.trim() || "LinkedIn User"
      const senderDomain = "linkedin.com"

      // Extract latest message as subject
      const messageElements = messageThread.querySelectorAll('[class*="msg-s-event-listitem__body"]')
      const latestMessage = messageElements[messageElements.length - 1]
      const subject = "LinkedIn Message"

      // Extract body
      const body = latestMessage?.textContent?.trim() || ""

      // Extract URLs
      const linkElements = latestMessage?.querySelectorAll("a[href]") || []
      const urls = Array.from(linkElements)
        .map(link => (link as HTMLAnchorElement).href)
        .filter(href => href.startsWith("http"))

      return {
        subject,
        sender,
        senderDomain,
        body,
        urls,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error("[Aegis] LinkedIn extraction error:", error)
      return null
    }
  }

  observeChanges(callback: (email: EmailContent) => void): void {
    const observer = new MutationObserver(() => {
      const email = this.extractEmail()
      if (email && email.body) {
        callback(email)
      }
    })

    // Observe message thread
    const messageArea = document.querySelector('[class*="msg-thread"]')
    if (messageArea) {
      observer.observe(messageArea, {
        childList: true,
        subtree: true
      })
    }
  }
}

// Factory function to get the appropriate extractor
export function getEmailExtractor(): EmailExtractor | null {
  const extractors = [
    new GmailExtractor(),
    new OutlookExtractor(),
    new LinkedInExtractor()
  ]

  for (const extractor of extractors) {
    if (extractor.canExtract()) {
      return extractor
    }
  }

  return null
}
