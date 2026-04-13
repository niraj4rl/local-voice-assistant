# BozzoAI - Project Overview (2-Minute Explanation)

## What is BozzoAI?

BozzoAI is a **local AI voice assistant** that generates production-ready code just by speaking. It combines cutting-edge AI models with automatic code verification to ensure every piece of generated code is correct, secure, and follows best practices.

## How It Works

**The Flow:**
1. **Speak Your Request** - "Generate a Python function to validate emails"
2. **Local Transcription** - Your voice is converted to text using Whisper (offline, private)
3. **Intent Detection** - AI analyzes what you want (code generation, questions, summaries, etc.)
4. **Code Generation** - Mistral 7B LLM generates production-ready code with comments and best practices
5. **Automatic Verification** - Multi-layer security and syntax checks ensure the code is valid
6. **Save & Report** - Clean code is saved to `/output` with a verification status

## Key Features

**🎙️ Voice-Powered** - Speak naturally, get code instantly. No typing required.

**🔒 100% Private & Offline** - Everything runs locally. Your code never leaves your machine. No cloud dependencies.

**✅ Automatic Verification** - Every generated code is automatically verified for:
- Syntax errors
- Security vulnerabilities (dangerous imports, unsafe functions)
- Code quality issues
- Best practice compliance

**🌐 Multi-Language Support** - Works with Python, JavaScript, TypeScript, C++, C, Java, Go, Rust, HTML, CSS, and more.

**⚡ Production-Ready** - Generated code includes proper comments, error handling, and follows language-specific conventions.

**🎨 Beautiful Interface** - Modern React-based landing page with smooth animations, particle effects, and a liquid glass design.

**💻 CLI & API Tools** - Use the web interface, REST API, or command-line tool. Choose what works for you.

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (lightning-fast builds)
- TailwindCSS (beautiful styling)
- Framer Motion (smooth animations)
- @tsparticles (particle effects)

**Backend:**
- FastAPI (high-performance Python framework)
- Ollama (local LLM runtime)
- Mistral 7B (AI code generation engine)
- faster-whisper (speech-to-text)
- Python 3.12 with async support

**Code Verification:**
- Python AST parsing for syntax validation
- Language-specific compiler checks (g++, javac, etc.)
- Security pattern detection
- Code quality analysis

## Real-World Usage Example

**You Say:** "Create a JavaScript function to filter an array of objects by property"

**BozzoAI Returns:**
```
[OK] Generated JavaScript code
[FILE] Saved to: `/output/filter_array_objects.js`
[TASK] Filter Array Objects
[INFO] This function filters an array of objects by checking if a property matches a given value
[VERIFY] ✅ Valid

// Generated code:
function filterByProperty(array, property, value) {
  return array.filter(item => item[property] === value);
}
```

## Three Ways to Use It

**1. Web Interface** - Open the landing page, click "Get Started", speak your request

**2. REST API** - Send text or audio to `/process-text` or `/process-audio` endpoints
```bash
curl -X POST http://localhost:8000/process-text \
  -F "text=generate python fibonacci function"
```

**3. CLI Tool** - Verify code files from terminal
```bash
python verify.py mycode.py python --execute
```

## Why It's Awesome

✅ **Speeds Up Development** - Generate boilerplate code instantly

✅ **Ensures Quality** - Automatic verification catches errors before they matter

✅ **Improves Security** - Detects dangerous patterns and suggests safe alternatives

✅ **Perfect for Learning** - Students can see correct code patterns with explanations

✅ **Zero Dependencies on Cloud** - Runs completely offline on your machine

✅ **Open Source & Free** - No subscriptions, no limitations, full source code available

## Installation & Setup

1. Clone the repository: `git clone https://github.com/niraj4rl/local-voice-assistant.git`
2. Install dependencies: `pip install -r requirements.txt`
3. Pull the Mistral model: `ollama pull mistral`
4. Run the backend: `python -m uvicorn backend.main:app`
5. Open the frontend: `npm run dev`

That's it! BozzoAI is ready to use.

## Use Cases

- **Developers** - Scaffold code, learn new languages, verify quality
- **Students** - Practice coding, understand patterns, verify assignments
- **Teams** - Maintain code standards, catch vulnerabilities
- **Educators** - Teach coding concepts with AI assistance
- **Prototyping** - Quickly generate working examples

## The Bottom Line

BozzoAI is the future of coding - **faster, smarter, and completely private**. Speak your request, get verified code. No internet required. No privacy concerns. Just pure productivity.

**Try it now. It's free, open source, and waiting on GitHub.**

---

*Total read time: ~2-3 minutes*
