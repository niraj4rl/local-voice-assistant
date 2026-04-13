from __future__ import annotations

import json
import logging
import re
from typing import Any

import requests

from .config import settings
from .schemas import IntentPayload

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an intent classifier for a local AI tool executor.
Classify the user text into exactly one intent from:
- create_file
- write_code
- summarize_text
- general_chat

Rules:
1) Return valid JSON only.
2) Use this schema exactly:
{
  \"intent\": \"\",
  \"filename\": \"\",
  \"content\": \"\",
  \"language\": \"\"
}
3) Be AGGRESSIVE about detecting write_code: If user asks to generate, write, create, or build code/scripts/functions/classes/apps/apis in ANY language, use write_code.
4) filename should be empty unless intent is create_file or write_code.
5) For write_code: filename MUST be a descriptive task name (snake_case).
   - Examples: fibonacci_calculator, todo_app, api_server, data_parser
   - Extract key nouns from the request
   - Do NOT use generic names like "generated_code" or "script"
6) language should be auto-detected from patterns (python, javascript, java, rust, go, c, cpp).
7) content should contain the requested text/code payload when clear.
8) KEYWORDS FOR write_code: generate + code, write + code, create + code, build + code, make + code.
"""


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _looks_like_code_request(text: str) -> bool:
    action_words = [
        "write",
        "create",
        "generate",
        "build",
        "make",
        "implement",
        "code",
        "script",
    ]
    code_keywords = [
        "code",
        "script",
        "program",
        "function",
        "class",
        "app",
        "api",
        "python",
        "javascript",
        "typescript",
        "java",
        "go",
        "rust",
        "c",
        "cpp",
        "html",
        "css",
        "sql",
    ]
    
    # If text contains action word AND code keyword, it's a code request
    has_action = _contains_any(text, action_words)
    has_code_keyword = _contains_any(text, code_keywords)
    
    # Strong case: has both
    if has_action and has_code_keyword:
        return True
    
    # Also match patterns like "generate code", "write code", etc. with just "code"
    if (("generate" in text or "write" in text or "create" in text or "build" in text or "make" in text) and 
        ("code" in text or "script" in text or "app" in text or "api" in text)):
        return True
    
    return False


def _extract_task_name(text: str) -> str:
    """Extract a meaningful task name from user text.
    
    Examples:
    - 'write a c program to calculate fibonacci' -> 'fibonacci_calculator'
    - 'create a function to sort array' -> 'sort_array'
    - 'generate code for todo app' -> 'todo_app'
    """
    # Remove common action words
    action_words = ["write", "create", "generate", "build", "make", "implement", 
                    "a ", "to ", "for ", "that ", "which "]
    
    # Remove code-related words
    code_words = ["code", "script", "program", "function", "class", "app", "application",
                  "python", "javascript", "typescript", "java", "go", "rust", "c", "cpp",
                  "in ", "using "]
    
    cleaned = text.lower().strip()
    for word in action_words + code_words:
        cleaned = cleaned.replace(word, " ")
    
    # Extract first few meaningful words
    words = [w for w in cleaned.split() if len(w) > 2]
    if not words:
        words = cleaned.split()
    
    task_name = "_".join(words[:4])  # Use first 4 words
    # Remove special characters, keep only alphanumeric and underscores
    task_name = re.sub(r'[^a-z0-9_]', '', task_name)
    task_name = re.sub(r'_+', '_', task_name)  # Collapse multiple underscores
    task_name = task_name.strip('_')  # Remove leading/trailing underscores
    
    return task_name or "code"


def _heuristic_fallback(user_text: str) -> IntentPayload:
    text = user_text.lower().strip()

    if _contains_any(text, ["summarize", "summary", "tl;dr"]):
        return IntentPayload(intent="summarize_text", content=user_text)

    if _contains_any(text, ["create file", "new file", "make file"]):
        return IntentPayload(intent="create_file", filename="notes.txt", content="")

    if _looks_like_code_request(text):
        # Auto-detect language from text
        if "python" in text:
            language = "python"
        elif "html" in text or "webpage" in text:
            language = "html"
        elif "css" in text:
            language = "css"
        elif "javascript" in text or " js" in text or " js " in text:
            language = "javascript"
        elif "java" in text and "javascript" not in text:
            language = "java"
        elif "typescript" in text:
            language = "typescript"
        elif "cpp" in text or "c++" in text:
            language = "cpp"
        elif "rust" in text:
            language = "rust"
        elif "go" in text and " golang" not in text:
            language = "go"
        elif " c " in text or text.startswith("c "):
            language = "c"
        else:
            language = "python"  # Default to Python
        
        task_name = _extract_task_name(user_text)
        return IntentPayload(intent="write_code", filename=task_name, content=user_text, language=language)

    return IntentPayload(intent="general_chat", content=user_text)


class IntentAnalyzer:
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model

    def analyze(self, user_text: str) -> IntentPayload:
        fast_path = _heuristic_fallback(user_text)
        if fast_path.intent != "general_chat":
            return fast_path

        payload = {
            "model": self.model,
            "stream": False,
            "prompt": f"{SYSTEM_PROMPT}\n\nUser text:\n{user_text}\n\nReturn JSON only.",
            "options": {
                "temperature": 0,
                "num_predict": settings.ollama_intent_max_tokens,
            },
        }

        try:
            response = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=45)
            response.raise_for_status()
            body = response.json()
            raw = str(body.get("response", "")).strip()
            parsed = self._extract_json(raw)
            if parsed:
                return IntentPayload(**parsed)
        except Exception as exc:
            logger.warning("Ollama intent detection failed, using heuristic fallback: %s", exc)

        return _heuristic_fallback(user_text)

    def _extract_json(self, raw: str) -> dict[str, Any] | None:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            return None

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
