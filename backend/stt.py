from __future__ import annotations

import io
import importlib
import logging
import tempfile
import threading
from pathlib import Path

import requests
from fastapi import UploadFile

from .config import settings

logger = logging.getLogger(__name__)


class STTEngine:
    def __init__(self) -> None:
        self._transcriber = None
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
            "error": self._init_error,
            "fallback_enabled": settings.use_stt_api_fallback and bool(settings.stt_api_url),
        }

    def _load_local_model(self) -> None:
        try:
            from faster_whisper import WhisperModel

            self._transcriber = WhisperModel(settings.whisper_model_size, device="auto", compute_type="int8")
            logger.info("Loaded faster-whisper model: %s", settings.whisper_model_size)
            return
        except Exception as exc:
            logger.warning("faster-whisper not available: %s", exc)

        try:
            whisper = importlib.import_module("whisper")

            self._transcriber = whisper.load_model(settings.whisper_model_size)
            logger.info("Loaded whisper model: %s", settings.whisper_model_size)
        except Exception as exc:
            logger.warning("Local whisper model unavailable: %s", exc)
            self._transcriber = None

    async def transcribe_upload(self, upload: UploadFile) -> str:
        audio_bytes = await upload.read()
        if not audio_bytes:
            raise ValueError("Empty audio input")
        return self.transcribe_bytes(audio_bytes, upload.filename or "input.wav")

    def transcribe_bytes(self, audio_bytes: bytes, filename: str) -> str:
        self._ensure_initialized()

        if self._transcriber is not None:
            text = self._transcribe_local(audio_bytes, filename)
            if text:
                return text

        if settings.use_stt_api_fallback and settings.stt_api_url:
            text = self._transcribe_api(audio_bytes, filename)
            if text:
                return text

        raise RuntimeError(
            "No STT engine available. Install faster-whisper/whisper or configure API fallback in .env"
        )

    def _transcribe_local(self, audio_bytes: bytes, filename: str) -> str:
        suffix = Path(filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()

            if hasattr(self._transcriber, "transcribe"):
                result = self._transcriber.transcribe(tmp.name)

                if isinstance(result, tuple):
                    segments, _info = result
                    return " ".join(segment.text.strip() for segment in segments).strip()

                if isinstance(result, dict):
                    return str(result.get("text", "")).strip()

        return ""

    def _transcribe_api(self, audio_bytes: bytes, filename: str) -> str:
        headers = {}
        if settings.stt_api_key:
            headers["Authorization"] = f"Bearer {settings.stt_api_key}"

        files = {"file": (filename, io.BytesIO(audio_bytes), "application/octet-stream")}
        response = requests.post(settings.stt_api_url, headers=headers, files=files, timeout=60)
        response.raise_for_status()
        payload = response.json()
        return str(payload.get("text", "")).strip()
