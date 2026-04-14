from __future__ import annotations

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "output"
MODELS_DIR = BASE_DIR / "models"


class Settings(BaseSettings):
    app_name: str = "Voice-Controlled Local AI Agent"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    whisper_model_size: str = "base"
    whisper_language: str = "en"
    whisper_beam_size: int = 5
    whisper_best_of: int = 5
    whisper_vad_filter: bool = True
    whisper_compute_type: str = "int8"
    stt_min_language_probability: float = 0.55
    stt_min_transcript_chars: int = 6
    stt_min_alpha_ratio: float = 0.45
    ollama_model: str = "mistral"
    ollama_base_url: str = "http://localhost:11434"
    ollama_intent_max_tokens: int = 80
    ollama_response_max_tokens: int = 900
    ollama_temperature: float = 0.2
    use_stt_api_fallback: bool = False
    stt_api_url: str = ""
    stt_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
