import React from "react"
import type { ScanResult } from "../types"
import { SentriScore } from "./SentriScore"

interface SidebarPanelProps {
  isVisible: boolean
  scanResult?: ScanResult
  isScanning: boolean
  error?: string
  onClose: () => void
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  isVisible,
  scanResult,
  isScanning,
  error,
  onClose
}) => {
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getLayerBadgeClass = (status: string) => {
    if (status === "verified" || status === "safe") return "verified"
    if (status === "suspicious" || status === "unverified") return "warning"
    return "error"
  }

  return (
    <div className={`sidebar-overlay ${isVisible ? "visible" : "hidden"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xl">🛡️</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">SentriPhish</h2>
            <p className="text-xs text-gray-600">Security Analysis</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          title="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 scroll-content p-4 space-y-4">
        {error ? (
          <div className="scan-card bg-danger-50 border-danger-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-danger-900 mb-1">Error</h3>
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            </div>
          </div>
        ) : isScanning ? (
          <div className="text-center py-12">
            <SentriScore score={0} isScanning={true} />
            <p className="text-gray-600 mt-4">Analyzing email security...</p>
          </div>
        ) : scanResult ? (
          <>
            {/* Overall Score */}
            <div className="scan-card text-center">
              <SentriScore score={scanResult.overallScore} />
              <div className="mt-4 text-xs text-gray-500">
                Scanned {new Date(scanResult.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Identity Layer */}
            <div className="scan-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Identity Check</h3>
                <span
                  className={`layer-badge ${getLayerBadgeClass(
                    scanResult.identity.status
                  )}`}
                >
                  {formatStatus(scanResult.identity.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Domain</span>
                  <span className="font-medium text-gray-900">
                    {scanResult.identity.domain}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">SPF</span>
                  <span className={scanResult.identity.spf ? "text-success-600" : "text-danger-600"}>
                    {scanResult.identity.spf ? "✓ Pass" : "✗ Fail"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">DKIM</span>
                  <span className={scanResult.identity.dkim ? "text-success-600" : "text-danger-600"}>
                    {scanResult.identity.dkim ? "✓ Pass" : "✗ Fail"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">DMARC</span>
                  <span className={scanResult.identity.dmarc ? "text-success-600" : "text-danger-600"}>
                    {scanResult.identity.dmarc ? "✓ Pass" : "✗ Fail"}
                  </span>
                </div>
              </div>
            </div>

            {/* Reputation Layer */}
            <div className="scan-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Reputation Check</h3>
                <span
                  className={`layer-badge ${getLayerBadgeClass(
                    scanResult.reputation.status
                  )}`}
                >
                  {formatStatus(scanResult.reputation.status)}
                </span>
              </div>

              {scanResult.reputation.urls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-2">
                    Found {scanResult.reputation.urls.length} URL(s)
                  </div>
                  {scanResult.reputation.urls.map((urlCheck, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-gray-50 rounded text-xs space-y-1"
                    >
                      <div className="font-mono text-gray-700 truncate">
                        {urlCheck.url}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          Age: {urlCheck.domainAge} days
                        </span>
                        <span
                          className={`layer-badge ${getLayerBadgeClass(
                            urlCheck.reputation
                          )}`}
                        >
                          {formatStatus(urlCheck.reputation)}
                        </span>
                      </div>
                      {urlCheck.reason && (
                        <div className="text-gray-600">{urlCheck.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {scanResult.reputation.flaggedDomains.length > 0 && (
                <div className="mt-3 p-2 bg-warning-50 rounded text-xs">
                  <div className="font-semibold text-warning-900 mb-1">
                    Flagged Domains:
                  </div>
                  <ul className="list-disc list-inside text-warning-700">
                    {scanResult.reputation.flaggedDomains.map((domain, idx) => (
                      <li key={idx}>{domain}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Intent Analysis */}
            <div className="scan-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Intent Analysis</h3>
                <span className="layer-badge verified">
                  Score: {scanResult.intent.riskScore}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">AI Assessment</div>
                  <p className="text-gray-900">{scanResult.intent.reason}</p>
                </div>

                {scanResult.intent.tactics.length > 0 && (
                  <div>
                    <div className="text-gray-600 mb-2">Detected Tactics:</div>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.intent.tactics.map((tactic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                        >
                          {tactic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-xl font-bold text-danger-600">
                      {scanResult.intent.authority}%
                    </div>
                    <div className="text-xs text-gray-600">Authority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-warning-600">
                      {scanResult.intent.urgency}%
                    </div>
                    <div className="text-xs text-gray-600">Urgency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-danger-600">
                      {scanResult.intent.financialPressure}%
                    </div>
                    <div className="text-xs text-gray-600">Financial</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-3 block">🛡️</span>
            <p>No scan data available</p>
            <p className="text-sm mt-2">
              Open an email to begin security analysis
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          Protected by SentriPhish AI Security
        </div>
      </div>
    </div>
  )
}
