export type {
  ActionState,
  Command,
  CommandState,
  Task,
  TaskState,
} from "./features/command-center/types"

export type CommandCategory =
  | "init"
  | "pipeline"
  | "frontend"
  | "automation"
  | "maintenance"
  | "backend"
export type LogLevel = "info" | "success" | "warn" | "error"
export type LogEntry = {
  id: string
  ts: string
  level: LogLevel
  message: string
  commandId?: string
}
export type UiNotice = { id: string; level: LogLevel; message: string }
export type FetchTaskOptions = { background?: boolean }

export type DiagnosticsPayload = {
  uptime_seconds: number
  task_total: number
  task_counts: Record<string, number>
  metrics: { requests_total: number; rate_limited: number }
}

export type AlertsPayload = {
  state: "ok" | "degraded"
  failure_rate: number
  threshold: number
  completed: number
  failed: number
}

export type FlowPreviewStep = {
  step_id: string
  action: string
  url?: string | null
  value_ref?: string | null
  selector?: string | null
}

export type FlowPreviewPayload = {
  session_id: string | null
  start_url: string | null
  generated_at: string | null
  source_event_count: number
  step_count: number
  steps: FlowPreviewStep[]
}

export type FlowDraftDocumentPayload = {
  session_id: string | null
  flow: Record<string, unknown> | null
}

export type ReconstructionArtifactsPayload = {
  session_dir?: string
  video_path?: string
  har_path?: string
  html_path?: string
  html_content?: string
}

export type ReconstructionPreviewPayload = {
  preview_id: string
  flow_draft: Record<string, unknown>
  reconstructed_flow_quality: number
  step_confidence: number[]
  unresolved_segments: string[]
  manual_handoff_required: boolean
  unsupported_reason: string | null
  generator_outputs: Record<string, string>
}

export type ReconstructionGeneratePayload = {
  flow_id: string
  template_id: string
  run_id: string | null
  generator_outputs: Record<string, string>
  reconstructed_flow_quality: number
  step_confidence: number[]
  unresolved_segments: string[]
  manual_handoff_required: boolean
  unsupported_reason: string | null
}

export type ProfileResolvePayload = {
  profile: string
  video_signals: string[]
  dom_alignment_score: number
  har_alignment_score: number
  recommended_manual_checkpoints: string[]
  manual_handoff_required: boolean
  unsupported_reason: string | null
}

export type FlowSelectorCandidate = {
  kind: "role" | "css" | "id" | "name"
  value: string
  score: number
}

export type FlowEditableStep = {
  step_id: string
  action: "navigate" | "click" | "type" | string
  url?: string
  value_ref?: string
  selected_selector_index?: number
  target?: {
    selectors?: FlowSelectorCandidate[]
  }
}

export type FlowEditableDraft = {
  flow_id?: string
  session_id?: string
  start_url: string
  generated_at?: string
  source_event_count?: number
  steps: FlowEditableStep[]
}

export type StepEvidencePayload = {
  step_id: string
  action: string | null
  ok: boolean | null
  detail: string | null
  duration_ms: number | null
  matched_selector: string | null
  selector_index: number | null
  screenshot_before_path: string | null
  screenshot_after_path: string | null
  screenshot_before_data_url: string | null
  screenshot_after_data_url: string | null
  fallback_trail: Array<{
    selector_index: number
    kind: string
    value: string
    normalized: string | null
    success: boolean
    error: string | null
  }>
}

export type EvidenceTimelineItem = {
  step_id: string
  action: string | null
  ok: boolean | null
  detail: string | null
  duration_ms: number | null
  matched_selector: string | null
  selector_index: number | null
  screenshot_before_path: string | null
  screenshot_after_path: string | null
  screenshot_before_data_url: string | null
  screenshot_after_data_url: string | null
  fallback_trail: Array<{
    selector_index: number
    kind: string
    value: string
    normalized: string | null
    success: boolean
    error: string | null
  }>
}

export type EvidenceTimelinePayload = {
  items: EvidenceTimelineItem[]
}

export type UniversalSession = {
  session_id: string
  start_url: string
  mode: "manual" | "ai"
  owner: string | null
  started_at: string
  finished_at: string | null
  artifacts_index: Record<string, string>
}

export type UniversalFlow = {
  flow_id: string
  session_id: string
  version: number
  quality_score: number
  start_url: string
  source_event_count: number
  steps: FlowEditableStep[]
  created_at: string
  updated_at: string
}

export type UniversalTemplate = {
  template_id: string
  flow_id: string
  name: string
  params_schema: Array<{
    key: string
    type: "string" | "secret" | "enum" | "regex" | "email"
    required: boolean
    description?: string | null
    enum_values?: string[]
    pattern?: string | null
  }>
  defaults: Record<string, string>
  policies: {
    retries: number
    timeout_seconds: number
    otp: {
      required: boolean
      provider: "manual" | "gmail" | "imap" | "vonage"
      timeout_seconds: number
      regex: string
      sender_filter?: string | null
      subject_filter?: string | null
    }
    branches: Record<string, unknown>
  }
  created_by: string | null
  created_at: string
  updated_at: string
}

export type UniversalRun = {
  run_id: string
  template_id: string
  status: "queued" | "running" | "waiting_user" | "waiting_otp" | "success" | "failed" | "cancelled"
  wait_context?: {
    reason_code?: string | null
    at_step_id?: string | null
    after_step_id?: string | null
    resume_from_step_id?: string | null
    resume_hint?: string | null
    provider_domain?: string | null
    gate_required_by_policy?: boolean | null
  } | null
  step_cursor: number
  params: Record<string, string>
  task_id: string | null
  last_error: string | null
  artifacts_ref: Record<string, string>
  created_at: string
  updated_at: string
  logs: Array<{ ts: string; level: "info" | "warn" | "error"; message: string }>
}

export type RunRecordSource = "command" | "template"

export type RunRecordDetailSection = "source" | "status" | "progress" | "timeline" | "output"

export type RunRecordViewHint = {
  title: "Run Record Details"
  sections: RunRecordDetailSection[]
}

// UI label mapping: protocol fields stay unchanged while display copy stays beginner-friendly.
export const RUN_RECORD_SOURCE_LABEL: Record<RunRecordSource, string> = {
  command: "Command Run",
  template: "Template Run",
}

export const RUN_RECORD_DETAIL_SECTION_LABEL: Record<RunRecordDetailSection, string> = {
  source: "Source",
  status: "Status",
  progress: "Progress",
  timeline: "Timeline",
  output: "Output",
}

export const UNIVERSAL_RUN_STATUS_LABEL: Record<UniversalRun["status"], string> = {
  queued: "Queued",
  running: "Running",
  waiting_user: "Waiting for User Input",
  waiting_otp: "Waiting for OTP",
  success: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
}
