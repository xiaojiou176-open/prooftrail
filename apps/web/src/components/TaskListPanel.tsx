import { memo, type ChangeEvent } from "react"
import { isCancelableStatus } from "../features/command-center/status"
import { formatActionableErrorMessage } from "../shared/errorFormatter"
import type { Task, TaskState } from "../types"
import EmptyState from "./EmptyState"
import { Button, Input, Select } from "@uiq/ui"

const statusLabelMap: Record<Task["status"], string> = {
  queued: "Queued",
  running: "Running",
  success: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
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
  listTitle = "Run Records",
  sourceLabel = "Command Run",
  emptyTitle = "No run records yet",
  emptyDescription = "Run a command to see records here.",
  refreshTestId,
}: TaskListPanelProps) {
  const formatTaskErrorMessage = (message: string) =>
    formatActionableErrorMessage(message, {
      action: 'Click "Refresh" and try again, or start a new run if needed.',
      troubleshootingEntry: "Check the details pane and the run log.",
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
          {"Refresh"}
        </Button>
      </div>
      <div className="task-filters">
        <Select
          className="task-filter-control"
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onStatusFilterChange(e.target.value)}
          aria-label="Filter tasks by status"
          data-uiq-ignore-button-inventory="task-list-filter-control"
        >
          <option value="all">{"All statuses"}</option>
          <option value="queued">{"Queued"}</option>
          <option value="running">{"Running"}</option>
          <option value="success">{"Succeeded"}</option>
          <option value="failed">{"Failed"}</option>
          <option value="cancelled">{"Cancelled"}</option>
        </Select>
        <Input
          className="task-filter-control"
          type="text"
          placeholder="Filter by command ID"
          value={commandFilter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCommandFilterChange(e.target.value)}
          aria-label="Filter run records by command ID"
          data-uiq-ignore-button-inventory="task-list-filter-control"
        />
        <Select
          className="task-filter-control w-select-limit"
          value={String(taskLimit)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onTaskLimitChange(Number(e.target.value))}
          aria-label="Run count limit"
          data-uiq-ignore-button-inventory="task-list-filter-control"
        >
          <option value="20">{"20 records"}</option>
          <option value="50">{"50 records"}</option>
          <option value="100">{"100 records"}</option>
          <option value="200">{"200 records"}</option>
        </Select>
      </div>
      {taskErrorMessage && <p className="error-text">{formatTaskErrorMessage(taskErrorMessage)}</p>}
      {taskState === "loading" && (
        <div className="loading-card min-h-60">
          <div className="spinner" />
        </div>
      )}
      <ul className="task-list" aria-label="Run records list (command)">
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
              aria-label="Open run record details"
              data-uiq-ignore-button-inventory="repeated-run-row-selection"
              aria-current={selectedTaskId === task.task_id ? "true" : undefined}
              onClick={() => onSelectTask(task.task_id)}
            >
              <strong>{`${sourceLabel} \u00B7 ${task.command_id}`}</strong>
              <p>
                {statusLabelMap[task.status]}
                {" \u00B7 Record #"}
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
                {"Cancel"}
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
            {formatTaskErrorMessage(taskErrorMessage || "Run list loading failed")}
          </li>
        )}
      </ul>
    </>
  )
}

export default memo(TaskListPanel)
