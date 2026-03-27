import { memo, type ChangeEvent } from "react"
import { isCancelableStatus } from "../features/command-center/status"
import { formatActionableErrorMessage } from "../shared/errorFormatter"
import type { Task, TaskState } from "../types"
import EmptyState from "./EmptyState"
import { Button, Input, Select } from "@uiq/ui"

const statusLabelMap: Record<Task["status"], string> = {
  queued: "排队中",
  running: "运行中",
  success: "成功",
  failed: "失败",
  cancelled: "已取消",
}

interface TaskListPanelProps {
  tasks: Task[]
  taskState: TaskState
  selectedTaskId: string
  taskErrorMessage: string
  onSelectTask: (taskId: string) => void
  onCancelTask: (task: Task) => void
  onRefresh: () => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  commandFilter: string
  onCommandFilterChange: (value: string) => void
  taskLimit: number
  onTaskLimitChange: (value: number) => void
  listTitle?: string
  sourceLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  refreshTestId?: string
}

function TaskListPanel({
  tasks,
  taskState,
  selectedTaskId,
  taskErrorMessage,
  onSelectTask,
  onCancelTask,
  onRefresh,
  statusFilter,
  onStatusFilterChange,
  commandFilter,
  onCommandFilterChange,
  taskLimit,
  onTaskLimitChange,
  listTitle = "运行记录",
  sourceLabel = "命令执行",
  emptyTitle = "暂无运行记录",
  emptyDescription = "执行命令后，运行记录会出现在这里。",
  refreshTestId,
}: TaskListPanelProps) {
  const formatTaskErrorMessage = (message: string) =>
    formatActionableErrorMessage(message, {
      action: "点击“刷新”后重试，必要时重新发起运行",
      troubleshootingEntry: "查看右侧详情与“运行日志”",
    })

  return (
    <>
      <div className="form-row justify-between">
        <h2 className="section-title m-0">{listTitle}</h2>
        <Button
          variant="ghost"
          size="sm"
          data-testid={refreshTestId}
          onClick={onRefresh}
          data-uiq-ignore-button-inventory="task-list-refresh-secondary-action"
        >
          {"刷新"}
        </Button>
      </div>
      <div className="task-filters">
        <Select
          className="task-filter-control"
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onStatusFilterChange(e.target.value)}
          aria-label="按状态过滤任务"
          data-uiq-ignore-button-inventory="task-list-filter-control"
        >
          <option value="all">{"全部状态"}</option>
          <option value="queued">{"排队中"}</option>
          <option value="running">{"运行中"}</option>
          <option value="success">{"成功"}</option>
          <option value="failed">{"失败"}</option>
          <option value="cancelled">{"已取消"}</option>
        </Select>
        <Input
          className="task-filter-control"
          type="text"
          placeholder="按命令编号筛选（命令 ID）"
          value={commandFilter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCommandFilterChange(e.target.value)}
          aria-label="按命令编号筛选运行记录"
          data-uiq-ignore-button-inventory="task-list-filter-control"
        />
        <Select
          className="task-filter-control w-select-limit"
          value={String(taskLimit)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onTaskLimitChange(Number(e.target.value))}
          aria-label="任务显示数量"
          data-uiq-ignore-button-inventory="task-list-filter-control"
        >
          <option value="20">{"20 条"}</option>
          <option value="50">{"50 条"}</option>
          <option value="100">{"100 条"}</option>
          <option value="200">{"200 条"}</option>
        </Select>
      </div>
      {taskErrorMessage && <p className="error-text">{formatTaskErrorMessage(taskErrorMessage)}</p>}
      {taskState === "loading" && (
        <div className="loading-card min-h-60">
          <div className="spinner" />
        </div>
      )}
      <ul className="task-list" aria-label="运行记录列表（命令）">
        {tasks.map((task) => (
          <li
            key={task.task_id}
            className={`task-item ${selectedTaskId === task.task_id ? "active" : ""}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="task-item-info text-left"
              aria-label="查看运行记录详情"
              data-uiq-ignore-button-inventory="repeated-run-row-selection"
              aria-current={selectedTaskId === task.task_id ? "true" : undefined}
              onClick={() => onSelectTask(task.task_id)}
            >
              <strong>{`${sourceLabel} \u00B7 ${task.command_id}`}</strong>
              <p>
                {statusLabelMap[task.status]}
                {" \u00B7 记录 #"}
                {task.task_id.slice(0, 8)}
              </p>
            </Button>
            {isCancelableStatus(task.status) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancelTask(task)}
                data-uiq-ignore-button-inventory="task-list-cancel-secondary-action"
              >
                {"取消"}
              </Button>
            )}
          </li>
        ))}
        {taskState === "empty" && (
          <li className="task-empty">
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
              title={emptyTitle}
              description={emptyDescription}
            />
          </li>
        )}
        {taskState === "error" && (
          <li className="task-empty error-text">
            {formatTaskErrorMessage(taskErrorMessage || "任务列表加载失败")}
          </li>
        )}
      </ul>
    </>
  )
}

export default memo(TaskListPanel)
