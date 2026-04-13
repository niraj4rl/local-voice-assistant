from __future__ import annotations

import io
import importlib
import logging
import tempfile
import threading
from typing import Any
from pathlib import Path

import requests
from fastapi import UploadFile

from .config import settings

logger = logging.getLogger(__name__)


class STTEngine:
    def __init__(self) -> None:
        self._transcriber = None
        self._backend = ""
        self._last_debug: dict[str, Any] = {
            "backend": "",
            "language": "",
            "language_probability": 0.0,
            "raw_text": "",
            "segments": [],
        }
        self._is_initialized = False
        self._is_initializing = False
        self._init_error = ""
        self._init_lock = threading.Lock()

    def _ensure_initialized(self) -> None:
        if self._is_initialized:
            return

        with self._init_lock:
            if self._is_initialized:
                return

            self._is_initializing = True
            self._init_error = ""
            try:
                self._load_local_model()
                self._is_initialized = True
            except Exception as exc:
                self._init_error = str(exc)
                raise
            finally:
                self._is_initializing = False

    def warmup(self) -> None:
        self._ensure_initialized()

    def status(self) -> dict[str, object]:
        return {
            "initialized": self._is_initialized,
            "initializing": self._is_initializing,
            "local_model_loaded": self._transcriber is not None,
            "backend": self._backend,
            "error": self._init_error,
            "fallback_enabled": settings.use_stt_api_fallback and bool(settings.stt_api_url),
        }

    def get_last_debug(self) -> dict[str, Any]:
        return {
            "backend": str(self._last_debug.get("backend", "")),
            "language": str(self._last_debug.get("language", "")),
            "language_probability": float(self._last_debug.get("language_probability", 0.0) or 0.0),
            "raw_text": str(self._last_debug.get("raw_text", "")),
            "segments": list(self._last_debug.get("segments", [])),
        }

    def _load_local_model(self) -> None:
        try:
            from faster_whisper import WhisperModel

            self._transcriber = WhisperModel(
                settings.whisper_model_size,
                device="cpu",
                compute_type=settings.whisper_compute_type,
            )
            self._backend = "faster_whisper"
            logger.info("Loaded faster-whisper model: %s", settings.whisper_model_size)
            return
        except Exception as exc:
            logger.warning("faster-whisper not available: %s", exc)

        try:
            whisper = importlib.import_module("whisper")

            self._transcriber = whisper.load_model(settings.whisper_model_size)
            self._backend = "openai_whisper"
            logger.info("Loaded whisper model: %s", settings.whisper_model_size)
        except Exception as exc:
            logger.warning("Local whisper model unavailable: %s", exc)
            self._transcriber = None
            self._backend = ""

    def _load_openai_whisper(self) -> bool:
        try:
            whisper = importlib.import_module("whisper")
            self._transcriber = whisper.load_model(settings.whisper_model_size)
            self._backend = "openai_whisper"
            logger.info("Switched to openai-whisper fallback model: %s", settings.whisper_model_size)
            return True
        except Exception as exc:
            logger.warning("openai-whisper fallback load failed: %s", exc)
            return False

    async def transcribe_upload(self, upload: UploadFile) -> str:
        audio_bytes = await upload.read()
        if not audio_bytes:
            raise ValueError("Empty audio input")
        return self.transcribe_bytes(audio_bytes, upload.filename or "input.wav")

    def transcribe_bytes(self, audio_bytes: bytes, filename: str) -> str:
        self._ensure_initialized()
        self._last_debug = {
            "backend": self._backend,
            "language": "",
            "language_probability": 0.0,
            "raw_text": "",
            "segments": [],
        }

        any_engine_attempted = False
        if self._transcriber is not None:
            any_engine_attempted = True
            try:
                text, debug = self._transcribe_local(audio_bytes, filename)
                self._last_debug = debug
                if text:
                    return text
            except Exception as exc:
                logger.warning("Primary local STT failed (%s): %s", self._backend or "unknown", exc)
                if self._backend == "faster_whisper" and self._load_openai_whisper():
                    any_engine_attempted = True
                    text, debug = self._transcribe_local(audio_bytes, filename)
                    self._last_debug = debug
                    if text:
                        return text

        if settings.use_stt_api_fallback and settings.stt_api_url:
            any_engine_attempted = True
            text = self._transcribe_api(audio_bytes, filename)
            self._last_debug = {
                "backend": "api_fallback",
                "language": "",
                "language_probability": 0.0,
                "raw_text": text,
                "segments": [],
            }
            if text:
                return text

        if any_engine_attempted:
            return ""

        raise RuntimeError(
            "No STT engine available. Install faster-whisper/whisper or configure API fallback in .env"
        )

    def _transcribe_local(self, audio_bytes: bytes, filename: str) -> tuple[str, dict[str, Any]]:
        suffix = Path(filename).suffix or ".wav"
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp.flush()
                tmp_path = tmp.name

            if hasattr(self._transcriber, "transcribe"):
                if self._backend == "faster_whisper":
                    language = settings.whisper_language.strip() or None
                    result = self._transcriber.transcribe(
                        tmp_path,
                        beam_size=settings.whisper_beam_size,
                        best_of=settings.whisper_best_of,
                        vad_filter=settings.whisper_vad_filter,
                        language=language,
                    )
                else:
                    language = settings.whisper_language.strip() or None
                    result = self._transcriber.transcribe(tmp_path, language=language)

                if self._backend == "faster_whisper" and isinstance(result, tuple):
                    segments, _info = result
                    segment_items: list[dict[str, Any]] = []
                    texts: list[str] = []
                    for segment in segments:
                        text = segment.text.strip()
                        if text:
                            texts.append(text)
                        segment_items.append(
                            {
                                "start": round(float(segment.start), 2),
                                "end": round(float(segment.end), 2),
                                "text": text,
                            }
                        )
                    joined = " ".join(texts).strip()
                    debug = {
                        "backend": self._backend,
                        "language": str(getattr(_info, "language", "") or ""),
                        "language_probability": float(getattr(_info, "language_probability", 0.0) or 0.0),
                        "raw_text": joined,
                        "segments": segment_items,
                    }
                    return joined, debug

                if self._backend == "openai_whisper" and isinstance(result, dict):
                    raw_text = str(result.get("text", "")).strip()
                    segments = []
                    for segment in result.get("segments", []) or []:
                        segments.append(
                            {
                                "start": round(float(segment.get("start", 0.0)), 2),
                                "end": round(float(segment.get("end", 0.0)), 2),
                                "text": str(segment.get("text", "")).strip(),
                            }
                        )
                    debug = {
                        "backend": self._backend,
                        "language": str(result.get("language", "") or ""),
                        "language_probability": 0.0,
                        "raw_text": raw_text,
                        "segments": segments,
                    }
                    return raw_text, debug
        finally:
            if tmp_path:
                Path(tmp_path).unlink(missing_ok=True)

        return "", {
            "backend": self._backend,
            "language": "",
            "language_probability": 0.0,
            "raw_text": "",
            "segments": [],
        }

    def _transcribe_api(self, audio_bytes: bytes, filename: str) -> str:
        headers = {}
        if settings.stt_api_key:
            headers["Authorization"] = f"Bearer {settings.stt_api_key}"

        files = {"file": (filename, io.BytesIO(audio_bytes), "application/octet-stream")}
        response = requests.post(settings.stt_api_url, headers=headers, files=files, timeout=60)
        response.raise_for_status()
        payload = response.json()
        return str(payload.get("text", "")).strip()
