import {
  memo,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react"
import DetailFieldRow from "../components/DetailFieldRow"
import EmptyState from "../components/EmptyState"
import LogStream from "../components/LogStream"
import RunDetailCard from "../components/RunDetailCard"
import TaskListPanel from "../components/TaskListPanel"
import TerminalPanel from "../components/TerminalPanel"
import { Badge, Button, Card, Input, TabsList, TabsTrigger } from "@uiq/ui"
import {
  TASK_CENTER_COMMAND_RUNS_REFRESH_TEST_ID,
  TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID,
  TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID,
  TASK_CENTER_TAB_COMMAND_RUNS_TEST_ID,
  TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID,
  TASK_CENTER_TEMPLATE_RUNS_REFRESH_TEST_ID,
} from "../constants/testIds"
import { formatActionableErrorMessage } from "../shared/errorFormatter"
import type {
  LogEntry,
  LogLevel,
  RunRecordSource,
  RunRecordViewHint,
  Task,
  TaskState,
  UniversalRun,
} from "../types"
import { RUN_RECORD_SOURCE_LABEL, UNIVERSAL_RUN_STATUS_LABEL } from "../types"

interface TaskCenterViewProps {
  tasks: Task[]
  taskState: TaskState
  selectedTaskId: string
  taskErrorMessage: string
  onSelectTask: (taskId: string) => void
  onCancelTask: (task: Task) => void
  onRefreshTasks: () => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  commandFilter: string
  onCommandFilterChange: (value: string) => void
  taskLimit: number
  onTaskLimitChange: (value: number) => void
  // Terminal
  logs: LogEntry[]
  selectedTask: Task | null
  terminalRows: number
  onTerminalRowsChange: (rows: number) => void
  terminalFilter: "all" | LogLevel
  onTerminalFilterChange: (filter: "all" | LogLevel) => void
  autoScroll: boolean
  onAutoScrollChange: (value: boolean) => void
  onClearLogs: () => void
  // Runs integration
  runs: UniversalRun[]
  selectedRunId: string
  onSelectedRunIdChange: (id: string) => void
  otpCode: string
  onOtpCodeChange: (code: string) => void
  onSubmitOtp: (
    runId: string,
    status: UniversalRun["status"],
    waitContext?: UniversalRun["wait_context"]
  ) => void
  onGoToLaunch: () => void
}

const runStatusLabel: Record<UniversalRun["status"], string> = UNIVERSAL_RUN_STATUS_LABEL

const runRecordSourceLabel: Record<RunRecordSource, string> = RUN_RECORD_SOURCE_LABEL

const runRecordDetailHint: RunRecordViewHint = {
  title: "运行记录详情",
  sections: ["source", "status", "progress", "timeline", "output"],
}

const runRecordDetailHintText = `${runRecordDetailHint.title}：来源 / 状态 / 进度 / 时间 / 输出`
const runInputFieldId = "task-center-run-input"
const subTabIds = {
  tasks: "task-center-tab-command-runs",
  runs: "task-center-tab-template-runs",
} as const

const subPanelIds = {
  tasks: "task-center-panel-command-runs",
  runs: "task-center-panel-template-runs",
} as const

const subTabOrder: Array<"tasks" | "runs"> = ["tasks", "runs"]
const subTabCount = subTabOrder.length
const PROVIDER_PROTECTED_PAYMENT_STEP_REASON = "provider_protected_payment_step"

const getRunInputCopy = (status: UniversalRun["status"]): { hint: string; placeholder: string } => {
  if (status === "waiting_otp") {
    return {
      hint: "该运行记录正在等待验证码，请输入后提交：",
      placeholder: "输入验证码",
    }
  }
  return {
    hint: "该运行记录正在等待补充输入，请填写后提交：",
    placeholder: "输入补充信息",
  }
}

const isProviderProtectedPaymentWait = (run: UniversalRun | null): boolean => {
  return (
    run?.status === "waiting_user" &&
    run.wait_context?.reason_code === PROVIDER_PROTECTED_PAYMENT_STEP_REASON
  )
}

function TaskCenterView({
  tasks,
  taskState,
  selectedTaskId,
  taskErrorMessage,
  onSelectTask,
  onCancelTask,
  onRefreshTasks,
  statusFilter,
  onStatusFilterChange,
  commandFilter,
  onCommandFilterChange,
  taskLimit,
  onTaskLimitChange,
  logs,
  selectedTask,
  terminalRows,
  onTerminalRowsChange,
  terminalFilter,
  onTerminalFilterChange,
  autoScroll,
  onAutoScrollChange,
  onClearLogs,
  runs,
  selectedRunId,
  onSelectedRunIdChange,
  otpCode,
  onOtpCodeChange,
  onSubmitOtp,
  onGoToLaunch,
}: TaskCenterViewProps) {
  const [subTab, setSubTab] = useState<"tasks" | "runs">("tasks")
  const subTabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectedRun = runs.find((r) => r.run_id === selectedRunId) ?? null
  const selectedRunIsProviderProtectedWait = isProviderProtectedPaymentWait(selectedRun)
  const runInputCopy = selectedRun ? getRunInputCopy(selectedRun.status) : null
  const selectedRunIndex = useMemo(
    () => runs.findIndex((run) => run.run_id === selectedRunId),
    [runs, selectedRunId]
  )
  const selectedRunOptionId = selectedRun
    ? `task-center-template-option-${selectedRun.run_id}`
    : undefined
  const runningTasks = tasks.filter((task) => task.status === "running").length
  const waitingRuns = runs.filter(
    (run) => run.status === "waiting_otp" || run.status === "waiting_user"
  ).length
  const taskFailures = tasks.filter((task) => task.status === "failed").length

  const focusSubTab = useCallback((targetIndex: number) => {
    const normalizedIndex = ((targetIndex % subTabCount) + subTabCount) % subTabCount
    subTabRefs.current[normalizedIndex]?.focus()
  }, [])

  const activateSubTab = useCallback((targetIndex: number) => {
    const normalizedIndex = ((targetIndex % subTabCount) + subTabCount) % subTabCount
    setSubTab(subTabOrder[normalizedIndex])
  }, [])

  const handleSubTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        focusSubTab(index + 1)
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        focusSubTab(index - 1)
        return
      }
      if (event.key === "Home") {
        event.preventDefault()
        focusSubTab(0)
        return
      }
      if (event.key === "End") {
        event.preventDefault()
        focusSubTab(subTabCount - 1)
        return
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        activateSubTab(index)
      }
    },
    [activateSubTab, focusSubTab]
  )

  const handleTemplateRunsListKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLUListElement>) => {
      if (runs.length === 0) return
      const currentIndex = selectedRunIndex >= 0 ? selectedRunIndex : 0
      let nextIndex = currentIndex

      if (event.key === "ArrowDown") {
        event.preventDefault()
        nextIndex = (currentIndex + 1) % runs.length
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        nextIndex = (currentIndex - 1 + runs.length) % runs.length
      } else if (event.key === "Home") {
        event.preventDefault()
        nextIndex = 0
      } else if (event.key === "End") {
        event.preventDefault()
        nextIndex = runs.length - 1
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onSelectedRunIdChange(runs[currentIndex].run_id)
        return
      } else {
        return
      }

      onSelectedRunIdChange(runs[nextIndex].run_id)
    },
    [onSelectedRunIdChange, runs, selectedRunIndex]
  )

  const formatRunErrorMessage = (message: string): string =>
    formatActionableErrorMessage(message, {
      action: "按当前步骤修正输入后重试",
      troubleshootingEntry: "查看本页“运行日志”与任务中心详情",
    })

  return (
    <div
      className="task-center-view"
      id="app-view-tasks-panel"
      role="tabpanel"
      aria-labelledby="console-tab-tasks"
    >
      <div className="task-list-column">
        <Card className="task-center-hero-card">
          <div className="task-center-hero">
            <div className="task-center-hero-copy">
              <p className="launch-section-kicker">{"Operations Deck"}</p>
              <h2 className="task-center-hero-title">{"先定位当前任务，再沿着状态、详情和终端收敛问题"}</h2>
              <p className="task-center-hero-body">
                {
                  "左侧负责筛选与切换运行记录，右侧聚焦当前上下文，底部终端负责解释执行过程。默认先看主任务，再进入更深的调试动作。"
                }
              </p>
            </div>
            <div className="task-center-hero-stats">
              <div className="task-center-stat">
                <span className="task-center-stat-label">{"运行中"}</span>
                <strong className="task-center-stat-value">{runningTasks}</strong>
              </div>
              <div className="task-center-stat">
                <span className="task-center-stat-label">{"等待输入"}</span>
                <strong className="task-center-stat-value">{waitingRuns}</strong>
              </div>
              <div className="task-center-stat">
                <span className="task-center-stat-label">{"失败记录"}</span>
                <strong className="task-center-stat-value danger">{taskFailures}</strong>
              </div>
            </div>
          </div>
        </Card>
        {/* Sub-tabs for command/template run records */}
        <div role="tablist" aria-label="任务中心运行记录类型">
          <TabsList className="task-center-subtabs">
            <TabsTrigger
            ref={(node: HTMLButtonElement | null) => {
              subTabRefs.current[0] = node
            }}
            id={subTabIds.tasks}
            active={subTab === "tasks"}
            className="task-center-subtab-trigger"
            role="tab"
            aria-selected={subTab === "tasks"}
            aria-controls={subPanelIds.tasks}
            tabIndex={subTab === "tasks" ? 0 : -1}
            onClick={() => setSubTab("tasks")}
            onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => handleSubTabKeyDown(event, 0)}
            data-testid={TASK_CENTER_TAB_COMMAND_RUNS_TEST_ID}
          >
            {"运行记录（命令）"}
            <span className="task-center-subtab-count">{tasks.length}</span>
            </TabsTrigger>
            <TabsTrigger
            ref={(node: HTMLButtonElement | null) => {
              subTabRefs.current[1] = node
            }}
            id={subTabIds.runs}
            active={subTab === "runs"}
            className="task-center-subtab-trigger"
            role="tab"
            aria-selected={subTab === "runs"}
            aria-controls={subPanelIds.runs}
            tabIndex={subTab === "runs" ? 0 : -1}
            onClick={() => setSubTab("runs")}
            onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => handleSubTabKeyDown(event, 1)}
            data-testid={TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID}
          >
            {"运行记录（模板）"}
            <span className="task-center-subtab-count">{runs.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div
          id={subPanelIds.tasks}
          role="tabpanel"
          aria-labelledby={subTabIds.tasks}
          hidden={subTab !== "tasks"}
          data-testid={TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID}
        >
          <TaskListPanel
            tasks={tasks}
            taskState={taskState}
            selectedTaskId={selectedTaskId}
            taskErrorMessage={taskErrorMessage}
            onSelectTask={onSelectTask}
            onCancelTask={onCancelTask}
            onRefresh={onRefreshTasks}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            commandFilter={commandFilter}
            onCommandFilterChange={onCommandFilterChange}
            taskLimit={taskLimit}
            onTaskLimitChange={onTaskLimitChange}
            listTitle="运行记录"
            sourceLabel={runRecordSourceLabel.command}
            emptyTitle="暂无运行记录"
            emptyDescription="在快速启动执行命令后，运行记录会出现在这里。"
            refreshTestId={TASK_CENTER_COMMAND_RUNS_REFRESH_TEST_ID}
          />
        </div>
        <div
          id={subPanelIds.runs}
          role="tabpanel"
          aria-labelledby={subTabIds.runs}
          hidden={subTab !== "runs"}
          data-testid={TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID}
        >
          <div className="form-row justify-between">
            <h2 className="section-title m-0">{"运行记录"}</h2>
            <Button
              variant="ghost"
              size="sm"
              data-testid={TASK_CENTER_TEMPLATE_RUNS_REFRESH_TEST_ID}
              onClick={onRefreshTasks}
            >
              {"刷新"}
            </Button>
          </div>
          {runs.length === 0 ? (
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                </svg>
              }
              title="暂无运行记录"
              description="在快速启动页面选择模板并启动后，运行记录会出现在这里。"
              action={{ label: "去快速启动", onClick: onGoToLaunch }}
            />
          ) : (
            <ul
              className="task-list"
              role="listbox"
              aria-label="运行记录列表（模板）"
              aria-activedescendant={selectedRunOptionId}
              tabIndex={0}
              onKeyDown={handleTemplateRunsListKeyDown}
            >
              {runs.map((run) => (
                <li
                  key={run.run_id}
                  id={`task-center-template-option-${run.run_id}`}
                  className={`task-item ${selectedRunId === run.run_id ? "active" : ""}`}
                  role="option"
                  aria-selected={selectedRunId === run.run_id}
                  onClick={() => onSelectedRunIdChange(run.run_id)}
                >
                  <div className="task-item-info">
                    <strong>{`${runRecordSourceLabel.template} \u00B7 记录 #${run.run_id.slice(0, 8)}`}</strong>
                    <p>{`${runStatusLabel[run.status]} \u00B7 步骤 ${run.step_cursor}`}</p>
                  </div>
                  <Badge variant={run.status === "success" ? "success" : "default"}>
                    {runStatusLabel[run.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="task-detail-column">
        <Card className="task-center-summary-card">
          <div className="task-center-summary-row">
            <div>
              <p className="launch-section-kicker">{"Current Focus"}</p>
              <h3 className="launch-section-title">
                {subTab === "tasks" ? "命令运行上下文" : "模板运行上下文"}
              </h3>
            </div>
            <Badge variant={subTab === "tasks" ? "secondary" : "success"}>
              {subTab === "tasks" ? "命令主线" : "模板主线"}
            </Badge>
          </div>
          <p className="task-center-summary-desc">
            {subTab === "tasks"
              ? "优先确认当前任务状态、错误与输出，再决定是否取消或重试。"
              : "优先确认模板运行是否需要输入、等待恢复或查看步骤日志。"}
          </p>
        </Card>

        {subTab === "tasks" ? (
          selectedTask ? (
            <RunDetailCard
              title={`运行记录 #${selectedTask.task_id.slice(0, 8)}`}
              status={selectedTask.status}
              isSuccess={selectedTask.status === "success"}
              detailHint={runRecordDetailHintText}
            >
              <DetailFieldRow
                fields={[
                  { label: "来源", value: runRecordSourceLabel.command },
                  { label: "命令编号（命令 ID）", value: selectedTask.command_id },
                  {
                    label: "尝试",
                    value: `${selectedTask.attempt} / ${selectedTask.max_attempts}`,
                  },
                ]}
              />
              <DetailFieldRow
                fields={[
                  { label: "创建时间", value: new Date(selectedTask.created_at).toLocaleString() },
                  selectedTask.finished_at
                    ? {
                        label: "完成时间",
                        value: new Date(selectedTask.finished_at).toLocaleString(),
                      }
                    : null,
                ]}
              />
              {selectedTask.message && (
                <div className="field">
                  <span className="field-label">{"消息"}</span>
                  <span className="hint-text">{selectedTask.message}</span>
                </div>
              )}
              {selectedTask.exit_code !== null && selectedTask.exit_code !== undefined && (
                <div className="field">
                  <span className="field-label">{"退出码"}</span>
                  <span className="text-sm">{selectedTask.exit_code}</span>
                </div>
              )}
            </RunDetailCard>
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
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6M9 13h4" />
                </svg>
              }
              title="选择一条运行记录查看详情"
              description="从左侧运行记录列表（命令）中选择一条记录查看详细信息和输出日志。"
            />
          )
        ) : selectedRun ? (
          <RunDetailCard
            title={`运行记录 #${selectedRun.run_id.slice(0, 8)}`}
            status={runStatusLabel[selectedRun.status]}
            isSuccess={selectedRun.status === "success"}
            detailHint={runRecordDetailHintText}
          >
            <DetailFieldRow
              fields={[
                { label: "来源", value: runRecordSourceLabel.template },
                { label: "模板编号（模板 ID）", value: selectedRun.template_id.slice(0, 12) },
                { label: "步骤进度", value: `第 ${selectedRun.step_cursor} 步` },
              ]}
            />
            <DetailFieldRow
              fields={[
                { label: "创建时间", value: new Date(selectedRun.created_at).toLocaleString() },
              ]}
            />
            {selectedRun.last_error && (
              <div className="field">
                <span className="field-label">{"最后错误"}</span>
                <span className="error-text">{formatRunErrorMessage(selectedRun.last_error)}</span>
              </div>
            )}
            {(selectedRun.status === "waiting_otp" || selectedRun.status === "waiting_user") && (
              <Card tone="raised" className="mt-3 p-3" data-testid="task-center-waiting-card">
                <p className="hint-text mb-2">
                  {selectedRunIsProviderProtectedWait
                    ? "已打开支付页，请手动完成后点击继续"
                    : runInputCopy?.hint}
                </p>
                {selectedRunIsProviderProtectedWait ? (
                  <Button
                    size="sm"
                    data-uiq-ignore-button-inventory="waiting-user-continue-secondary-action"
                    onClick={() =>
                      onSubmitOtp(selectedRun.run_id, selectedRun.status, selectedRun.wait_context)
                    }
                  >
                    {"继续执行"}
                  </Button>
                ) : (
                  <div className="field-row">
                    <label className="field-label" htmlFor={runInputFieldId}>
                      {selectedRun.status === "waiting_otp" ? "验证码" : "补充输入"}
                    </label>
                    <Input
                      id={runInputFieldId}
                      className="flex-1"
                      type="text"
                      placeholder={runInputCopy?.placeholder}
                      value={otpCode}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => onOtpCodeChange(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        onSubmitOtp(
                          selectedRun.run_id,
                          selectedRun.status,
                          selectedRun.wait_context
                        )
                      }
                    >
                      {"提交"}
                    </Button>
                  </div>
                )}
              </Card>
            )}
            {selectedRun.logs && selectedRun.logs.length > 0 && (
              <div className="mt-3">
                <h3 className="section-subtitle">{"运行日志"}</h3>
                <LogStream logs={selectedRun.logs} />
              </div>
            )}
          </RunDetailCard>
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
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6M9 13h4" />
              </svg>
            }
            title="选择一条运行记录查看详情"
            description="从左侧运行记录列表（模板）中选择一条记录查看其状态、参数和日志。"
          />
        )}
      </div>

      <div className="task-terminal-column task-terminal-stack">
        <TerminalPanel
          logs={logs}
          selectedTask={selectedTask}
          terminalRows={terminalRows}
          onTerminalRowsChange={onTerminalRowsChange}
          terminalFilter={terminalFilter}
          onTerminalFilterChange={onTerminalFilterChange}
          autoScroll={autoScroll}
          onAutoScrollChange={onAutoScrollChange}
          onClear={onClearLogs}
        />
      </div>
    </div>
  )
}

export default memo(TaskCenterView)
