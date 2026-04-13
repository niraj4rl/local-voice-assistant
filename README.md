# BozzoAI - Voice-Controlled Local AI Agent

A production-grade voice-controlled AI system that accepts microphone or uploaded audio, transcribes speech, detects intent, generates code with explanations, and visualizes the full pipeline in a modern React UI with premium animations.

## ✨ Features

- **Landing Page**: Premium hero section with BozzoAI branding, particle animations, and liquid glass effects
- **Voice Control**: Live microphone recording and audio file upload (`.wav`, `.mp3`, `.webm`)
- **Speech-to-Text**: Local speech-to-text using Whisper (`faster-whisper` preferred)
- **AI Code Generation**: Local intent detection and multi-language code generation with Ollama (Mistral/Llama)
- **Smart Explanations**: Generated code includes automatic explanations shown in chat
- **Safe Execution**: Output-only filesystem sandbox with path traversal prevention
- **UI Features**:
  - Premium landing page with sparkle animations
  - Liquid glass button effects
  - Blue (#3B82F6) accent color scheme
  - Smooth fade transitions and animations
  - Back navigation from chat to landing page
  - Real-time pipeline logs and status updates
  - Responsive 3-panel layout

## 🎯 Supported Intents

- `write_code` - Generate code in any language (Python, JavaScript, HTML, CSS, etc.)
- `create_file` - Create files with specified content
- `general_chat` - General conversational responses
- `summarize_text` - Text summarization

## 🏗️ Architecture

```
Audio Input → Speech-to-Text → Intent Detection → Code Generation → UI Output
                                    ↓
                          LLM-powered explanation
```

## 📁 Project Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BozzoAILanding.tsx    (Premium landing page)
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── InputCard.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SystemStatus.tsx
│   │   │   └── ui/
│   │   │       ├── sparkles.tsx      (Particle animations)
│   │   │       └── ...
│   │   └── api/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── intent.py                     (Enhanced language detection)
│   ├── tools.py                      (Code generation with explanations)
│   ├── stt.py
│   ├── security.py
│   ├── config.py
│   └── requirements.txt
│
├── output/
│   └── .gitkeep
│
└── README.md
```

## 🌐 API Endpoints

### POST `/process-audio`

- Content type: `multipart/form-data`
- Field: `file` (audio blob)

Response:

```json
{
  "transcription": "user's speech",
  "intent": "write_code",
  "action": "file_created",
  "output": "[OK] Generated Python code\n[FILE] Saved to: /output/spell_checker.py\n[TASK] Spell Checker\n[INFO] Creates a spell checker using NLTK...",
  "logs": [...]
}
```

### POST `/process-text`

- Content type: `multipart/form-data`
- Field: `text`

Same response format as `/process-audio`

## 🔒 Security Features

- **Path Traversal Prevention**: All file paths validated and restricted to `/output` directory
- **Filename Sanitization**: Filenames converted to snake_case and validated
- **Safe Code Generation**: LLM-generated code is cleaned before execution
- **Sandbox Execution**: Output-only filesystem access model
- **Input Validation**: All user inputs validated and sanitized
- **Request Verification**: Audio and text inputs validated before processing

## 🚀 Quick Start

### 1. Clone and Configure

```powershell
git clone <repo>
cd "vc controlled ai agent"
Copy-Item .env.example .env
```

### 2. Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### 4. Start Backend

```powershell
cd ..
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 5. Ollama Setup

```powershell
# Install Ollama from https://ollama.ai
ollama pull mistral
# Start Ollama service
ollama serve
```

## 🤖 Model Configuration

### STT Models
- **Primary**: `faster-whisper` (recommended for speed)
- **Fallback**: `openai-whisper`

### LLM Models
- **Recommended**: Ollama local models
  - `mistral` (7B - balanced)
  - `llama2` (7B - fast)
  - `neural-chat` (7B - optimized)

## 🎨 UI/UX Design

- **Color Scheme**: Dark theme (#050505 base, #3B82F6 blue accents)
- **Effects**: 
  - Sparkle particle animations
  - Liquid glass button effects with backdrop blur
  - Smooth fade and slide transitions
  - Responsive animations
- **Landing Page**: Premium hero with centered BozzoAI title, particle effects, and CTA button

## 🔍 Security Check Results

To run security checks:

```powershell
# Python security
pip install bandit
bandit -r backend/

# Node security
cd frontend
npm audit
```

## 📝 Recent Updates (v2.0)

- ✅ Premium landing page with BozzoAI branding
- ✅ Particle animation system for enhanced visuals
- ✅ Liquid glass button effects
- ✅ Enhanced code generation with automatic explanations
- ✅ Back navigation button for seamless UX
- ✅ Improved color scheme consistency (blue accents)
- ✅ HTML/CSS language detection for code generation

## 🧪 Testing

Run tests:

```powershell
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 🎯 Example Usage

**Input**: "Generate a Python spell checker"

**Process**:
1. Audio transcribed: "Generate a Python spell checker"
2. Intent detected: `write_code`
3. Code generated in Python
4. Automatic explanation provided
5. File saved to `/output/`
6. Results displayed in UI with explanation

## 📦 Dependencies

### Backend
- FastAPI
- Faster-Whisper (STT)
- Ollama (LLM)
- Uvicorn

### Frontend
- React 18.3.1
- Vite 5.4
- TailwindCSS 3.4
- Framer Motion
- Lucide React Icons

## 🛣️ Roadmap

- [ ] User authentication
- [ ] Rate limiting
- [ ] Advanced code analysis
- [ ] Multi-language support
- [ ] Real-time collaboration
- [ ] Code execution environment

## 📄 License

MIT

## 👤 Author

Niraj Pachte

---

**Last Updated**: April 14, 2026
