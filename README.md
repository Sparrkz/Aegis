# Aegis - AI-Powered Phishing Detection Extension

A production-ready browser extension that detects phishing using multi-layer technical checks and LLM-based intent analysis.

## Features

- **Cross-Browser Compatibility**: Works on Chrome, Firefox, Edge, and Safari
- **Multi-Layer Detection**:
  - **Identity Layer**: DNS lookups (SPF, DKIM, DMARC) for sender verification
  - **Reputation Layer**: URL checking against reputation services and domain age analysis
  - **Intent Layer**: Local LLM analysis (Llama 3 via Ollama) for phishing tactics detection
- **Privacy-First**: All LLM processing runs locally, no PII logging
- **Modern UI**: React + Tailwind CSS with Shadow DOM isolation
- **Real-Time Protection**: Monitors Gmail, Outlook, and LinkedIn

## Architecture

- **Frontend**: Plasmo framework with React + Tailwind CSS
- **Backend**: FastAPI (Python) for heavy logic and LLM orchestration
- **AI**: Local Llama 3 instance via Ollama API (localhost:11434)
- **Cross-Browser**: WebExtensions API with `browser.*` polyfills

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Ollama with Llama 3 model installed

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Package extension
npm run package
```

### Backend Setup

The backend is fully implemented with all three scanning layers:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m app.main

# Or use uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start at `http://localhost:8000`. Visit http://localhost:8000/docs for interactive API documentation.

#### Backend Features

- **Identity Service** (c:\Users\EMINS\Desktop\projects\Detector\backend\app\services\identity_service.py): DNS-based verification (SPF, DKIM, DMARC)
- **Reputation Service** (c:\Users\EMINS\Desktop\projects\Detector\backend\app\services\reputation_service.py): URL analysis and domain age checking
- **Intent Service** (c:\Users\EMINS\Desktop\projects\Detector\backend\app\services\intent_service.py): LLM integration with prompt injection protection

### Ollama Setup

```bash
# Install Ollama from https://ollama.ai/

# Pull Llama 3 model
ollama pull llama3

# Verify it's running
curl http://localhost:11434/api/tags
```

## Project Structure

```
aegis/
├── src/
│   ├── background/              # Background service worker
│   │   └── index.ts             # Multi-layer scan orchestrator
│   ├── components/              # React UI components
│   │   ├── FloatingShield.tsx   # Draggable shield icon
│   │   ├── AegisScore.tsx      # Circular risk gauge
│   │   ├── SidebarPanel.tsx     # Detailed results sidebar
│   │   └── AegisOverlay.tsx # Main Shadow DOM overlay
│   ├── utils/                   # Utility functions
│   │   ├── emailExtractors.ts   # Gmail/Outlook/LinkedIn scrapers
│   │   └── security.ts          # Sanitization & PII removal
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Interfaces for all data types
│   ├── popup.tsx                # Extension popup UI
│   ├── content.ts               # Content script entry point
│   └── style.css                # Global Tailwind styles
├── backend/                     # FastAPI backend (FULLY IMPLEMENTED)
│   ├── app/
│   │   ├── services/
│   │   │   ├── identity_service.py    # DNS/SPF/DKIM/DMARC checks
│   │   │   ├── reputation_service.py  # URL analysis & domain age
│   │   │   └── intent_service.py      # LLM integration
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic models
│   │   └── main.py              # FastAPI application
│   └── requirements.txt         # Python dependencies
├── assets/                      # Extension icons (placeholders)
├── package.json                 # Node dependencies and manifest config
├── tsconfig.json                # TypeScript configuration
└── tailwind.config.js           # Tailwind CSS configuration with animations
```

## Implementation Status

### ✅ Completed Features

1. **Extension Frontend**
   - Cross-browser Plasmo setup with TypeScript
   - Shadow DOM overlay for UI isolation
   - Floating shield icon with drag-and-drop
   - Circular AegisScore gauge
   - Detailed sidebar with all layer results
   - Email extractors for Gmail, Outlook, LinkedIn

2. **Security & Privacy**
   - Input sanitization (removes HTML, JS, prevents prompt injection)
   - PII removal (emails, phones, credit cards)
   - Local-only processing
   - No external API calls

3. **Backend API**
   - FastAPI server with CORS configuration
   - Identity Layer: DNS lookups (SPF, DKIM, DMARC)
   - Reputation Layer: URL safety, domain age, suspicious TLD detection
   - Intent Layer: Llama 3 integration via Ollama
   - Weighted risk score calculation

4. **Multi-Layer Scanning**
   - Parallel execution of all three layers
   - Configurable layer enable/disable
   - Error handling with graceful degradation
   - Real-time results via message passing

### ⚠️ Production Readiness Notes

- **Icon Assets**: Placeholder PNGs are used. For production, create proper 128x128px icons.
- **VirusTotal Integration**: Current reputation layer uses local checks. Add VirusTotal API for enhanced detection.
- **Rate Limiting**: Add throttling to prevent abuse
- **Caching**: Implement DNS result caching to reduce latency
- **Monitoring**: Add telemetry and error tracking

## How to Use

1. **Install Extension**: Load the unpacked extension in your browser
2. **Start Backend**: Run `python -m app.main` in the backend directory
3. **Start Ollama**: Ensure Ollama is running with Llama 3 loaded
4. **Open Email**: Navigate to Gmail, Outlook, or LinkedIn
5. **View Results**: Click the floating shield icon to see scan details

### Understanding the UI

- **Shield Color**:
  - 🛡️ Green: Low risk (score 0-39)
  - ⚡ Yellow: Medium risk (score 40-69)
  - ⚠️ Red: High risk (score 70-100)
  - ⏳ Blue (pulsing): Scanning in progress

- **Sidebar Sections**:
  - **Identity Check**: Shows SPF/DKIM/DMARC status
  - **Reputation Check**: Lists all URLs with risk levels
  - **Intent Analysis**: AI-powered phishing tactic detection

## API Endpoints

### GET /health
Health check endpoint

### POST /api/check-identity
Verify sender identity via DNS

**Request**:
```json
{
  "domain": "example.com",
  "sender": "user@example.com"
}
```

### POST /api/check-reputation
Analyze URLs and domain reputation

**Request**:
```json
{
  "urls": ["https://example.com"],
  "domain": "example.com"
}
```

### POST /api/analyze-intent
LLM-based phishing intent analysis

**Request**:
```json
{
  "subject": "Urgent: Account Verification",
  "body": "Click here to verify...",
  "sender": "noreply@example.com"
}
```

## Troubleshooting

### Extension not detecting emails
- Check browser console for errors
- Verify content script is injected
- Ensure you're on a supported platform (Gmail/Outlook/LinkedIn)

### Backend connection failed
- Verify backend is running: `curl http://localhost:8000/health`
- Check CORS headers include your email domain
- Ensure firewall allows localhost connections

### Ollama errors
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check Llama 3 is downloaded: `ollama list`
- Restart Ollama if needed: `ollama serve`

## Permissions

The extension requires the following permissions:

- `storage`: Store user preferences and scan results
- `tabs`: Access active tab information
- `activeTab`: Interact with the current webpage
- `scripting`: Inject content scripts
- **Host Permissions**:
  - Gmail: `https://mail.google.com/*`
  - Outlook: `https://outlook.live.com/*`, `https://outlook.office365.com/*`, `https://outlook.office.com/*`
  - LinkedIn: `https://www.linkedin.com/*`
  - Local APIs: `http://localhost:8000/*`, `http://localhost:11434/*`

## Security Features

1. **Input Sanitization**: All HTML/JavaScript stripped before LLM processing
2. **Privacy Protection**: No PII logged or transmitted
3. **Local Processing**: LLM runs entirely on local machine
4. **Shadow DOM Isolation**: UI cannot be manipulated by host websites

## AegisScore

The extension calculates a risk score (0-100) based on:

- **Authority**: Detection of impersonation attempts
- **Urgency**: Identification of pressure tactics
- **Financial Pressure**: Recognition of monetary scams

## Browser Support

- Chrome/Edge: Manifest V3
- Firefox: Manifest V2/V3 (automatic via Plasmo)
- Safari: Requires Xcode wrapper for App Store distribution

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines first.
