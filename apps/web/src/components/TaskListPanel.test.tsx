/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Task } from "../types"
import TaskListPanel from "./TaskListPanel"

function buildTask(taskId: string, status: Task["status"]): Task {
  return {
    task_id: taskId,
    command_id: "cmd-demo",
    status,
    requested_by: null,
    attempt: 1,
    max_attempts: 3,
    created_at: "2026-03-01T00:00:00Z",
    started_at: null,
    finished_at: null,
    exit_code: null,
    message: null,
    output_tail: "",
  }
}

describe("TaskListPanel", () => {
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

  it("renders task list and wires filter/refresh/cancel interactions", function () {
    const onSelectTask = vi.fn()
    const onCancelTask = vi.fn()
    const onRefresh = vi.fn()
    const onStatusFilterChange = vi.fn()
    const onCommandFilterChange = vi.fn()
    const onTaskLimitChange = vi.fn()

    const queued = buildTask("task-queued-1", "queued")
    const running = buildTask("task-running-1", "running")
    const success = buildTask("task-success-1", "success")

    act(() => {
      root.render(
        <TaskListPanel
          tasks={[queued, running, success]}
          taskState="success"
          selectedTaskId={running.task_id}
          taskErrorMessage=""
          onSelectTask={onSelectTask}
          onCancelTask={onCancelTask}
          onRefresh={onRefresh}
          statusFilter="all"
          onStatusFilterChange={onStatusFilterChange}
          commandFilter=""
          onCommandFilterChange={onCommandFilterChange}
          taskLimit={20}
          onTaskLimitChange={onTaskLimitChange}
        />
      )
    })

    const refreshButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "刷新"
    )
    act(() => {
      refreshButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onRefresh).toHaveBeenCalledTimes(1)

    const statusSelect = container.querySelector('select[aria-label="按状态过滤任务"]') as HTMLSelectElement
    act(() => {
      statusSelect.value = "running"
      statusSelect.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onStatusFilterChange).toHaveBeenCalledWith("running")

    const commandInput = container.querySelector(
      'input[aria-label="按命令编号筛选运行记录"]'
    ) as HTMLInputElement
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set
      setValue?.call(commandInput, "cmd-")
      commandInput.dispatchEvent(new Event("input", { bubbles: true }))
      commandInput.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onCommandFilterChange).toHaveBeenCalledWith("cmd-")

    const limitSelect = container.querySelector('select[aria-label="任务显示数量"]') as HTMLSelectElement
    act(() => {
      limitSelect.value = "50"
      limitSelect.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onTaskLimitChange).toHaveBeenCalledWith(50)

    const taskButtons = container.querySelectorAll(".task-item-info")
    expect(taskButtons.length).toBe(3)
    act(() => {
      taskButtons[0].dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onSelectTask).toHaveBeenCalledWith("task-queued-1")

    const cancelButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent === "取消"
    )
    expect(cancelButtons.length).toBe(2)
    act(() => {
      cancelButtons[0].dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onCancelTask).toHaveBeenCalledWith(queued)
  })

  it("shows actionable errors and empty/error branches", function () {
    act(() => {
      root.render(
        <TaskListPanel
          tasks={[]}
          taskState="empty"
          selectedTaskId=""
          taskErrorMessage="任务加载失败"
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefresh={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
          emptyTitle="暂无记录"
          emptyDescription="请先执行任务"
        />
      )
    })

    expect(container.textContent).toContain(
      "Issue: 任务加载失败. Suggested action: 点击“刷新”后重试，必要时重新发起运行. Troubleshooting: 查看右侧详情与“运行日志”"
    )
    expect(container.textContent).toContain("暂无记录")
    expect(container.textContent).toContain("请先执行任务")

    act(() => {
      root.render(
        <TaskListPanel
          tasks={[]}
          taskState="error"
          selectedTaskId=""
          taskErrorMessage=""
          onSelectTask={() => {}}
          onCancelTask={() => {}}
          onRefresh={() => {}}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          commandFilter=""
          onCommandFilterChange={() => {}}
          taskLimit={20}
          onTaskLimitChange={() => {}}
        />
      )
    })

    expect(container.textContent).toContain("Issue: 任务列表加载失败")
  })
})
