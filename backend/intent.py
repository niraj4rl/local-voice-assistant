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
3) If ambiguous, use intent=general_chat.
4) filename should be empty unless intent is create_file or write_code.
5) language should be set only for write_code when detectable.
6) content should contain the requested text/code payload when clear.
"""


def _heuristic_fallback(user_text: str) -> IntentPayload:
    text = user_text.lower().strip()

    if any(keyword in text for keyword in ["summarize", "summary", "tl;dr"]):
        return IntentPayload(intent="summarize_text", content=user_text)

    if any(keyword in text for keyword in ["create file", "new file", "make file"]):
        return IntentPayload(intent="create_file", filename="notes.txt", content="")

    if any(keyword in text for keyword in ["write code", "python", "javascript", "function", "class"]):
        language = "python" if "python" in text else "javascript" if "javascript" in text else ""
        return IntentPayload(intent="write_code", filename="generated_code", content=user_text, language=language)

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
