import { memo } from "react"
import EmptyState from "../components/EmptyState"
import EvidenceScreenshotPair from "../components/EvidenceScreenshotPair"
import FlowDraftEditor from "../components/FlowDraftEditor"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox } from "@uiq/ui"
import type {
  AlertsPayload,
  DiagnosticsPayload,
  EvidenceTimelineItem,
  FlowEditableDraft,
  FlowPreviewPayload,
  StepEvidencePayload,
} from "../types"

interface FlowWorkshopViewProps {
  diagnostics: DiagnosticsPayload | null
  alerts: AlertsPayload | null
  diagnosticsError: string
  alertError: string
  latestFlow: FlowPreviewPayload | null
  flowError: string
  flowDraft: FlowEditableDraft | null
  selectedStepId: string
  stepEvidence: StepEvidencePayload | null
  evidenceTimeline: EvidenceTimelineItem[]
  evidenceTimelineError: string
  resumeWithPreconditions: boolean
  stepEvidenceError: string
  onFlowDraftChange: (next: FlowEditableDraft) => void
  onSelectStep: (stepId: string) => void
  onResumeWithPreconditionsChange: (enabled: boolean) => void
  onSaveFlowDraft: () => void
  onReplayLatestFlow: () => void
  onReplayStep: (stepId: string) => void
  onResumeFromStep: (stepId: string) => void
  onRefresh: () => void
}

function FlowWorkshopView({
  diagnostics,
  alerts,
  diagnosticsError,
  alertError,
  latestFlow,
  flowError,
  flowDraft,
  selectedStepId,
  stepEvidence,
  evidenceTimeline,
  evidenceTimelineError,
  resumeWithPreconditions,
  stepEvidenceError,
  onFlowDraftChange,
  onSelectStep,
  onResumeWithPreconditionsChange,
  onSaveFlowDraft,
  onReplayLatestFlow,
  onReplayStep,
  onResumeFromStep,
  onRefresh,
}: FlowWorkshopViewProps) {
  const hasDraftSteps = Boolean(flowDraft && flowDraft.steps.length > 0)
  const hasLatestSession = Boolean(latestFlow?.session_id)
  const hasEvidence = evidenceTimeline.length > 0
  const failedStep = evidenceTimeline.find((item) => !item.ok)
  const latestResultText = !hasEvidence
    ? "Not run yet"
    : failedStep
      ? `Failed at ${failedStep.step_id}`
      : "Passed"
  const nextActionText = !hasDraftSteps
    ? "Start one recording run from Quick Launch first to generate the initial flow draft."
    : !hasLatestSession
      ? 'Save the draft first, then click "Replay Latest Flow" to complete the first run.'
      : failedStep
        ? `Resume from ${failedStep.step_id} and correct that step.`
        : "Review the key screenshots, then reuse the flow with confidence."

  return (
    <div className="flow-workshop-view">
      {/* Left: Diagnostics + Flow Editor */}
      <div className="flow-editor-column">
        <Card className="workshop-command-deck flow-editor-panel">
          <CardContent className="workshop-command-deck-content p-4">
            <div className="workshop-command-copy">
              <p className="launch-section-kicker">{"Flow Control Deck"}</p>
              <h2 className="workshop-command-title">{"Converge on the outcome first, then move into diagnostics, editing, and evidence review"}</h2>
              <p className="workshop-command-body">
                {
                  "This screen keeps the most important outcome and next action at the top. Advanced diagnostics and evidence drill-down stay available below without fragmenting attention too early."
                }
              </p>
            </div>
            <div className="workshop-command-pills">
              <Badge variant={hasDraftSteps ? "success" : "default"}>
                {hasDraftSteps ? "Draft ready" : "Waiting for the first draft recording"}
              </Badge>
              <Badge className="workshop-pill" variant={hasEvidence ? "secondary" : "default"}>
                {hasEvidence ? `${evidenceTimeline.length} evidence nodes` : "No evidence nodes yet"}
              </Badge>
              <Badge className="workshop-pill" variant={failedStep ? "destructive" : "success"}>
                {failedStep ? `Fix pending at ${failedStep.step_id}` : "No failures in the current replay"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="workshop-focus-card flow-editor-panel">
          <CardHeader>
            <CardTitle>{"Key outcome and next action"}</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="workshop-advanced-note">
            {'Flow Workshop is the advanced zone. For a first run, you only need "Save Draft → Replay Latest Flow".'}
          </p>
          <div className="focus-kpis">
            <div className="focus-kpi">
              <span className="focus-kpi-label">{"Draft"}</span>
              <span className="focus-kpi-value">{hasDraftSteps ? "Ready" : "Missing"}</span>
            </div>
            <div className="focus-kpi">
              <span className="focus-kpi-label">{"Latest replay"}</span>
              <span className="focus-kpi-value">{latestResultText}</span>
            </div>
          </div>
          <p className="hint-text mt-2">{nextActionText}</p>
          <div className="form-actions mt-2">
            <Button size="sm" onClick={onSaveFlowDraft} disabled={!hasDraftSteps}>
              {"Save Draft"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReplayLatestFlow}
              disabled={!hasLatestSession}
            >
              {"Replay Latest Flow"}
            </Button>
            {failedStep && (
              <Button variant="outline" size="sm" onClick={() => onResumeFromStep(failedStep.step_id)}>
                {`Resume from ${failedStep.step_id}`}
              </Button>
            )}
          </div>
          </CardContent>
        </Card>

        <details className="workshop-advanced-panel">
          <summary>{"Advanced workshop (optional): system diagnostics, flow editing, and debugging evidence"}</summary>
          <div className="workshop-advanced-body">
            {/* Diagnostic Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>{"System status"}</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0115-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                  </svg>
                  {"Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
              {diagnosticsError && <p className="error-text">{diagnosticsError}</p>}
              {alertError && <p className="error-text">{alertError}</p>}
              {flowError && <p className="error-text">{flowError}</p>}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">{"Uptime"}</div>
                  <div className="metric-value">
                    {diagnostics ? `${Math.round(diagnostics.uptime_seconds / 60)}m` : "\u2014"}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"Total tasks"}</div>
                  <div className="metric-value">{diagnostics?.task_total ?? 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"Running"}</div>
                  <div className="metric-value">{diagnostics?.task_counts.running ?? 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"Succeeded"}</div>
                  <div className="metric-value">{diagnostics?.task_counts.success ?? 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"Failed"}</div>
                  <div className="metric-value">{diagnostics?.task_counts.failed ?? 0}</div>
                </div>
                <div className={`metric-card ${alerts?.state === "degraded" ? "warn" : "ok"}`}>
                  <div className="metric-label">{"Health"}</div>
                  <div className="metric-value">
                    {alerts?.state === "ok"
                      ? "Healthy"
                      : alerts?.state === "degraded"
                        ? "Degraded"
                        : "\u2014"}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Latest flow preview */}
            <Card>
              <CardHeader>
                <CardTitle>{"Latest flow"}</CardTitle>
                <Button variant="outline" size="sm" onClick={onReplayLatestFlow} disabled={!hasLatestSession}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {"Replay"}
                </Button>
              </CardHeader>
              <CardContent>
              {latestFlow?.session_id ? (
                <>
                  <p className="hint-text mb-2">
                    {`Session #${latestFlow.session_id.slice(0, 8)} \u00B7 ${latestFlow.step_count} steps \u00B7 ${latestFlow.source_event_count} events`}
                  </p>
                  <ul className="task-list vlist-flow" role="list" aria-label="Latest flow steps">
                    {latestFlow.steps.slice(0, 10).map((step) => (
                      <li key={step.step_id} className="task-item">
                        <div className="task-item-info">
                          <strong>{`${step.step_id} \u00B7 ${step.action}`}</strong>
                          <p>{step.url || step.selector || step.value_ref || "No additional detail"}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState
                  icon={
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                    </svg>
                  }
                  title="No flow data yet"
                  description="Run one recording command and the generated flow data will appear here automatically."
                />
              )}
              </CardContent>
            </Card>

            {/* Flow draft editor */}
            <Card>
              <CardHeader>
                <CardTitle>{"Flow editor"}</CardTitle>
              </CardHeader>
              <CardContent>
              <FlowDraftEditor
                draft={flowDraft}
                selectedStepId={selectedStepId}
                onSelectStep={onSelectStep}
                onChange={onFlowDraftChange}
                onSave={onSaveFlowDraft}
                onRunStep={onReplayStep}
                onResumeFromStep={onResumeFromStep}
              />
              <div className="form-row mt-2">
                <label className="inline-check">
                  <Checkbox
                    checked={resumeWithPreconditions}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onResumeWithPreconditionsChange(e.target.checked)
                    }
                  />
                  {"Replay prerequisite waiting conditions during breakpoint resume"}
                </label>
              </div>
              </CardContent>
            </Card>
          </div>
        </details>
      </div>

      {/* Right: Evidence */}
      <div className="flow-evidence-column">
        <Card className="workshop-evidence-hero flow-evidence-panel">
          <CardContent className="p-4">
            <p className="launch-section-kicker">{"Evidence Rail"}</p>
            <h3 className="launch-section-title">{"Evidence and status converge here"}</h3>
            <p className="hint-text">
              {"Use this side to answer two questions first: which step failed, and what did the page look like before and after that step? Read the timeline before jumping back to the editor."}
            </p>
          </CardContent>
        </Card>
        {stepEvidenceError && <p className="error-text">{stepEvidenceError}</p>}
        <details className="workshop-advanced-panel">
          <summary>{"Advanced debugging evidence (optional)"}</summary>
          <div className="workshop-advanced-body">
            {/* Evidence Timeline */}
            <div>
              <h3 className="section-title">{"Evidence timeline"}</h3>
              {evidenceTimelineError && <p className="error-text">{evidenceTimelineError}</p>}
              {evidenceTimeline.length === 0 ? (
                <EmptyState
                  icon={
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  }
                  title="No evidence screenshots yet"
                  description="After a replay finishes, before/after screenshots for each step appear here."
                />
              ) : (
                <ul className="task-list vlist-lg" role="list" aria-label="Evidence timeline">
                  {evidenceTimeline.map((item) => (
                    <li key={item.step_id}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`task-item task-item-button flex-col ${selectedStepId === item.step_id ? "active" : ""}`}
                        aria-label="Open step evidence details"
                        data-uiq-ignore-button-inventory="repeated-step-evidence-selection"
                        onClick={() => onSelectStep(item.step_id)}
                      >
                        <div className="flex-row justify-between gap-2">
                          <strong>{`${item.step_id} \u00B7 ${item.action ?? "Unknown"}`}</strong>
                          <span className="hint-text">{`${item.ok ? "Passed" : "Failed"} \u00B7 ${item.duration_ms ?? 0}ms`}</span>
                        </div>
                        <p className="hint-text">{item.detail ?? "No additional detail"}</p>
                        <EvidenceScreenshotPair
                          beforeImageUrl={item.screenshot_before_data_url}
                          afterImageUrl={item.screenshot_after_data_url}
                          beforeAlt={`Before execution - ${item.step_id}`}
                          afterAlt={`After execution - ${item.step_id}`}
                        />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Step Evidence Detail */}
            <div>
              <h3 className="section-title">{"Step evidence details"}</h3>
              {!selectedStepId ? (
                <EmptyState
                  icon={
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                  title="Select a step to inspect the evidence"
                  description="Choose a step from the timeline or the editor to inspect its detailed evidence."
                />
              ) : !stepEvidence ? (
                <p className="hint-text p-4">{`Step ${selectedStepId} has no evidence yet. Replay or rerun it first.`}</p>
              ) : (
                <Card tone="raised">
                  <div className="field-group">
                    <div className="form-row">
                      <div className="field">
                        <span className="field-label">{"Step"}</span>
                        <span className="text-sm">{`${stepEvidence.step_id} \u00B7 ${stepEvidence.action ?? "Unknown"}`}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">{"Status"}</span>
                        <span className="text-sm">{stepEvidence.ok ? "Passed" : "Failed"}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">{"Duration"}</span>
                        <span className="text-sm">{`${stepEvidence.duration_ms ?? 0}ms`}</span>
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">{"Matched selector"}</span>
                      <span className="hint-text">{`[${stepEvidence.selector_index ?? "-"}] ${stepEvidence.matched_selector ?? "None"}`}</span>
                    </div>
                    {stepEvidence.detail && (
                      <div className="field">
                        <span className="field-label">{"Detail"}</span>
                        <span className="hint-text">{stepEvidence.detail}</span>
                      </div>
                    )}
                    <EvidenceScreenshotPair
                      beforeImageUrl={stepEvidence.screenshot_before_data_url}
                      afterImageUrl={stepEvidence.screenshot_after_data_url}
                      beforeAlt={`Evidence before execution - ${stepEvidence.step_id}`}
                      afterAlt={`Evidence after execution - ${stepEvidence.step_id}`}
                      emptyHint="No screenshot evidence exists for this step"
                    />
                    <details className="debug-disclosure">
                      <summary>{"Advanced debugging: selector fallback trail"}</summary>
                      <div className="debug-disclosure-body">
                        {stepEvidence.fallback_trail.length === 0 ? (
                          <p className="hint-text">{"No fallback was triggered for this step."}</p>
                        ) : (
                          <ul
                            className="task-list vlist-sm"
                            role="list"
                            aria-label="Selector fallback trail"
                          >
                            {stepEvidence.fallback_trail.map((attempt) => (
                              <li
                                key={`${attempt.selector_index}-${attempt.value}`}
                                className="task-item"
                              >
                                <div className="task-item-info">
                                  <strong>{`#${attempt.selector_index} [${attempt.kind}] ${attempt.normalized ?? attempt.value}`}</strong>
                                  <p>
                                    {attempt.success
                                      ? "Matched successfully"
                                      : `Failed: ${attempt.error ?? "Unknown error"}`}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </details>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default memo(FlowWorkshopView)
