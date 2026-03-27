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
    title: "Quick Launch",
    desc: "Choose the task you want to complete here, fill the required inputs, and start an automated run with one click.",
    steps: [
      {
        title: "Choose the job you want to complete",
        desc: "Browse the command cards and use the category tabs to find the task you want to run.",
      },
      {
        title: "Fill the required inputs",
        desc: "Use the parameter panel to enter the target URL, credentials, and other required values. Keep the defaults if you are unsure.",
      },
      {
        title: 'Click "Run"',
        desc: "The task is queued immediately after you click the command button.",
      },
      {
        title: "Review progress in Task Center",
        desc: "Switch to Task Center to inspect status, logs, and results in real time.",
      },
    ],
  },
  tasks: {
    title: "Task Center",
    desc: "This view centralizes all tasks so you can track progress, locate failures, and confirm outcomes.",
    steps: [
      {
        title: "Filter first, then locate the target task",
        desc: "Use the status filter and command ID filter to narrow the list before opening a record.",
      },
      {
        title: "Open a record for details",
        desc: "Selecting a task reveals its parameters, status, and summary on the detail side.",
      },
      {
        title: "Open the logs when something looks wrong",
        desc: "The log panel updates in real time and lets you filter by severity.",
      },
      {
        title: "Stop a task when needed",
        desc: 'Running tasks expose a "Cancel" action for immediate stop.',
      },
    ],
  },
  workshop: {
    title: "Flow Workshop",
    desc: "Inspect and edit automation steps here, then verify each step with screenshot evidence.",
    steps: [
      {
        title: "Start with system health",
        desc: "The top section shows whether services are online and highlights key run metrics.",
      },
      {
        title: "Edit the flow steps",
        desc: "You can adjust step order, action type, and the selectors used to locate page elements.",
      },
      {
        title: "Replay one step and verify it",
        desc: "Replay a single step first, then confirm the result with the latest output and screenshots.",
      },
      {
        title: "Compare the evidence timeline",
        desc: "Use the right-side timeline to review before/after screenshots for each step.",
      },
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
        aria-label="Close help panel"
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
          <h2 id={titleId}>{"Help"}</h2>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close help panel"
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
            <h3>{"Steps"}</h3>
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
            <h3>{"Common Questions"}</h3>
            <details className="help-faq-item">
              <summary>{"I ran a command but cannot see the result"}</summary>
              <p>
                {
                  'Conclusion: the run record did not land in Task Center. Action: switch to "Task Center", click "Refresh", and try again. Troubleshooting: if the list is still empty, inspect the run log and backend service status.'
                }
              </p>
            </details>
            <details className="help-faq-item">
              <summary>{"How do I configure the target site URL?"}</summary>
              <p>
                {
                  'Use the "Target site URL (UIQ_BASE_URL)" field in the Quick Launch parameter panel. The default value points to local development.'
                }
              </p>
            </details>
            <details className="help-faq-item">
              <summary>{"What is a flow draft?"}</summary>
              <p>{"After a recording run starts, the system keeps an editable step list that you can revise and replay in Flow Workshop."}</p>
            </details>
            <details className="help-faq-item">
              <summary>{"What is the API token?"}</summary>
              <p>{"It is the credential used to access the backend API. You only need it when backend auth is enabled."}</p>
            </details>
          </div>

          <div className="help-section">
            <h3>{"Other Actions"}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid={HELP_PANEL_RESTART_ONBOARDING_TEST_ID}
              onClick={onRestartTour}
            >
              {"Restart the first-use guide"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(HelpPanel)
