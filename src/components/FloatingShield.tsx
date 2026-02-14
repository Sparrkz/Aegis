import React, { useState, useRef, useEffect } from "react"
import type { OverlayState } from "../types"

interface FloatingShieldProps {
  state: OverlayState
  onToggle: () => void
  onPositionChange: (position: { x: number; y: number }) => void
}

export const FloatingShield: React.FC<FloatingShieldProps> = ({
  state,
  onToggle,
  onPositionChange
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const shieldRef = useRef<HTMLDivElement>(null)

  const getShieldClass = () => {
    if (state.isScanning) return "scanning"
    if (!state.currentScan) return "safe"

    const score = state.currentScan.overallScore
    if (score >= 70) return "danger"
    if (score >= 40) return "warning"
    return "safe"
  }

  const getShieldIcon = () => {
    if (state.isScanning) return "⏳"
    if (!state.currentScan) return "🛡️"

    const score = state.currentScan.overallScore
    if (score >= 70) return "⚠️"
    if (score >= 40) return "⚡"
    return "✓"
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return

    const rect = shieldRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    const maxX = window.innerWidth - 56
    const maxY = window.innerHeight - 56

    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))

    onPositionChange({ x: clampedX, y: clampedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onToggle()
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
    <div
      ref={shieldRef}
      className={`shield-button ${getShieldClass()}`}
      style={{
        left: `${state.position.x}px`,
        top: `${state.position.y}px`,
        cursor: isDragging ? "grabbing" : "grab"
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="SentriPhish - Click to view scan results"
    >
      <span className="select-none">{getShieldIcon()}</span>

      {/* Score Badge */}
      {state.currentScan && !state.isScanning && (
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md
                     flex items-center justify-center text-xs font-bold text-gray-900
                     border-2 border-current"
        >
          {state.currentScan.overallScore}
        </div>
      )}
    </div>
  )
}
