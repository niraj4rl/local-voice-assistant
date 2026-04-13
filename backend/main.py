from __future__ import annotations

import logging
from typing import Annotated

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .intent import IntentAnalyzer
from .schemas import ProcessAudioResponse
from .stt import STTEngine
from .tools import ToolExecutor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stt_engine = STTEngine()
intent_analyzer = IntentAnalyzer()
tool_executor = ToolExecutor()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/stt-status")
def stt_status() -> dict[str, object]:
    return stt_engine.status()


@app.post("/warmup-stt")
def warmup_stt(background_tasks: BackgroundTasks) -> dict[str, str]:
    background_tasks.add_task(stt_engine.warmup)
    return {"status": "warming"}


@app.post("/process-audio", response_model=ProcessAudioResponse)
async def process_audio(file: Annotated[UploadFile, File(...)]) -> ProcessAudioResponse:
    logs: list[str] = []
    try:
        logs.append("Audio received")
        transcription = await stt_engine.transcribe_upload(file)
        stt_debug = stt_engine.get_last_debug()
        logs.append("Speech-to-text completed")
        if stt_debug.get("backend"):
            logs.append(f"STT backend: {stt_debug['backend']}")
        if stt_debug.get("language"):
            logs.append(
                f"Detected language: {stt_debug['language']} ({float(stt_debug.get('language_probability', 0.0)):.2f})"
            )
        if not transcription.strip():
            transcription = "No speech detected in the audio."
            logs.append("No speech detected")

        intent_payload = intent_analyzer.analyze(transcription)
        logs.append(f"Intent detected: {intent_payload.intent}")

        action, output = tool_executor.execute(intent_payload, transcription)
        logs.append(f"Action executed: {action}")

        return ProcessAudioResponse(
            transcription=transcription,
            intent=intent_payload.intent,
            action=action,
            output=output,
            logs=logs,
            stt_debug=stt_debug,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Processing failed")
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc


@app.post("/process-text", response_model=ProcessAudioResponse)
def process_text(text: Annotated[str, Form(...)]) -> ProcessAudioResponse:
    logs: list[str] = ["Text input received"]

    intent_payload = intent_analyzer.analyze(text)
    logs.append(f"Intent detected: {intent_payload.intent}")

    action, output = tool_executor.execute(intent_payload, text)
    logs.append(f"Action executed: {action}")

    return ProcessAudioResponse(
        transcription=text,
        intent=intent_payload.intent,
        action=action,
        output=output,
        logs=logs,
        stt_debug=None,
    )
