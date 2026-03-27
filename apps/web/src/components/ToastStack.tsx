import { memo } from "react"
import type { LogLevel, UiNotice } from "../types"
import { Toast, ToastIcon, ToastMessage, ToastViewport } from "@uiq/ui"

const iconMap: Record<LogLevel, string> = {
  info: "i",
  success: "\u2713",
  warn: "!",
  error: "\u2717",
}

interface ToastStackProps {
  notices: UiNotice[]
  onDismiss: (id: string) => void
}

function ToastStack({ notices, onDismiss }: ToastStackProps) {
  if (notices.length === 0) return null

  return (
    <ToastViewport role="region" aria-label="系统通知" aria-live="polite" aria-atomic="false">
      {notices.map((notice) => (
        <Toast
          key={notice.id}
          level={notice.level}
          onClick={() => onDismiss(notice.id)}
          aria-label={`关闭通知: ${notice.message}`}
        >
          <ToastIcon aria-hidden="true">
            {iconMap[notice.level]}
          </ToastIcon>
          <ToastMessage>{notice.message}</ToastMessage>
        </Toast>
      ))}
    </ToastViewport>
  )
}

export default memo(ToastStack)
