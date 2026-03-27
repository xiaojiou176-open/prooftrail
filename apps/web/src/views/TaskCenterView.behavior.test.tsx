/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { LogEntry, Task, UniversalRun } from "../types"
import TaskCenterView from "./TaskCenterView"

vi.mock("../components/TaskListPanel", () => ({
  default: () => <div data-testid="mock-task-list-panel" />,
}))

vi.mock("../components/TerminalPanel", () => ({
  default: () => <div data-testid="mock-terminal-panel" />,
}))

const sampleTask: Task = {
  task_id: "task-123",
  command_id: "cmd-001",
  status: "failed",
  requested_by: null,
  attempt: 1,
  max_attempts: 2,
  created_at: "2026-01-01T00:00:00Z",
  started_at: "2026-01-01T00:00:00Z",
  finished_at: "2026-01-01T00:10:00Z",
  exit_code: 1,
  message: "任务执行失败",
  output_tail: "trace",
}

const sampleLogs: LogEntry[] = [
  {
    id: "log-1",
    ts: "2026-01-01T00:00:00Z",
    level: "error",
    message: "step failed",
    commandId: "cmd-001",
  },
]

const runOne: UniversalRun = {
  run_id: "run-11111111",
  template_id: "tpl-11111111",
  status: "failed",
  wait_context: null,
  step_cursor: 2,
  params: {},
  task_id: null,
  last_error: "provider timeout",
  artifacts_ref: {},
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  logs: sampleLogs,
}

const runTwo: UniversalRun = {
  ...runOne,
  run_id: "run-22222222",
  status: "running",
  last_error: null,
  logs: [],
}

const waitingOtpRun: UniversalRun = {
  ...runOne,
  run_id: "run-waiting-otp",
  status: "waiting_otp",
  wait_context: { reason_code: "otp_required" },
  logs: [],
}

const providerProtectedRun: UniversalRun = {
  ...runOne,
  run_id: "run-provider-wait",
  status: "waiting_user",
  wait_context: { reason_code: "provider_protected_payment_step" },
  logs: [],
}

describe("TaskCenterView behavior", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  })

  it("renders command-run detail fields for message and exit code", function () {
    act(() => {
      root.render(
        <TaskCenterView
          tasks={[sampleTask]}
          taskState="success"
          selectedTaskId={sampleTask.task_id}
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefreshTasks={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          logs={[]}
          selectedTask={sampleTask}
          terminalRows={8}
          onTerminalRowsChange={() => {}}
          terminalFilter="all"
          onTerminalFilterChange={() => {}}
          autoScroll
          onAutoScrollChange={() => {}}
          onClearLogs={() => {}}
          runs={[]}
          selectedRunId=""
          onSelectedRunIdChange={() => {}}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={() => {}}
          onGoToLaunch={() => {}}
        />
      )
    })

    expect(container.textContent).toContain("任务执行失败")
    expect(container.textContent).toContain("退出码")
    expect(container.textContent).toContain("1")
  }, 20000)

  it("supports tab/list keyboard navigation and shows template run error/log sections", function () {
    const onSelectedRunIdChange = vi.fn()

    act(() => {
      root.render(
        <TaskCenterView
          tasks={[sampleTask]}
          taskState="success"
          selectedTaskId={sampleTask.task_id}
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefreshTasks={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          logs={sampleLogs}
          selectedTask={sampleTask}
          terminalRows={8}
          onTerminalRowsChange={() => {}}
          terminalFilter="all"
          onTerminalFilterChange={() => {}}
          autoScroll
          onAutoScrollChange={() => {}}
          onClearLogs={() => {}}
          runs={[runOne, runTwo]}
          selectedRunId={runOne.run_id}
          onSelectedRunIdChange={onSelectedRunIdChange}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={() => {}}
          onGoToLaunch={() => {}}
        />
      )
    })

    const tabs = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLButtonElement[]
    expect(tabs.length).toBeGreaterThanOrEqual(2)
    act(() => {
      tabs[0]?.focus()
      tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))
    })
    expect(document.activeElement).toBe(tabs[1])

    act(() => {
      tabs[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }))
    })
    expect(document.activeElement).toBe(tabs[0])

    act(() => {
      tabs[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const runList = container.querySelector('[role="listbox"]') as HTMLUListElement
    expect(runList).toBeInstanceOf(HTMLUListElement)

    act(() => {
      runList.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
      runList.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    })

    expect(onSelectedRunIdChange).toHaveBeenCalledWith(runTwo.run_id)
    expect(onSelectedRunIdChange).toHaveBeenCalledWith(runOne.run_id)
    expect(container.textContent).toContain("最后错误")
    expect(container.textContent).toContain("Suggested action:")
    expect(container.textContent).toContain("运行日志")
  })

  it("covers waiting-input actions and additional keyboard branches", function () {
    const onSelectedRunIdChange = vi.fn()
    const onSubmitOtp = vi.fn()

    act(() => {
      root.render(
        <TaskCenterView
          tasks={[sampleTask]}
          taskState="success"
          selectedTaskId={sampleTask.task_id}
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefreshTasks={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          logs={sampleLogs}
          selectedTask={sampleTask}
          terminalRows={8}
          onTerminalRowsChange={() => {}}
          terminalFilter="all"
          onTerminalFilterChange={() => {}}
          autoScroll
          onAutoScrollChange={() => {}}
          onClearLogs={() => {}}
          runs={[waitingOtpRun, providerProtectedRun]}
          selectedRunId={waitingOtpRun.run_id}
          onSelectedRunIdChange={onSelectedRunIdChange}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={onSubmitOtp}
          onGoToLaunch={() => {}}
        />
      )
    })

    const tabs = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLButtonElement[]
    act(() => {
      tabs[0]?.focus()
      tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    })
    expect(document.activeElement).toBe(tabs[1])

    act(() => {
      tabs[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }))
    })
    expect(document.activeElement).toBe(tabs[0])

    act(() => {
      tabs[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    })
    expect(container.querySelector('[data-testid="task-center-panel-template-runs"]')?.hasAttribute("hidden")).toBe(false)

    const runList = container.querySelector('[role="listbox"]') as HTMLUListElement
    act(() => {
      runList.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }))
      runList.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))
      runList.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }))
      runList.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }))
    })

    expect(onSelectedRunIdChange).toHaveBeenCalledWith(waitingOtpRun.run_id)
    expect(onSelectedRunIdChange).toHaveBeenCalledWith(providerProtectedRun.run_id)
    expect(container.textContent).toContain("该运行记录正在等待验证码，请输入后提交：")

    const otpInput = container.querySelector("#task-center-run-input") as HTMLInputElement
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "提交"
    )
    act(() => {
      otpInput.value = "123456"
      otpInput.dispatchEvent(new Event("input", { bubbles: true }))
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onSubmitOtp).toHaveBeenCalledWith(
      waitingOtpRun.run_id,
      waitingOtpRun.status,
      waitingOtpRun.wait_context
    )

    act(() => {
      root.render(
        <TaskCenterView
          tasks={[sampleTask]}
          taskState="success"
          selectedTaskId={sampleTask.task_id}
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefreshTasks={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          logs={sampleLogs}
          selectedTask={sampleTask}
          terminalRows={8}
          onTerminalRowsChange={() => {}}
          terminalFilter="all"
          onTerminalFilterChange={() => {}}
          autoScroll
          onAutoScrollChange={() => {}}
          onClearLogs={() => {}}
          runs={[waitingOtpRun, providerProtectedRun]}
          selectedRunId={providerProtectedRun.run_id}
          onSelectedRunIdChange={onSelectedRunIdChange}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={onSubmitOtp}
          onGoToLaunch={() => {}}
        />
      )
    })

    const templateTab = container.querySelector(
      '[data-testid="task-center-tab-template-runs"]'
    ) as HTMLButtonElement
    act(() => {
      templateTab.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(container.textContent).toContain("已打开支付页，请手动完成后点击继续")
    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "继续执行"
    )
    act(() => {
      continueButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onSubmitOtp).toHaveBeenCalledWith(
      providerProtectedRun.run_id,
      providerProtectedRun.status,
      providerProtectedRun.wait_context
    )
  })

  it("covers command/template empty detail states and launch redirect action", function () {
    const onGoToLaunch = vi.fn()

    act(() => {
      root.render(
        <TaskCenterView
          tasks={[]}
          taskState="success"
          selectedTaskId=""
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefreshTasks={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          logs={[]}
          selectedTask={null}
          terminalRows={8}
          onTerminalRowsChange={() => {}}
          terminalFilter="all"
          onTerminalFilterChange={() => {}}
          autoScroll
          onAutoScrollChange={() => {}}
          onClearLogs={() => {}}
          runs={[]}
          selectedRunId=""
          onSelectedRunIdChange={() => {}}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={() => {}}
          onGoToLaunch={onGoToLaunch}
        />
      )
    })

    expect(container.textContent).toContain("从左侧运行记录列表（命令）中选择一条记录查看详细信息和输出日志。")

    const templateTab = container.querySelector(
      '[data-testid="task-center-tab-template-runs"]'
    ) as HTMLButtonElement
    act(() => {
      templateTab.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(container.textContent).toContain("在快速启动页面选择模板并启动后，运行记录会出现在这里。")

    const launchButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "去快速启动"
    )
    act(() => {
      launchButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onGoToLaunch).toHaveBeenCalledTimes(1)

    act(() => {
      root.render(
        <TaskCenterView
          tasks={[]}
          taskState="success"
          selectedTaskId=""
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefreshTasks={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          logs={[]}
          selectedTask={null}
          terminalRows={8}
          onTerminalRowsChange={() => {}}
          terminalFilter="all"
          onTerminalFilterChange={() => {}}
          autoScroll
          onAutoScrollChange={() => {}}
          onClearLogs={() => {}}
          runs={[runOne]}
          selectedRunId=""
          onSelectedRunIdChange={() => {}}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={() => {}}
          onGoToLaunch={onGoToLaunch}
        />
      )
    })
    act(() => {
      templateTab.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(container.textContent).toContain("从左侧运行记录列表（模板）中选择一条记录查看其状态、参数和日志。")
  })
})
