# Ollama LLM Integration (Development / Staging)

This document describes how the Aegis backend integrates with a local Ollama instance for LLM-based intent analysis.

Prerequisites
- Ollama installed and running (default: `http://localhost:11434`)
- Model pulled locally, e.g. `gpt-oss:latest`
- Python dependencies installed (see `requirements.txt`)

Configuration
- Set environment variables in `.env` or your environment:
  - `OLLAMA_ENDPOINT` (default `http://localhost:11434`)
  - `OLLAMA_MODEL` (default `gpt-oss:latest`)

Running the backend (development)
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Running tests
```bash
pip install -r requirements-dev.txt
pytest -q
```

Notes for production-like development
- The app performs a lightweight Ollama connectivity check at startup and reports status in `/health`.
- Keep `OLLAMA_MODEL` pinned for reproducible behavior.
- Consider running Ollama behind a reverse proxy with TLS for staging environments.
