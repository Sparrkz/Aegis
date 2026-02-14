# Aegis - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Ollama and Llama 3 (2 minutes)

```bash
# macOS/Linux
curl https://ollama.ai/install.sh | sh

# Windows: Download from https://ollama.ai

# Pull Llama 3 model
ollama pull llama3

# Verify
ollama list
```

### Step 2: Start Backend (1 minute)

```bash
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
python -m app.main
```

Backend will run at: `http://localhost:8000`

### Step 3: Build Extension (1 minute)

```bash
cd ..  # Back to project root

# Install dependencies (first time only)
npm install

# Build extension
npm run dev
```

### Step 4: Load in Browser (1 minute)

**Chrome/Edge:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` folder

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in `build/firefox-mv3-dev` folder

### Step 5: Test It!

1. Open Gmail, Outlook, or LinkedIn
2. Look for the floating shield icon (bottom-right)
3. Open an email
4. Click the shield to see scan results

## What to Expect

- **First Scan**: May take 5-10 seconds as LLM loads
- **Subsequent Scans**: 2-3 seconds
- **Shield Colors**:
  - Green 🛡️ = Safe
  - Yellow ⚡ = Suspicious
  - Red ⚠️ = Dangerous

## Common Issues

### "Backend connection failed"
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, restart it
cd backend
venv\Scripts\activate  # Windows
python -m app.main
```

### "Unable to analyze intent"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start Ollama
ollama serve

# Verify Llama 3 is downloaded
ollama list
```

### Extension not showing
- Refresh the email page
- Check browser console for errors (F12)
- Verify extension is enabled in browser settings

## Development Tips

### Watch Mode (Auto-reload)
```bash
# Extension (in root directory)
npm run dev

# Backend (in backend directory)
uvicorn app.main:app --reload
```

### View Logs
```bash
# Extension logs
Open browser DevTools (F12) > Console

# Backend logs
Look at terminal where you ran `python -m app.main`

# Ollama logs
Look at terminal where Ollama is running
```

### Test with Sample Email

Open Gmail and compose a test phishing email:

**Subject**: Urgent: Verify Your Account Now!

**Body**:
```
Dear Customer,

We detected suspicious activity on your account. Please verify your identity immediately by clicking the link below:

http://suspicious-site.tk/verify

If you don't verify within 24 hours, your account will be suspended.

Thank you,
Security Team
```

This should trigger:
- **Identity Layer**: Fail (suspicious domain)
- **Reputation Layer**: Dangerous (*.tk TLD, new domain)
- **Intent Layer**: High risk (urgency + authority + suspicious link)

## Next Steps

1. **Customize**: Modify `backend/app/services/` to adjust detection logic
2. **Enhance UI**: Edit `src/components/` for UI changes
3. **Add Features**: Extend email extractors in `src/utils/emailExtractors.ts`
4. **Deploy**: See main README for production deployment guide

## Performance Optimization

### Speed up DNS Lookups
Add caching in `backend/app/services/identity_service.py`:
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
async def check_spf_cached(domain: str) -> bool:
    return await self.check_spf(domain)
```

### Reduce LLM Latency
Use smaller model:
```bash
ollama pull llama3:8b  # Instead of default 70b
```

Update `backend/app/services/intent_service.py`:
```python
self.model = "llama3:8b"
```

## Security Checklist

- ✅ LLM runs locally (no data leaves your machine)
- ✅ Email content is sanitized before analysis
- ✅ PII is removed from logs
- ✅ Shadow DOM prevents host page manipulation
- ✅ CORS restricts backend access

## Getting Help

- Check console logs (browser + backend)
- Review `SETUP_STATUS.md` for detailed status
- Read full documentation in `README.md`
- Check GitHub issues (if published)

## Files You Might Want to Edit

- `src/components/SidebarPanel.tsx` - UI customization
- `backend/app/services/intent_service.py` - LLM prompt tuning
- `src/utils/security.ts` - Sanitization rules
- `tailwind.config.js` - Colors and styling

Happy phishing detection! 🛡️
