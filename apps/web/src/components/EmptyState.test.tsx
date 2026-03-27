/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import EmptyState from "./EmptyState"

describe("EmptyState", () => {
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

  it("renders title only when optional content is missing", function () {
    act(() => {
      root.render(<EmptyState title="暂无结果" />)
    })

    expect(container.querySelector(".empty-state-title")?.textContent).toBe("暂无结果")
    expect(container.querySelector(".empty-state-icon")).toBeNull()
    expect(container.querySelector(".empty-state-desc")).toBeNull()
    expect(container.querySelector(".empty-state-action")).toBeNull()
  })

  it("renders icon, description and action button and triggers callback", function () {
    const onClick = vi.fn()

    act(() => {
      root.render(
        <EmptyState
          icon={<span data-testid="icon">{"i"}</span>}
          title="空状态"
          description="请先执行命令"
          action={{ label: "立即执行", onClick }}
        />
      )
    })

    expect(container.querySelector("[data-testid='icon']")?.textContent).toBe("i")
    expect(container.querySelector(".empty-state-desc")?.textContent).toBe("请先执行命令")
    const button = container.querySelector("button") as HTMLButtonElement
    expect(button.textContent).toBe("立即执行")
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
