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
              <h2 className="launch-hero-title">{"Start the main run first, then open deeper controls only when you need them"}</h2>
              <p className="launch-hero-body">
                {
                  "This screen prioritizes the shortest completion path: choose a command, confirm the parameters, and submit the run. Templates, first-use guidance, and advanced settings stay available without competing with the primary flow."
                }
              </p>
              <div className="launch-hero-badges">
                <Badge variant="secondary">{`${commands.length} command entrypoints`}</Badge>
                <Badge variant={templates.length > 0 ? "success" : "default"}>
                  {templates.length > 0 ? `${templates.length} template accelerators` : "Templates can be added later"}
                </Badge>
                <Badge>{sidebarCollapsed ? "Parameter rail collapsed" : "Parameter rail expanded"}</Badge>
              </div>
            </div>
            <div className="launch-hero-panels">
              <div className="launch-hero-panel">
                <span className="launch-hero-panel-label">{"Current primary action"}</span>
                <strong className="launch-hero-panel-value">
                  {isFirstUseActive ? "Finish the first successful run" : "Choose one command and run it now"}
                </strong>
                <p className="launch-hero-panel-hint">
                  {isFirstUseActive
                    ? "Follow the guide through configuration, execution, and result verification first."
                    : "Start from the command grid and use templates only as optional accelerators."}
                </p>
              </div>
              <div className="launch-hero-panel accent">
                <span className="launch-hero-panel-label">{"Current template focus"}</span>
                <strong className="launch-hero-panel-value">
                  {selectedTemplate ? selectedTemplate.name : "No template selected"}
                </strong>
                <p className="launch-hero-panel-hint">
                  {selectedTemplate
                    ? "Template parameters take over only after the main flow is stable."
                    : "Switch to template launch below only after you already have a stable flow."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isFirstUseActive && (
          <Card className="launch-first-use-card mb-4">
            <div className="section-divider">
              <span className="section-divider-line" />
              <span className="section-divider-label">{"First-use guide"}</span>
              <span className="section-divider-line" />
            </div>
            <CardContent className="p-4">
              <p className="text-muted">
                {firstUseStage === "welcome" &&
                  'Welcome. Start with step 1 by clicking the button below and configuring the run parameters.'}
                {firstUseStage === "configure" &&
                  "Step 1: configure baseUrl, startUrl, and successSelector in the parameter rail. You can only continue once the configuration is valid."}
                {firstUseStage === "run" &&
                  "Step 2: choose a command or template and click Run. The guide advances to step 3 after a run is detected."}
                {firstUseStage === "verify" &&
                  "Step 3: switch to Task Center and confirm the success or failure result. The guide only completes after a visible outcome exists."}
              </p>
              <p className="text-muted">
                {`Progress: configure ${firstUseProgress.configValid ? "✅" : "⬜"} / trigger a run ${firstUseProgress.runTriggered ? "✅" : "⬜"} / review a result ${firstUseProgress.resultSeen ? "✅" : "⬜"}`}
              </p>
              <div className="form-actions">
                {firstUseStage === "welcome" && (
                  <Button
                    size="sm"
                    data-testid={QUICK_LAUNCH_FIRST_USE_START_TEST_ID}
                    onClick={() => onFirstUseStageChange("configure")}
                  >
                    {"Start step 1"}
                  </Button>
                )}
                {canGoConfigure && (
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid={QUICK_LAUNCH_FIRST_USE_LOCATE_CONFIG_TEST_ID}
                    onClick={() => onFirstUseStageChange("configure")}
                  >
                    {"Go to configuration"}
                  </Button>
                )}
                {(isCurrentStage("configure") || isCurrentStage("run")) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onFirstUseStageChange("run")}
                    disabled={!canGoRun}
                  >
                    {"Configuration done, continue to run"}
                  </Button>
                )}
                {canShowComplete && (
                  <Button
                    size="sm"
                    onClick={onCompleteFirstUse}
                    disabled={!canCompleteFirstUse}
                    data-uiq-ignore-button-inventory="first-use-complete-secondary-action"
                  >
                    {"Complete the first-use guide"}
                  </Button>
                )}
              </div>
              {firstUseStage === "configure" && !firstUseProgress.configValid && (
                <p className="text-muted">
                  {"Enter a valid baseUrl, an optional startUrl, and a successSelector before continuing."}
                </p>
              )}
              {firstUseStage === "verify" && !firstUseProgress.resultSeen && (
                <p className="text-muted">
                  {"No success or failure result is visible yet. Wait for the task to finish in Task Center first."}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <section className="launch-primary-zone" aria-label="Primary command zone">
          <div className="launch-section-head">
            <div>
              <p className="launch-section-kicker">{"Primary Actions"}</p>
              <h3 className="launch-section-title">{"Choose one entrypoint and start a run immediately"}</h3>
            </div>
            <p className="launch-section-desc">
              {"The main flow lives here: filter commands, launch the run, and get immediate feedback in one place."}
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
          <section className="templates-section" aria-label="Template accelerator zone">
            <div className="launch-section-head compact">
              <div>
                <p className="launch-section-kicker">{"Optional Accelerator"}</p>
                <h3 className="launch-section-title">{"Template quick launch"}</h3>
              </div>
              <p className="launch-section-desc">
                {"Use templates to accelerate a flow only after the underlying manual path is already stable."}
              </p>
            </div>
            <div className="section-divider">
              <span className="section-divider-line" />
              <span className="section-divider-label">{"Template quick launch"}</span>
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
                      <Badge>{`${tpl.params_schema.length} params`}</Badge>
                    </div>
                    <p className="template-meta">
                      {`Flow template: ${tpl.flow_id.slice(0, 8)}`}
                      {tpl.policies?.otp?.required && " / OTP"}
                      {` / Timeout ${tpl.policies?.timeout_seconds ?? 120}s`}
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
                                placeholder={param.required ? "Required" : "Optional"}
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
                            {"Start run"}
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
                          {"Select template"}
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
          <section className="templates-section" aria-label="Template accelerator zone">
            <div className="launch-section-head compact">
              <div>
                <p className="launch-section-kicker">{"Optional Accelerator"}</p>
                <h3 className="launch-section-title">{"Template quick launch"}</h3>
              </div>
              <p className="launch-section-desc">
                {"No templates exist yet. You can still run the main flow directly and add templates later in Flow Workshop."}
              </p>
            </div>
            <div className="section-divider">
              <span className="section-divider-line" />
              <span className="section-divider-label">{"Template quick launch"}</span>
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
              title="No templates yet"
              description="Templates freeze a set of steps and parameters so that you can launch repeatable runs faster. Record and save a flow in Flow Workshop to create one."
            />
          </section>
        )}
      </div>
      <aside className={`quick-launch-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="quick-launch-sidebar-shell">
          <div className="quick-launch-sidebar-head">
            <div>
              <p className="launch-section-kicker">{"Configuration Rail"}</p>
              <h3 className="launch-section-title">{"Run parameters"}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? "Expand parameter rail" : "Collapse parameter rail"}
              aria-expanded={!sidebarCollapsed}
              aria-controls={paramsPanelId}
            >
              {sidebarCollapsed ? "\u276F" : "\u276E"}
            </Button>
          </div>
          <p className="quick-launch-sidebar-desc">
            {"Keep environment, credentials, and success markers here. Run the main path first, then fine-tune the details."}
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
