from __future__ import annotations

from pydantic import BaseModel, Field


class IntentPayload(BaseModel):
    intent: str = Field(default="general_chat")
    filename: str = Field(default="")
    content: str = Field(default="")
    language: str = Field(default="")


class ProcessAudioResponse(BaseModel):
    transcription: str
    intent: str
    action: str
    output: str
    logs: list[str]
