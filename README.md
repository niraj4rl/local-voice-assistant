# Voice-Controlled Local AI Agent

A production-grade local AI system that accepts microphone or uploaded audio, transcribes speech, detects intent, executes safe local tools, and visualizes the full pipeline in a modern React UI.

## Features

- Live microphone recording and audio file upload (`.wav`, `.mp3`, `.webm`)
- Local speech-to-text using Whisper (`faster-whisper` preferred)
- Local intent and generation with Ollama (Mistral/Llama models)
- Safe tool execution with output-only filesystem sandbox
- Intent classes:
  - `create_file`
  - `write_code`
  - `summarize_text`
  - `general_chat`
- Interactive dashboard showing:
  - transcription
  - detected intent
  - action taken
  - final output
  - real-time pipeline logs

## Architecture

Audio Input -> STT -> Intent Detection -> Tool Executor -> UI Output

## Project Structure

```text
project/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- api/
|   |-- package.json
|
|-- backend/
|   |-- main.py
|   |-- stt.py
|   |-- intent.py
|   |-- tools.py
|   |-- security.py
|   |-- schemas.py
|   |-- config.py
|   |-- requirements.txt
|
|-- output/
|   |-- .gitkeep
|
|-- models/
|-- README.md
```

## API

### POST `/process-audio`

- Content type: `multipart/form-data`
- Field: `file` (audio blob)

Response:

```json
{
  "transcription": "",
  "intent": "",
  "action": "",
  "output": "",
  "logs": []
}
```

### POST `/process-text` (fallback/developer convenience)

- Content type: `multipart/form-data`
- Field: `text`

## Safety Model

- Files are created only inside `/output`
- Path traversal attempts are blocked
- Filenames are sanitized to snake_case
- Existing files are not overwritten automatically
- If target exists, backend responds with `confirmation_required`

## Setup

## 1. Clone and configure

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

## 2. Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Optional (secondary STT fallback):

```powershell
pip install -r requirements-optional.txt
```

Run backend:

```powershell
cd ..
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## 4. Ollama setup

Install Ollama, then pull a model:

```powershell
ollama pull mistral
```

Start Ollama service and ensure `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `.env` match your setup.

## Model Requirements

### STT Models

- Primary: `faster-whisper`
- Secondary fallback: `openai-whisper`
- Optional remote fallback: configure `USE_STT_API_FALLBACK=true` + `STT_API_URL`

### LLM Models

- Ollama local models (recommended): `mistral`, `llama3`, `qwen2.5`

## Hardware Limitations

- CPU-only environments can run `base` Whisper, but transcription latency can increase
- For faster STT, use a CUDA-compatible GPU and appropriate compute type
- Large local LLMs require significant RAM/VRAM; use smaller models on constrained machines

## Why API Fallback May Be Used

If local STT cannot initialize (missing GPU support, insufficient memory, or unavailable model), API fallback allows continued operation by offloading transcription. This is optional and controlled via `.env`.

## Frontend Design Notes

- GitHub-style dark palette
- Glassmorphism panels
- Smooth entrance and pulse animations
- Responsive 3-panel layout (left controls, center results, right status/logs)

## Example

Input:

> Create a Python file with retry logic

Expected:

- Intent: `write_code`
- Action: `file_created`
- File written to: `/output/generated_python.py`

## Demo Screenshots

Place screenshots in a folder like `docs/screenshots/` and reference them here.

Example markdown snippet:

```md
![Main UI](docs/screenshots/main-ui.png)
![Pipeline Logs](docs/screenshots/pipeline-logs.png)
```

## Production Hardening Suggestions

- Add authentication for API endpoints
- Add explicit user confirmation endpoint for overwrites/deletes
- Add request rate limiting
- Add structured logging and tracing (OpenTelemetry)
- Add unit + integration tests and CI
- Add model health checks and warm-up endpoints
