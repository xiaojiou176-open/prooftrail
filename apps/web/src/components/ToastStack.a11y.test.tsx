/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import ToastStack from "./ToastStack"

function noop() {}

describe("ToastStack accessibility", () => {
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
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  })

  it("renders notices as keyboard-focusable dismiss buttons in a live region", function () {
    const html = renderToStaticMarkup(
      <ToastStack
        notices={[
          { id: "n1", level: "success", message: "流程草稿保存成功" },
          { id: "n2", level: "error", message: "任务执行失败" },
        ]}
        onDismiss={noop}
      />
    )

    expect(html).toContain('role="region"')
    expect(html).toContain('aria-label="系统通知"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-label="关闭通知: 流程草稿保存成功"')
    expect(html).toContain('aria-label="关闭通知: 任务执行失败"')
  })

  it("returns null for empty notices and wires dismiss callback per toast", function () {
    const dismiss = vi.fn()
    const emptyHtml = renderToStaticMarkup(<ToastStack notices={[]} onDismiss={dismiss} />)
    expect(emptyHtml).toBe("")

    act(() => {
      root.render(
        <ToastStack
          notices={[
            { id: "info-1", level: "info", message: "等待开始" },
            { id: "warn-1", level: "warn", message: "重试中" },
          ]}
          onDismiss={dismiss}
        />
      )
    })

    const buttons = container.querySelectorAll<HTMLButtonElement>("button.toast-item")
    expect(buttons).toHaveLength(2)
    expect(container.textContent).toContain("i")
    expect(container.textContent).toContain("!")

    act(() => {
      buttons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(dismiss).toHaveBeenCalledWith("info-1")
  })
})
