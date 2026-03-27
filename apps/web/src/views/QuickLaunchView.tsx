import { memo, useState, type ChangeEvent } from "react"
import CommandGrid from "../components/CommandGrid"
import EmptyState from "../components/EmptyState"
import type { ParamsState } from "../components/ParamsPanel"
import ParamsPanel from "../components/ParamsPanel"
import { Badge, Button, Card, CardContent, Input } from "@uiq/ui"
import {
  QUICK_LAUNCH_FIRST_USE_LOCATE_CONFIG_TEST_ID,
  QUICK_LAUNCH_FIRST_USE_START_TEST_ID,
} from "../constants/testIds"
import type { FirstUseStage } from "../hooks/useAppStore"
import type { Command, CommandCategory, CommandState, UniversalTemplate } from "../types"

interface QuickLaunchViewProps {
  commands: Command[]
  commandState: CommandState
  activeTab: "all" | CommandCategory
  submittingId: string
  feedbackText: string
  onActiveTabChange: (tab: "all" | CommandCategory) => void
  onRunCommand: (command: Command) => void
  params: ParamsState
  onParamsChange: (patch: Partial<ParamsState>) => void
  // Studio template integration
  templates: UniversalTemplate[]
  onCreateRun: () => void
  onRunParamsChange: (params: Record<string, string>) => void
  runParams: Record<string, string>
  onSelectedTemplateIdChange: (id: string) => void
  selectedTemplateId: string
  isFirstUseActive: boolean
  firstUseStage: FirstUseStage
  firstUseProgress: {
    configValid: boolean
    runTriggered: boolean
    resultSeen: boolean
  }
  canCompleteFirstUse: boolean
  onFirstUseStageChange: (stage: FirstUseStage) => void
  onCompleteFirstUse: () => void
}

const buildTemplateFieldId = (templateId: string, key: string) =>
  `template-param-${templateId}-${key}`.replace(/[^a-zA-Z0-9-_]/g, "-")

function QuickLaunchView({
  commands,
  commandState,
  activeTab,
  submittingId,
  feedbackText,
  onActiveTabChange,
  onRunCommand,
  params,
  onParamsChange,
  templates,
  onCreateRun,
  onRunParamsChange,
  runParams,
  onSelectedTemplateIdChange,
  selectedTemplateId,
  isFirstUseActive,
  firstUseStage,
  firstUseProgress,
  canCompleteFirstUse,
  onFirstUseStageChange,
  onCompleteFirstUse,
}: QuickLaunchViewProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const paramsPanelId = "quick-launch-params-panel"
  const selectedTemplate = templates.find((item) => item.template_id === selectedTemplateId) ?? null
  const isCurrentStage = (stage: FirstUseStage) => firstUseStage === stage
  const canGoConfigure = isCurrentStage("welcome") || isCurrentStage("configure")
  const canGoRun =
    (isCurrentStage("configure") || isCurrentStage("run")) && firstUseProgress.configValid
  const canShowComplete = firstUseStage === "verify"

  return (
    <div className="quick-launch-view">
      <div className="quick-launch-main">
        <Card className="launch-hero-card">
          <CardContent className="launch-hero-grid p-4">
            <div className="launch-hero-copy">
              <p className="launch-hero-kicker">{"Command Center"}</p>
              <h2 className="launch-hero-title">{"先启动主任务，再按需展开更深的控制面板"}</h2>
              <p className="launch-hero-body">
                {
                  "这里优先聚焦最短完成路径：选一个命令、确认参数、提交运行。模板、首用引导和高级参数都保留，但不再和主流程抢注意力。"
                }
              </p>
              <div className="launch-hero-badges">
                <Badge variant="secondary">{`${commands.length} 个任务入口`}</Badge>
                <Badge variant={templates.length > 0 ? "success" : "default"}>
                  {templates.length > 0 ? `${templates.length} 个模板增强器` : "模板可稍后补充"}
                </Badge>
                <Badge>{sidebarCollapsed ? "参数面板已收起" : "参数面板已展开"}</Badge>
              </div>
            </div>
            <div className="launch-hero-panels">
              <div className="launch-hero-panel">
                <span className="launch-hero-panel-label">{"当前主动作"}</span>
                <strong className="launch-hero-panel-value">
                  {isFirstUseActive ? "完成首跑引导" : "选择一个命令并立即执行"}
                </strong>
                <p className="launch-hero-panel-hint">
                  {isFirstUseActive
                    ? "先按引导把配置、运行和结果确认走通。"
                    : "从命令区发起任务，模板区作为可选加速器。"}
                </p>
              </div>
              <div className="launch-hero-panel accent">
                <span className="launch-hero-panel-label">{"当前模板焦点"}</span>
                <strong className="launch-hero-panel-value">
                  {selectedTemplate ? selectedTemplate.name : "未选中模板"}
                </strong>
                <p className="launch-hero-panel-hint">
                  {selectedTemplate
                    ? "模板参数会在主流程稳定后接管快速启动。"
                    : "如果你已经有稳定流程，可以在下方切换到模板启动。"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isFirstUseActive && (
          <Card className="launch-first-use-card mb-4">
            <div className="section-divider">
              <span className="section-divider-line" />
              <span className="section-divider-label">{"首用引导"}</span>
              <span className="section-divider-line" />
            </div>
            <CardContent className="p-4">
              <p className="text-muted">
                {firstUseStage === "welcome" &&
                  "欢迎使用。先点击下面按钮开始第 1 步：配置运行参数。"}
                {firstUseStage === "configure" &&
                  "第 1 步：在右侧参数面板配置 baseUrl/startUrl/successSelector，满足有效性后才能进入运行。"}
                {firstUseStage === "run" &&
                  "第 2 步：选择一个命令或模板并点击运行。检测到已触发运行后会进入第 3 步验证。"}
                {firstUseStage === "verify" &&
                  "第 3 步：到任务中心确认成功/失败结果。看到结果后才能完成首跑。"}
              </p>
              <p className="text-muted">
                {`步骤状态：配置 ${firstUseProgress.configValid ? "✅" : "⬜"} / 触发运行 ${firstUseProgress.runTriggered ? "✅" : "⬜"} / 查看结果 ${firstUseProgress.resultSeen ? "✅" : "⬜"}`}
              </p>
              <div className="form-actions">
                {firstUseStage === "welcome" && (
                  <Button
                    size="sm"
                    data-testid={QUICK_LAUNCH_FIRST_USE_START_TEST_ID}
                    onClick={() => onFirstUseStageChange("configure")}
                  >
                    {"开始第 1 步"}
                  </Button>
                )}
                {canGoConfigure && (
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid={QUICK_LAUNCH_FIRST_USE_LOCATE_CONFIG_TEST_ID}
                    onClick={() => onFirstUseStageChange("configure")}
                  >
                    {"定位到配置"}
                  </Button>
                )}
                {(isCurrentStage("configure") || isCurrentStage("run")) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onFirstUseStageChange("run")}
                    disabled={!canGoRun}
                  >
                    {"我已配置，进入运行"}
                  </Button>
                )}
                {canShowComplete && (
                  <Button
                    size="sm"
                    onClick={onCompleteFirstUse}
                    disabled={!canCompleteFirstUse}
                    data-uiq-ignore-button-inventory="first-use-complete-secondary-action"
                  >
                    {"完成首用引导"}
                  </Button>
                )}
              </div>
              {firstUseStage === "configure" && !firstUseProgress.configValid && (
                <p className="text-muted">
                  {"请先填写有效的 baseUrl / startUrl（可留空）并设置 successSelector。"}
                </p>
              )}
              {firstUseStage === "verify" && !firstUseProgress.resultSeen && (
                <p className="text-muted">
                  {"尚未检测到成功/失败结果，请先在任务中心等待任务完成。"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <section className="launch-primary-zone" aria-label="主任务区">
          <div className="launch-section-head">
            <div>
              <p className="launch-section-kicker">{"Primary Actions"}</p>
              <h3 className="launch-section-title">{"选择一个任务入口并立即发起运行"}</h3>
            </div>
            <p className="launch-section-desc">
              {"默认先完成主任务；分类筛选和运行反馈都在这一层完成。"}
            </p>
          </div>
          <CommandGrid
            commands={commands}
            commandState={commandState}
            activeTab={activeTab}
            submittingId={submittingId}
            feedbackText={feedbackText}
            onActiveTabChange={onActiveTabChange}
            onRunCommand={onRunCommand}
          />
        </section>

        {/* Templates section */}
        {templates.length > 0 && (
          <section className="templates-section" aria-label="模板增强区">
            <div className="launch-section-head compact">
              <div>
                <p className="launch-section-kicker">{"Optional Accelerator"}</p>
                <h3 className="launch-section-title">{"模板快捷启动"}</h3>
              </div>
              <p className="launch-section-desc">
                {"当你的主流程已经稳定时，再切换到模板加速；这里默认是增强器，不是首屏主角。"}
              </p>
            </div>
            <div className="section-divider">
              <span className="section-divider-line" />
              <span className="section-divider-label">{"模板快捷启动"}</span>
              <span className="section-divider-line" />
            </div>
            <div className="templates-grid">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.template_id
                return (
                  <Card
                    key={tpl.template_id}
                    className={`template-card ${isSelected ? "active" : ""}`}
                    style={isSelected ? { borderColor: "var(--accent)" } : undefined}
                  >
                    <div className="template-card-header">
                      <h4>{tpl.name}</h4>
                      <Badge>{`${tpl.params_schema.length} 参数`}</Badge>
                    </div>
                    <p className="template-meta">
                      {`流程模板: ${tpl.flow_id.slice(0, 8)}`}
                      {tpl.policies?.otp?.required && " / 验证码"}
                      {` / 超时 ${tpl.policies?.timeout_seconds ?? 120}s`}
                    </p>
                    {isSelected && (
                      <div className="mt-3">
                        <div className="field-group">
                          {tpl.params_schema.map((param) => (
                            <div key={param.key} className="field">
                              <label
                                className="field-label"
                                htmlFor={buildTemplateFieldId(tpl.template_id, param.key)}
                              >
                                {param.description || param.key}
                              </label>
                              <Input
                                id={buildTemplateFieldId(tpl.template_id, param.key)}
                                type={param.type === "secret" ? "password" : "text"}
                                value={runParams[param.key] ?? ""}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  onRunParamsChange({ ...runParams, [param.key]: e.target.value })
                                }
                                placeholder={param.required ? "必填" : "选填"}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="form-actions">
                          <Button
                            size="sm"
                            onClick={onCreateRun}
                            data-uiq-ignore-button-inventory="template-run-secondary-cta"
                          >
                            {"启动运行任务"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isSelected && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          data-uiq-ignore-button-inventory="template-select-secondary-cta"
                          onClick={() => {
                            onSelectedTemplateIdChange(tpl.template_id)
                            onRunParamsChange(tpl.defaults ?? {})
                          }}
                        >
                          {"选择模板"}
                        </Button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {templates.length === 0 && commandState === "success" && (
          <section className="templates-section" aria-label="模板增强区">
            <div className="launch-section-head compact">
              <div>
                <p className="launch-section-kicker">{"Optional Accelerator"}</p>
                <h3 className="launch-section-title">{"模板快捷启动"}</h3>
              </div>
              <p className="launch-section-desc">
                {"当前还没有模板；主流程依然可以直接运行，模板可以在流程工坊里稍后补齐。"}
              </p>
            </div>
            <div className="section-divider">
              <span className="section-divider-line" />
              <span className="section-divider-label">{"模板快捷启动"}</span>
              <span className="section-divider-line" />
            </div>
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
                  <path d="M12 8v8M8 12h8" />
                </svg>
              }
              title="暂无模板"
              description="模板会把一组步骤和参数固定下来，帮助你快速启动运行任务。在流程工坊录制并保存后，即可创建流程模板。"
            />
          </section>
        )}
      </div>
      <aside className={`quick-launch-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="quick-launch-sidebar-shell">
          <div className="quick-launch-sidebar-head">
            <div>
              <p className="launch-section-kicker">{"Configuration Rail"}</p>
              <h3 className="launch-section-title">{"运行参数"}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? "展开参数面板" : "收起参数面板"}
              aria-expanded={!sidebarCollapsed}
              aria-controls={paramsPanelId}
            >
              {sidebarCollapsed ? "\u276F" : "\u276E"}
            </Button>
          </div>
          <p className="quick-launch-sidebar-desc">
            {"把运行环境、凭证和成功标记收在这里。主流程先运行，配置细节随后精调。"}
          </p>
          <div id={paramsPanelId} className="quick-launch-sidebar-panel" hidden={sidebarCollapsed}>
            {!sidebarCollapsed && <ParamsPanel params={params} onChange={onParamsChange} />}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default memo(QuickLaunchView)
