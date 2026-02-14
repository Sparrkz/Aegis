import React from "react"

interface SentriScoreProps {
  score: number
  isScanning?: boolean
}

export const SentriScore: React.FC<SentriScoreProps> = ({ score, isScanning = false }) => {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 70) return "danger"
    if (score >= 40) return "warning"
    return "safe"
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return "High Risk"
    if (score >= 40) return "Medium Risk"
    return "Low Risk"
  }

  const scoreColor = getScoreColor(score)
  const riskLevel = getRiskLevel(score)

  return (
    <div className="risk-gauge">
      <svg className="w-full h-full" viewBox="0 0 140 140">
        {/* Background Circle */}
        <circle
          className="gauge-bg"
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="12"
          stroke="currentColor"
        />

        {/* Progress Circle */}
        <circle
          className={`gauge-progress gauge-circle ${scoreColor} ${isScanning ? 'animate-pulse' : ''}`}
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="12"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      {/* Center Score Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isScanning ? (
          <div className="text-center">
            <div className="text-gray-400 text-sm font-medium animate-pulse">
              Scanning...
            </div>
          </div>
        ) : (
          <>
            <div className="text-4xl font-bold text-gray-900">{score}</div>
            <div className={`text-sm font-medium mt-1 text-${scoreColor}-600`}>
              {riskLevel}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
