from __future__ import annotations

import logging
import re
from pathlib import Path

import requests

from .config import OUTPUT_DIR, settings
from .schemas import IntentPayload
from .security import ensure_path_inside, sanitize_filename
from .verification import CodeVerifier

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

LANG_DISPLAY_NAMES = {
    "cpp": "C++",
    "c": "C",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "python": "Python",
    "java": "Java",
    "go": "Go",
    "rust": "Rust",
    "html": "HTML",
    "css": "CSS",
}


class ToolExecutor:
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.verifier = CodeVerifier()

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
        from .intent import _extract_task_name  # Import the extraction function
        
        language = (payload.language or "python").strip().lower()
        language_label = LANG_DISPLAY_NAMES.get(language, language.title())
        extension = LANG_EXTENSIONS.get(language, ".txt")

        # Determine filename: use extracted task name if filename is generic or empty
        requested_name = payload.filename or "code"
        
        # If filename is generic (just "code" or starts with "generated_"), extract from original text
        if requested_name in ("code", "generated_code") or requested_name.startswith("generated_"):
            requested_name = _extract_task_name(original_text)
        
        filename = sanitize_filename(requested_name, default_ext=extension)
        if Path(filename).suffix != extension:
            filename = f"{Path(filename).stem}{extension}"

        target = OUTPUT_DIR / filename
        ensure_path_inside(OUTPUT_DIR, target)
        if target.exists():
            target = self._next_available_path(target)

        prompt = (
            "Generate production-ready code with concise comments and best practices. "
            f"Language: {language}. User request: {original_text}"
        )
        code = self._chat(prompt, num_predict=max(settings.ollama_response_max_tokens, 900))
        if code.startswith("Local LLM unavailable"):
            code = self._generate_fallback_code(language, original_text)
            cleaned_code = self._clean_generated_code(code, language)
            target.write_text(cleaned_code, encoding="utf-8")
            task_desc = Path(target.stem).name
            return "file_created_fallback", f"[!] LLM unavailable - using fallback\n[OK] Generated {language_label} code\n[FILE] Saved to: `/output/{target.name}`\n[TASK] {task_desc.replace('_', ' ').title()}"

        cleaned_code = self._clean_generated_code(code, language)

        # Verify generated code and try to auto-recover if model output looks cut off.
        verification_result = self.verifier.verify(cleaned_code, language, execute=False)
        cleaned_code, verification_result = self._recover_if_truncated(
            cleaned_code,
            language,
            original_text,
            verification_result,
        )
        verification_status = verification_result["summary"]
        
        target.write_text(cleaned_code, encoding="utf-8")
        
        # Get description of what the code does
        description_prompt = f"Briefly explain in 1-2 sentences what this {language} code does based on this request: {original_text}"
        description = self._chat(description_prompt)
        if not description.startswith("Local LLM unavailable"):
            description = description.split("\n")[0][:200]  # Get first line, max 200 chars
        else:
            description = f"Code for: {original_text[:100]}"
        
        task_desc = Path(target.stem).name  # Get the filename stem (without extension)
        formatted_task = task_desc.replace('_', ' ').title()
        
        return "file_created", f"[OK] Generated {language_label} code\n[FILE] Saved to: `/output/{target.name}`\n[TASK] {formatted_task}\n[INFO] {description}\n[VERIFY] {verification_status}"

    def _recover_if_truncated(
        self,
        cleaned_code: str,
        language: str,
        original_text: str,
        verification_result: dict,
    ) -> tuple[str, dict]:
        current = cleaned_code
        current_verification = verification_result

        for _ in range(2):
            if not self._looks_truncated(current, current_verification):
                break

            continuation_prompt = (
                "The previous code output appears truncated. Continue ONLY the remaining code from where it stopped. "
                "Do not repeat existing lines and do not add explanation. "
                f"Language: {language}. Original request: {original_text}\n\n"
                f"Current partial code:\n```{language}\n{current}\n```"
            )
            continuation = self._chat(continuation_prompt, num_predict=max(settings.ollama_response_max_tokens, 400))
            if continuation.startswith("Local LLM unavailable"):
                break

            continuation_cleaned = self._clean_generated_code(continuation, language)
            if not continuation_cleaned:
                break

            if continuation_cleaned in current:
                break

            current = f"{current.rstrip()}\n{continuation_cleaned.lstrip()}"
            current_verification = self.verifier.verify(current, language, execute=False)

        return current, current_verification

    def _looks_truncated(self, code: str, verification_result: dict) -> bool:
        errors_text = " ".join(verification_result.get("errors", [])).lower()
        truncation_error_markers = (
            "unexpected eof",
            "unterminated",
            "was never closed",
            "eol while scanning",
            "end of input",
            "expected an indented block",
            "not closed",
        )
        if any(marker in errors_text for marker in truncation_error_markers):
            return True

        non_empty_lines = [line.rstrip() for line in code.splitlines() if line.strip()]
        if not non_empty_lines:
            return False

        last_line = non_empty_lines[-1].strip()
        if re.match(r"^if\s+__", last_line):
            return True
        if last_line.endswith(("(", "[", "{", "\\", ".", ",", "=", ":")):
            return True

        if code.count("(") > code.count(")"):
            return True
        if code.count("[") > code.count("]"):
            return True
        if code.count("{") > code.count("}"):
            return True

        return False

    def _next_available_path(self, original: Path) -> Path:
        stem = original.stem
        suffix = original.suffix
        parent = original.parent
        index = 2
        while True:
            candidate = parent / f"{stem}_{index}{suffix}"
            ensure_path_inside(OUTPUT_DIR, candidate)
            if not candidate.exists():
                return candidate
            index += 1

    def _clean_generated_code(self, raw_code: str, language: str) -> str:
        """Extract and clean generated code for production use."""
        lines = raw_code.split("\n")
        
        # Try to extract code from markdown fences
        fence_pattern = f"```{language}"
        code_lines = []
        in_fence = False
        
        for line in lines:
            if line.strip().startswith(fence_pattern):
                in_fence = True
                continue
            if in_fence and line.strip().startswith("```"):
                in_fence = False
                continue
            if in_fence:
                code_lines.append(line)
        
        # If markdown fence found, use extracted code
        if code_lines:
            code = "\n".join(code_lines).strip()
        else:
            # Otherwise use raw code as-is, but clean up
            code = raw_code.strip()
        
        # Remove explanatory preamble lines (common LLM patterns)
        cleaned_lines = []
        skip_until_code = True
        
        for line in code.split("\n"):
            stripped = line.strip()
            
            # Skip empty lines and explanatory text at start
            if skip_until_code:
                if stripped and not any(
                    stripped.startswith(p)
                    for p in ("Here", "This", "The following", "You can", "I've", "I'll", "```", "#!")
                ):
                    # Found code, start adding
                    skip_until_code = False
                    cleaned_lines.append(line)
                elif stripped.startswith(("#", "import ", "from ", "def ", "class ", "export ", "async ", "function ", "const ")):
                    # Recognized code pattern
                    skip_until_code = False
                    cleaned_lines.append(line)
            else:
                # In code section, add line but skip trailing explanation comments
                if "Request context:" in line or "request context:" in line.lower():
                    break
                cleaned_lines.append(line)
        
        # Remove trailing empty lines
        while cleaned_lines and not cleaned_lines[-1].strip():
            cleaned_lines.pop()
        
        result = "\n".join(cleaned_lines).strip()
        
        # Ensure file ends with newline
        if result and not result.endswith("\n"):
            result += "\n"
        
        return result

    def _generate_fallback_code(self, language: str, request_text: str) -> str:
        if language == "python":
            return (
                "import time\n"
                "from typing import Callable, TypeVar\n\n"
                "T = TypeVar('T')\n\n"
                "def retry(operation: Callable[[], T], retries: int = 3, delay_seconds: float = 0.5) -> T:\n"
                "    \"\"\"Execute an operation with retry logic.\"\"\"\n"
                "    last_error: Exception | None = None\n"
                "    for attempt in range(1, retries + 1):\n"
                "        try:\n"
                "            return operation()\n"
                "        except Exception as exc:\n"
                "            last_error = exc\n"
                "            if attempt == retries:\n"
                "                break\n"
                "            time.sleep(delay_seconds)\n"
                "    raise RuntimeError(f'Operation failed after {retries} attempts') from last_error\n"
            )

        if language == "javascript":
            return (
                "export async function retry(operation, retries = 3, delayMs = 500) {\n"
                "  let lastError;\n"
                "  for (let attempt = 1; attempt <= retries; attempt += 1) {\n"
                "    try {\n"
                "      return await operation();\n"
                "    } catch (error) {\n"
                "      lastError = error;\n"
                "      if (attempt === retries) break;\n"
                "      await new Promise((resolve) => setTimeout(resolve, delayMs));\n"
                "    }\n"
                "  }\n"
                "  throw new Error(`Operation failed after ${retries} attempts: ${String(lastError)}`);\n"
                "}\n"
            )

        return (
            "// Fallback template: LLM unavailable\n"
            f"// Language: {language}\n"
        )

    def _summarize(self, text: str) -> tuple[str, str]:
        if not text.strip():
            return "summarized", "No text was provided to summarize."

        prompt = (
            "Summarize the following text in a concise, useful format with key points:\n\n"
            f"{text.strip()}"
        )
        return "summarized", self._chat(prompt)

    def _chat(self, prompt: str, num_predict: int | None = None) -> str:
        payload = {
            "model": self.model,
            "stream": False,
            "prompt": prompt,
            "options": {
                "temperature": settings.ollama_temperature,
                "num_predict": num_predict or settings.ollama_response_max_tokens,
            },
        }
        try:
            response = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=90)
            response.raise_for_status()
            body = response.json()
            return str(body.get("response", "")).strip() or "No output generated."
        except Exception as exc:
            logger.warning("Ollama call failed: %s", exc)
            return "Local LLM unavailable. Start Ollama and pull the configured model."
