import "./style.css"

function IndexPopup() {
  return (
    <div className="w-80 p-4 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
          <span className="text-white text-xl">🛡️</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SentriPhish</h1>
          <p className="text-xs text-gray-600">Phishing Detection Extension</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Extension active and monitoring your emails.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Protection Layers</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Identity Check</span>
              <span className="text-success-600">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Reputation Analysis</span>
              <span className="text-success-600">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Intent Analysis (LLM)</span>
              <span className="text-success-600">✓ Active</span>
            </div>
          </div>
        </div>

        <button className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Open Settings
        </button>
      </div>
    </div>
  )
}

export default IndexPopup
