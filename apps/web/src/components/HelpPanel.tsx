import { memo, useCallback, useEffect, useId, useRef } from "react"
import { HELP_PANEL_RESTART_ONBOARDING_TEST_ID } from "../constants/testIds"
import type { AppView } from "../hooks/useAppStore"
import { Button } from "@uiq/ui"

interface HelpPanelProps {
  activeView: AppView
  onClose: () => void
  onRestartTour: () => void
}

const viewHelp: Record<
  AppView,
  { title: string; desc: string; steps: { title: string; desc: string }[] }
> = {
  launch: {
    title: "快速启动",
    desc: "从这里选择你要做的事，填好必要信息后即可一键开始自动化操作。",
    steps: [
      { title: "选一个要完成的操作", desc: "浏览命令卡片并按顶部分类筛选，找到当前要跑的任务。" },
      {
        title: "填入必要信息",
        desc: "在右侧参数区填写网站地址、访问凭证（API Token）等信息；不确定时先用默认值。",
      },
      { title: "点击“开始运行”", desc: "点击命令卡片上的按钮后，运行任务会立即进入后台排队。" },
      { title: "去任务中心看进度", desc: "切换到「任务中心」查看实时状态、日志和结果。" },
    ],
  },
  tasks: {
    title: "任务中心",
    desc: "这里会集中显示所有任务，方便你追踪进度、定位问题并确认是否成功。",
    steps: [
      {
        title: "先筛选再定位",
        desc: "用顶部状态筛选和命令编号（命令 ID）输入框，快速找到目标任务。",
      },
      { title: "点开任务看详情", desc: "点击任意任务后，右侧会展示输入参数、状态和结果摘要。" },
      { title: "打开日志排查", desc: "底部日志面板会实时刷新，支持按级别过滤错误信息。" },
      { title: "必要时停止运行", desc: "运行中的任务可以点击「取消」立即停止。" },
    ],
  },
  workshop: {
    title: "流程工坊",
    desc: "在这里查看和调整自动化步骤，并用截图证据确认每一步是否按预期执行。",
    steps: [
      { title: "先看系统状态", desc: "顶部会显示服务是否在线以及关键运行指标。" },
      {
        title: "编辑流程步骤",
        desc: "可修改步骤顺序、操作类型和页面定位方式（页面元素定位规则）。",
      },
      { title: "单步试跑并验证", desc: "先试跑单个步骤，再根据结果和截图确认是否正确。" },
      { title: "对照证据时间轴", desc: "右侧可查看每一步执行前后的截图对比。" },
    ],
  },
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

function HelpPanel({ activeView, onClose, onRestartTour }: HelpPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusedRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()
  const info = viewHelp[activeView]

  const handlePanelKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const panel = panelRef.current
      if (!panel) return
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab") return

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      if (focusables.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const activeElement = document.activeElement as HTMLElement | null
      const currentIndex = focusables.indexOf(activeElement ?? focusables[0])
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusables.length - 1
          : currentIndex - 1
        : currentIndex === focusables.length - 1
          ? 0
          : currentIndex + 1

      event.preventDefault()
      focusables[nextIndex]?.focus()
    },
    [onClose]
  )

  useEffect(() => {
    if (typeof document === "undefined") return
    const activeElement = document.activeElement
    previousFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null
    closeButtonRef.current?.focus()

    window.addEventListener("keydown", handlePanelKeyDown)
    return () => {
      window.removeEventListener("keydown", handlePanelKeyDown)
      previousFocusedRef.current?.focus()
    }
  }, [handlePanelKeyDown])

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="help-panel-overlay"
        onClick={onClose}
        aria-label="关闭帮助面板"
        data-uiq-ignore-button-inventory="overlay-dismiss-surface"
      />
      <aside
        ref={panelRef}
        className="help-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
      >
        <div className="help-panel-header">
          <h2 id={titleId}>{"帮助"}</h2>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="关闭帮助面板"
            data-uiq-ignore-button-inventory="panel-close-control-not-business-action"
          >
            {"\u2715"}
          </Button>
        </div>
        <div className="help-panel-body">
          {/* Current view help */}
          <div className="help-section">
            <h3>{info.title}</h3>
            <p id={descId}>{info.desc}</p>
          </div>

          <div className="help-section">
            <h3>{"操作步骤"}</h3>
            <ol className="help-step-list">
              {info.steps.map((s, i) => (
                <li key={i} className="help-step-item">
                  <span className="help-step-num">{i + 1}</span>
                  <div className="help-step-content">
                    <strong>{s.title}</strong>
                    <p>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="help-section">
            <h3>{"常见问题"}</h3>
            <details className="help-faq-item">
              <summary>{"命令执行后看不到结果？"}</summary>
              <p>
                {
                  "结论：运行记录未成功写入任务中心列表。动作：先切换到「任务中心」点击“刷新”后重试。排查入口：若仍为空，查看任务中心运行日志与后端服务状态。"
                }
              </p>
            </details>
            <details className="help-faq-item">
              <summary>{"如何配置目标站点地址？"}</summary>
              <p>
                {
                  "在「快速启动」右侧参数区填写“你要操作的网站地址（UIQ_BASE_URL）”即可。默认值是本地开发地址。"
                }
              </p>
            </details>
            <details className="help-faq-item">
              <summary>{"什么是流程草稿？"}</summary>
              <p>
                {"开始录制后，系统会自动保存一份“可编辑步骤清单”。你可以在流程工坊里修改并回放。"}
              </p>
            </details>
            <details className="help-faq-item">
              <summary>{"API Token 是什么？"}</summary>
              <p>{"这是访问后端的访问凭证。只有在后端开启鉴权时才需要填写。"}</p>
            </details>
          </div>

          <div className="help-section">
            <h3>{"其他"}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid={HELP_PANEL_RESTART_ONBOARDING_TEST_ID}
              onClick={onRestartTour}
            >
              {"重新走一遍首用引导"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(HelpPanel)
