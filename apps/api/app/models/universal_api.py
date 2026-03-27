from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from apps.api.app.models.flow import FlowRecord, SessionRecord
from apps.api.app.models.run import RunRecord
from apps.api.app.models.template import TemplateRecord


class SessionStartRequest(BaseModel):
    start_url: str
    mode: str = "manual"


class SessionListResponse(BaseModel):
    sessions: list[SessionRecord] = Field(default_factory=list)


class FlowCreateRequest(BaseModel):
    session_id: str
    start_url: str
    source_event_count: int = 0
    steps: list[dict[str, Any]] = Field(default_factory=list)


class FlowUpdateRequest(BaseModel):
    start_url: str | None = None
    steps: list[dict[str, Any]] | None = None


class FlowListResponse(BaseModel):
    flows: list[FlowRecord] = Field(default_factory=list)


class TemplateCreateRequest(BaseModel):
    flow_id: str
    name: str
    params_schema: list[dict[str, Any]] = Field(default_factory=list)
    defaults: dict[str, str] = Field(default_factory=dict)
    policies: dict[str, Any] = Field(default_factory=dict)


class TemplateUpdateRequest(BaseModel):
    name: str | None = None
    params_schema: list[dict[str, Any]] | None = None
    defaults: dict[str, str] | None = None
    policies: dict[str, Any] | None = None


class TemplateListResponse(BaseModel):
    templates: list[TemplateRecord] = Field(default_factory=list)


class RunCreateRequest(BaseModel):
    template_id: str
    params: dict[str, str] = Field(default_factory=dict)
    otp_code: str | None = None


class RunOtpSubmitRequest(BaseModel):
    otp_code: str | None = None


class RunListResponse(BaseModel):
    runs: list[RunRecord] = Field(default_factory=list)


class RunEnvelopeResponse(BaseModel):
    run: RunRecord


class TemplateFromArtifactsRequest(BaseModel):
    artifacts: dict[str, Any]
    video_analysis_mode: Literal["gemini"] = "gemini"
    extractor_strategy: str = "balanced"
    auto_refine_iterations: int = 3
    template_name: str = "reconstructed-template"


class TemplateFromArtifactsResponse(BaseModel):
    template_id: str
    flow_id: str
    reconstructed_flow_quality: int
    generator_outputs: dict[str, str] = Field(default_factory=dict)
