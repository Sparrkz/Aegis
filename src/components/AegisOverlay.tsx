import React, { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import type { OverlayState, ScanResult, ExtensionMessage } from "../types"
import { FloatingShield } from "./FloatingShield"
import { SidebarPanel } from "./SidebarPanel"
import styleText from "data-text:../style.css"

const AegisOverlay: React.FC = () => {
  const [state, setState] = useState<OverlayState>({
    isVisible: false,
    isExpanded: false,
    position: { x: window.innerWidth - 80, y: window.innerHeight - 80 },
    isScanning: false
  })

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      if (event.source !== window) return

      const message = event.data
      if (!message.type) return

      switch (message.type) {
        case "SCAN_RESULT":
          setState(prev => ({
            ...prev,
            currentScan: message.payload as ScanResult,
            isScanning: false,
            isExpanded: true
          }))
          break

        case "UPDATE_SCORE":
          setState(prev => ({
            ...prev,
            currentScan: message.payload as ScanResult
          }))
          break

        case "ERROR":
          setState(prev => ({
            ...prev,
            error: message.payload.message,
            isScanning: false
          }))
          break

        case "TOGGLE_OVERLAY":
          setState(prev => ({
            ...prev,
            isExpanded: !prev.isExpanded
          }))
          break
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Load position from storage on mount
  useEffect(() => {
    chrome.storage.local.get(["shieldPosition"], (result) => {
      if (result.shieldPosition) {
        setState(prev => ({
          ...prev,
          position: result.shieldPosition
        }))
      }
    })
  }, [])

  const handleToggle = () => {
    setState(prev => ({
      ...prev,
      isExpanded: !prev.isExpanded
    }))
  }

  const handlePositionChange = (position: { x: number; y: number }) => {
    setState(prev => ({ ...prev, position }))

    // Save position to storage
    chrome.storage.local.set({ shieldPosition: position })
  }

  const handleClose = () => {
    setState(prev => ({ ...prev, isExpanded: false }))
  }

  return (
    <>
      <FloatingShield
        state={state}
        onToggle={handleToggle}
        onPositionChange={handlePositionChange}
      />
      <SidebarPanel
        isVisible={state.isExpanded}
        scanResult={state.currentScan}
        isScanning={state.isScanning}
        error={state.error}
        onClose={handleClose}
      />
    </>
  )
}

// Inject into Shadow DOM
export const mountAegisOverlay = () => {
  // Check if already mounted
  if (document.getElementById("aegis-root")) {
    return
  }

  // Create container
  const container = document.createElement("div")
  container.id = "aegis-root"
  container.style.cssText = "all: initial; position: fixed; z-index: 2147483647;"

  // Attach Shadow DOM
  const shadowRoot = container.attachShadow({ mode: "open" })

  // Create style element
  const style = document.createElement("style")
  style.textContent = styleText
  shadowRoot.appendChild(style)

  // Create React root container
  const reactRoot = document.createElement("div")
  shadowRoot.appendChild(reactRoot)

  // Append to body
  document.body.appendChild(container)

  // Mount React app
  const root = createRoot(reactRoot)
  root.render(<AegisOverlay />)

  console.log("[Aegis] Overlay mounted with Shadow DOM")
}
