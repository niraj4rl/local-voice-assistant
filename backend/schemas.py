from __future__ import annotations

from pydantic import BaseModel, Field


class IntentPayload(BaseModel):
    intent: str = Field(default="general_chat")
    filename: str = Field(default="")
    content: str = Field(default="")
    language: str = Field(default="")


class STTSegment(BaseModel):
    start: float = 0.0
    end: float = 0.0
    text: str = ""


class STTDebug(BaseModel):
    backend: str = ""
    language: str = ""
    language_probability: float = 0.0
    raw_text: str = ""
    segments: list[STTSegment] = Field(default_factory=list)


class ProcessAudioResponse(BaseModel):
    transcription: str
    intent: str
    action: str
    output: str
    logs: list[str]
    stt_debug: STTDebug | None = None
