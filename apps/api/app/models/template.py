from __future__ import annotations

from datetime import datetime
from typing import Any
from typing import Literal

from pydantic import BaseModel, Field

ParamType = Literal["string", "secret", "enum", "regex", "email"]


class TemplateParamSpec(BaseModel):
    key: str
    type: ParamType = "string"
    required: bool = False
    description: str | None = None
    enum_values: list[str] = Field(default_factory=list)
    pattern: str | None = None


class OtpPolicy(BaseModel):
    required: bool = False
    provider: Literal["manual", "gmail", "imap", "vonage"] = "manual"
    timeout_seconds: int = 120
    regex: str = r"\b(\d{6})\b"
    sender_filter: str | None = None
    subject_filter: str | None = None


class TemplatePolicies(BaseModel):
    retries: int = 0
    timeout_seconds: int = 120
    otp: OtpPolicy = Field(default_factory=OtpPolicy)
    branches: dict[str, Any] = Field(default_factory=dict)


class TemplateRecord(BaseModel):
    template_id: str
    flow_id: str
    name: str
    params_schema: list[TemplateParamSpec] = Field(default_factory=list)
    defaults: dict[str, str] = Field(default_factory=dict)
    policies: TemplatePolicies = Field(default_factory=TemplatePolicies)
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime
