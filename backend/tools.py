from __future__ import annotations

import logging
from pathlib import Path

import requests

from .config import OUTPUT_DIR, settings
from .schemas import IntentPayload
from .security import ensure_path_inside, sanitize_filename

logger = logging.getLogger(__name__)

LANG_EXTENSIONS = {
    "python": ".py",
    "javascript": ".js",
    "typescript": ".ts",
    "java": ".java",
    "go": ".go",
    "rust": ".rs",
    "c": ".c",
    "cpp": ".cpp",
    "html": ".html",
    "css": ".css",
    "json": ".json",
    "markdown": ".md",
}


class ToolExecutor:
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model

    def execute(self, payload: IntentPayload, original_text: str) -> tuple[str, str]:
        intent = payload.intent.strip().lower() or "general_chat"

        if intent == "create_file":
            return self._create_file(payload)

        if intent == "write_code":
            return self._write_code(payload, original_text)

        if intent == "summarize_text":
            return self._summarize(payload.content or original_text)

        return "responded", self._chat(original_text)

    def _create_file(self, payload: IntentPayload) -> tuple[str, str]:
        filename = sanitize_filename(payload.filename or "new_file.txt", default_ext=".txt")
        target = OUTPUT_DIR / filename
        ensure_path_inside(OUTPUT_DIR, target)
        if target.exists():
            return "confirmation_required", f"File already exists: {target.name}. Confirm overwrite to continue."

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(payload.content or "", encoding="utf-8")
        return "file_created", f"Created {target.name} in /output"

    def _write_code(self, payload: IntentPayload, original_text: str) -> tuple[str, str]:
        language = (payload.language or "python").strip().lower()
        extension = LANG_EXTENSIONS.get(language, ".txt")
        default_name = f"generated_{language}{extension}"

        requested_name = payload.filename or default_name
        filename = sanitize_filename(requested_name, default_ext=extension)
        if Path(filename).suffix != extension:
            filename = f"{Path(filename).stem}{extension}"

        target = OUTPUT_DIR / filename
        ensure_path_inside(OUTPUT_DIR, target)
        if target.exists():
            return "confirmation_required", f"File already exists: {target.name}. Confirm overwrite to continue."

        prompt = (
            "Generate production-ready code with concise comments and best practices. "
            f"Language: {language}. User request: {original_text}"
        )
        code = self._chat(prompt)
        if code.startswith("Local LLM unavailable"):
            return "failed", code

        target.write_text(code.strip() + "\n", encoding="utf-8")
        return "file_created", f"Wrote {language} code to /output/{target.name}"

    def _summarize(self, text: str) -> tuple[str, str]:
        if not text.strip():
            return "summarized", "No text was provided to summarize."

        prompt = (
            "Summarize the following text in a concise, useful format with key points:\n\n"
            f"{text.strip()}"
        )
        return "summarized", self._chat(prompt)

    def _chat(self, prompt: str) -> str:
        payload = {"model": self.model, "stream": False, "prompt": prompt}
        try:
            response = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=90)
            response.raise_for_status()
            body = response.json()
            return str(body.get("response", "")).strip() or "No output generated."
        except Exception as exc:
            logger.warning("Ollama call failed: %s", exc)
            return "Local LLM unavailable. Start Ollama and pull the configured model."
