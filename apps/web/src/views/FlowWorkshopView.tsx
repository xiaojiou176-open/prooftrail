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
    ? "未执行"
    : failedStep
      ? `失败于 ${failedStep.step_id}`
      : "已通过"
  const nextActionText = !hasDraftSteps
    ? "先在快捷启动页执行一次录制，自动生成流程草稿。"
    : !hasLatestSession
      ? "先保存草稿，再点击“回放最新流程”完成首跑。"
      : failedStep
        ? `从 ${failedStep.step_id} 续跑并修正该步骤。`
        : "回看关键截图后即可复用该流程。"

  return (
    <div className="flow-workshop-view">
      {/* Left: Diagnostics + Flow Editor */}
      <div className="flow-editor-column">
        <Card className="workshop-command-deck flow-editor-panel">
          <CardContent className="workshop-command-deck-content p-4">
            <div className="workshop-command-copy">
              <p className="launch-section-kicker">{"Flow Control Deck"}</p>
              <h2 className="workshop-command-title">{"先收敛结果，再进入诊断、编辑与证据追踪"}</h2>
              <p className="workshop-command-body">
                {
                  "这里默认把关键结果与下一步放在首屏最前面，高级诊断与证据链路随后展开，避免流程工坊从一开始就把注意力拉碎。"
                }
              </p>
            </div>
            <div className="workshop-command-pills">
              <Badge variant={hasDraftSteps ? "success" : "default"}>
                {hasDraftSteps ? "草稿已就绪" : "等待录制首轮草稿"}
              </Badge>
              <Badge className="workshop-pill" variant={hasEvidence ? "secondary" : "default"}>
                {hasEvidence ? `${evidenceTimeline.length} 条证据节点` : "尚无证据节点"}
              </Badge>
              <Badge className="workshop-pill" variant={failedStep ? "destructive" : "success"}>
                {failedStep ? `待修复 ${failedStep.step_id}` : "当前回放无失败节点"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="workshop-focus-card flow-editor-panel">
          <CardHeader>
            <CardTitle>{"关键结果与下一步"}</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="workshop-advanced-note">
            {"流程工坊是进阶区，首跑只需要完成“保存草稿 → 回放最新流程”。"}
          </p>
          <div className="focus-kpis">
            <div className="focus-kpi">
              <span className="focus-kpi-label">{"草稿"}</span>
              <span className="focus-kpi-value">{hasDraftSteps ? "已就绪" : "未创建"}</span>
            </div>
            <div className="focus-kpi">
              <span className="focus-kpi-label">{"最近回放"}</span>
              <span className="focus-kpi-value">{latestResultText}</span>
            </div>
          </div>
          <p className="hint-text mt-2">{nextActionText}</p>
          <div className="form-actions mt-2">
            <Button size="sm" onClick={onSaveFlowDraft} disabled={!hasDraftSteps}>
              {"保存草稿"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReplayLatestFlow}
              disabled={!hasLatestSession}
            >
              {"回放最新流程"}
            </Button>
            {failedStep && (
              <Button variant="outline" size="sm" onClick={() => onResumeFromStep(failedStep.step_id)}>
                {`从 ${failedStep.step_id} 续跑`}
              </Button>
            )}
          </div>
          </CardContent>
        </Card>

        <details className="workshop-advanced-panel">
          <summary>{"进阶工坊（可选）：系统诊断、流程编辑与调试证据"}</summary>
          <div className="workshop-advanced-body">
            {/* Diagnostic Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>{"系统状态"}</CardTitle>
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
                  {"刷新"}
                </Button>
              </CardHeader>
              <CardContent>
              {diagnosticsError && <p className="error-text">{diagnosticsError}</p>}
              {alertError && <p className="error-text">{alertError}</p>}
              {flowError && <p className="error-text">{flowError}</p>}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">{"运行时长"}</div>
                  <div className="metric-value">
                    {diagnostics ? `${Math.round(diagnostics.uptime_seconds / 60)}m` : "\u2014"}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"总任务"}</div>
                  <div className="metric-value">{diagnostics?.task_total ?? 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"运行中"}</div>
                  <div className="metric-value">{diagnostics?.task_counts.running ?? 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"成功"}</div>
                  <div className="metric-value">{diagnostics?.task_counts.success ?? 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">{"失败"}</div>
                  <div className="metric-value">{diagnostics?.task_counts.failed ?? 0}</div>
                </div>
                <div className={`metric-card ${alerts?.state === "degraded" ? "warn" : "ok"}`}>
                  <div className="metric-label">{"健康状态"}</div>
                  <div className="metric-value">
                    {alerts?.state === "ok"
                      ? "正常"
                      : alerts?.state === "degraded"
                        ? "异常"
                        : "\u2014"}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Latest flow preview */}
            <Card>
              <CardHeader>
                <CardTitle>{"最新流程"}</CardTitle>
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
                  {"回放"}
                </Button>
              </CardHeader>
              <CardContent>
              {latestFlow?.session_id ? (
                <>
                  <p className="hint-text mb-2">
                    {`Session #${latestFlow.session_id.slice(0, 8)} \u00B7 ${latestFlow.step_count} 步骤 \u00B7 ${latestFlow.source_event_count} 事件`}
                  </p>
                  <ul className="task-list vlist-flow" role="list" aria-label="最新流程步骤">
                    {latestFlow.steps.slice(0, 10).map((step) => (
                      <li key={step.step_id} className="task-item">
                        <div className="task-item-info">
                          <strong>{`${step.step_id} \u00B7 ${step.action}`}</strong>
                          <p>{step.url || step.selector || step.value_ref || "无详细信息"}</p>
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
                  title="暂无流程数据"
                  description="执行一次录制命令后，流程数据会自动出现在这里。"
                />
              )}
              </CardContent>
            </Card>

            {/* Flow draft editor */}
            <Card>
              <CardHeader>
                <CardTitle>{"流程编辑器"}</CardTitle>
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
                  {"断点恢复时重放前置等待条件"}
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
            <h3 className="launch-section-title">{"证据与状态在这里闭环"}</h3>
            <p className="hint-text">
              {"右侧优先回答两个问题：哪一步失败了、失败前后页面是什么样子。先看时间轴，再决定是否回到左侧做修正。"}
            </p>
          </CardContent>
        </Card>
        {stepEvidenceError && <p className="error-text">{stepEvidenceError}</p>}
        <details className="workshop-advanced-panel">
          <summary>{"进阶调试证据（可选）"}</summary>
          <div className="workshop-advanced-body">
            {/* Evidence Timeline */}
            <div>
              <h3 className="section-title">{"证据时间轴"}</h3>
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
                  title="暂无证据截图"
                  description="执行回放后，每个步骤的前后截图会出现在这里。"
                />
              ) : (
                <ul className="task-list vlist-lg" role="list" aria-label="证据时间轴">
                  {evidenceTimeline.map((item) => (
                    <li key={item.step_id}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`task-item task-item-button flex-col ${selectedStepId === item.step_id ? "active" : ""}`}
                        aria-label="查看步骤证据详情"
                        data-uiq-ignore-button-inventory="repeated-step-evidence-selection"
                        onClick={() => onSelectStep(item.step_id)}
                      >
                        <div className="flex-row justify-between gap-2">
                          <strong>{`${item.step_id} \u00B7 ${item.action ?? "未知"}`}</strong>
                          <span className="hint-text">{`${item.ok ? "通过" : "失败"} \u00B7 ${item.duration_ms ?? 0}ms`}</span>
                        </div>
                        <p className="hint-text">{item.detail ?? "无详细信息"}</p>
                        <EvidenceScreenshotPair
                          beforeImageUrl={item.screenshot_before_data_url}
                          afterImageUrl={item.screenshot_after_data_url}
                          beforeAlt={`执行前-${item.step_id}`}
                          afterAlt={`执行后-${item.step_id}`}
                        />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Step Evidence Detail */}
            <div>
              <h3 className="section-title">{"步骤证据详情"}</h3>
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
                  title="选择步骤查看证据"
                  description="从时间轴或编辑器中选择一个步骤，即可查看详细证据。"
                />
              ) : !stepEvidence ? (
                <p className="hint-text p-4">{`步骤 ${selectedStepId} 暂无证据数据，请先试跑或回放。`}</p>
              ) : (
                <Card tone="raised">
                  <div className="field-group">
                    <div className="form-row">
                      <div className="field">
                        <span className="field-label">{"步骤"}</span>
                        <span className="text-sm">{`${stepEvidence.step_id} \u00B7 ${stepEvidence.action ?? "未知"}`}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">{"状态"}</span>
                        <span className="text-sm">{stepEvidence.ok ? "通过" : "失败"}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">{"耗时"}</span>
                        <span className="text-sm">{`${stepEvidence.duration_ms ?? 0}ms`}</span>
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">{"匹配选择器"}</span>
                      <span className="hint-text">{`[${stepEvidence.selector_index ?? "-"}] ${stepEvidence.matched_selector ?? "无"}`}</span>
                    </div>
                    {stepEvidence.detail && (
                      <div className="field">
                        <span className="field-label">{"详情"}</span>
                        <span className="hint-text">{stepEvidence.detail}</span>
                      </div>
                    )}
                    <EvidenceScreenshotPair
                      beforeImageUrl={stepEvidence.screenshot_before_data_url}
                      afterImageUrl={stepEvidence.screenshot_after_data_url}
                      beforeAlt={`证据-执行前-${stepEvidence.step_id}`}
                      afterAlt={`证据-执行后-${stepEvidence.step_id}`}
                      emptyHint="该步骤无截图证据"
                    />
                    <details className="debug-disclosure">
                      <summary>{"高级调试：Selector 回退轨迹"}</summary>
                      <div className="debug-disclosure-body">
                        {stepEvidence.fallback_trail.length === 0 ? (
                          <p className="hint-text">{"该步骤未触发回退。"}</p>
                        ) : (
                          <ul
                            className="task-list vlist-sm"
                            role="list"
                            aria-label="选择器回退轨迹"
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
                                      ? "匹配成功"
                                      : `失败: ${attempt.error ?? "未知错误"}`}
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
