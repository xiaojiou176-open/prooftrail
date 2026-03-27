/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, it as caseIt, describe, expect, vi } from "vitest"
import { TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID } from "../constants/testIds"
import type { Task, UniversalRun } from "../types"
import TaskCenterView from "./TaskCenterView"

vi.mock("../components/TaskListPanel", () => ({
  default: () => <div data-testid="mock-task-list-panel" />,
}))

vi.mock("../components/TerminalPanel", () => ({
  default: () => <div data-testid="mock-terminal-panel" />,
}))

vi.mock("../components/EmptyState", () => ({
  default: () => <div data-testid="mock-empty-state" />,
}))

const sampleTask: Task = {
  task_id: "task-123",
  command_id: "cmd-001",
  status: "running",
  requested_by: null,
  attempt: 1,
  max_attempts: 1,
  created_at: "2026-01-01T00:00:00Z",
  started_at: "2026-01-01T00:00:00Z",
  finished_at: null,
  exit_code: null,
  message: null,
  output_tail: "",
}

const createRun = (overrides: Partial<UniversalRun>): UniversalRun => ({
  run_id: "run-12345678",
  template_id: "tpl-12345678",
  status: "running",
  wait_context: null,
  step_cursor: 1,
  params: {},
  task_id: null,
  last_error: null,
  artifacts_ref: {},
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  logs: [],
  ...overrides,
})

describe("TaskCenterView waiting state branches", () => {
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

  const renderRunView = (run: UniversalRun, onSubmitOtp = vi.fn()) => {
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
          runs={[run]}
          selectedRunId={run.run_id}
          onSelectedRunIdChange={() => {}}
          otpCode=""
          onOtpCodeChange={() => {}}
          onSubmitOtp={onSubmitOtp}
          onGoToLaunch={() => {}}
        />
      )
    })

    const templateTab = container.querySelector(
      `button[data-testid="${TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID}"]`
    ) as HTMLButtonElement
    expect(templateTab).not.toBeNull()
    act(() => {
      templateTab.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    return onSubmitOtp
  }

  caseIt("shows continue-only CTA for provider-protected waiting_user", () => {
    const run = createRun({
      status: "waiting_user",
      wait_context: { reason_code: "provider_protected_payment_step" },
    })
    const onSubmitOtp = renderRunView(run)

    expect(container.textContent).toContain(
      "The payment page is already open. Complete the provider step manually, then continue here."
    )
    expect(container.querySelector('[data-testid="task-center-waiting-card"] input')).toBeNull()
    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Continue"
    )
    expect(continueButton).not.toBeUndefined()

    act(() => {
      continueButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onSubmitOtp).toHaveBeenCalledWith(run.run_id, run.status, run.wait_context)
  }, 20000)

  caseIt("keeps supplemental input flow for non-provider waiting_user", () => {
    const run = createRun({
      status: "waiting_user",
      wait_context: { reason_code: "manual_input_required" },
    })
    renderRunView(run)

    expect(container.textContent).toContain(
      "This run is waiting for additional input. Provide it and submit to continue:"
    )
    const input = container.querySelector(
      '[data-testid="task-center-waiting-card"] input'
    ) as HTMLInputElement | null
    expect(input?.placeholder).toBe("Enter additional input")
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Submit"
    )
    expect(submitButton).not.toBeUndefined()
  })

  caseIt("keeps otp input flow for waiting_otp", () => {
    const run = createRun({
      status: "waiting_otp",
      wait_context: { reason_code: "otp_required" },
    })
    renderRunView(run)

    expect(container.textContent).toContain(
      "This run is waiting for an OTP. Enter it and submit to continue:"
    )
    const input = container.querySelector(
      '[data-testid="task-center-waiting-card"] input'
    ) as HTMLInputElement | null
    expect(input?.placeholder).toBe("Enter OTP")
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Submit"
    )
    expect(submitButton).not.toBeUndefined()
  })
})
