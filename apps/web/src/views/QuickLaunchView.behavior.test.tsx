/* @vitest-environment jsdom */

import { fireEvent } from "@testing-library/react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { UniversalTemplate } from "../types"
import QuickLaunchView from "./QuickLaunchView"

vi.mock("../components/CommandGrid", () => ({
  default: () => <div data-testid="mock-command-grid" />,
}))

vi.mock("../components/ParamsPanel", () => ({
  default: () => <div data-testid="mock-params-panel" />,
}))

vi.mock("../components/EmptyState", () => ({
  default: ({ title }: { title: string }) => <div data-testid="mock-empty-state">{title}</div>,
}))

const template: UniversalTemplate = {
  template_id: "tpl-1",
  flow_id: "flow-123456",
  name: "模板A",
  params_schema: [{ key: "email", type: "email", required: true }],
  defaults: { email: "demo@example.com" },
  policies: {
    retries: 0,
    timeout_seconds: 120,
    otp: {
      required: true,
      provider: "manual",
      timeout_seconds: 120,
      regex: "\\d{6}",
      sender_filter: "",
      subject_filter: "",
    },
    branches: {},
  },
  created_by: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const optionalTemplate: UniversalTemplate = {
  ...template,
  template_id: "tpl-optional",
  name: "模板B",
  params_schema: [{ key: "note", type: "string", required: false }],
  defaults: null,
  policies: {
    ...template.policies,
    otp: {
      ...template.policies.otp,
      required: false,
    },
  },
}

describe("QuickLaunchView behavior", () => {
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

  it("drives first-use stage actions", function () {
    const onFirstUseStageChange = vi.fn()

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[]}
          onCreateRun={() => {}}
          onRunParamsChange={() => {}}
          runParams={{}}
          onSelectedTemplateIdChange={() => {}}
          selectedTemplateId=""
          isFirstUseActive
          firstUseStage="welcome"
          firstUseProgress={{ configValid: false, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={onFirstUseStageChange}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "开始第 1 步"
    )
    const locateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "定位到配置"
    )

    act(() => {
      startButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      locateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onFirstUseStageChange).toHaveBeenCalledWith("configure")
    expect(onFirstUseStageChange).toHaveBeenCalledTimes(2)
  })

  it("supports template selection, run params update and sidebar toggle", function () {
    const onRunParamsChange = vi.fn()
    const onSelectedTemplateIdChange = vi.fn()
    const onCreateRun = vi.fn()

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[template]}
          onCreateRun={onCreateRun}
          onRunParamsChange={onRunParamsChange}
          runParams={{}}
          onSelectedTemplateIdChange={onSelectedTemplateIdChange}
          selectedTemplateId=""
          isFirstUseActive={false}
          firstUseStage="welcome"
          firstUseProgress={{ configValid: false, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    const selectTemplateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "选择模板"
    )
    act(() => {
      selectTemplateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onSelectedTemplateIdChange).toHaveBeenCalledWith(template.template_id)
    expect(onRunParamsChange).toHaveBeenCalledWith(template.defaults)

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[template]}
          onCreateRun={onCreateRun}
          onRunParamsChange={onRunParamsChange}
          runParams={{ email: "demo@example.com" }}
          onSelectedTemplateIdChange={onSelectedTemplateIdChange}
          selectedTemplateId={template.template_id}
          isFirstUseActive={false}
          firstUseStage="welcome"
          firstUseProgress={{ configValid: false, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    const emailInput = container.querySelector(
      `#template-param-${template.template_id}-email`
    ) as HTMLInputElement
    act(() => {
      emailInput.value = "next@example.com"
      emailInput.dispatchEvent(new Event("input", { bubbles: true }))
      emailInput.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onRunParamsChange).toHaveBeenCalled()

    const runButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "启动运行任务"
    )
    act(() => {
      runButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onCreateRun).toHaveBeenCalledTimes(1)

    const sidebarToggle = container.querySelector(
      'button[aria-controls="quick-launch-params-panel"]'
    ) as HTMLButtonElement
    expect(sidebarToggle.getAttribute("aria-expanded")).toBe("true")
    expect(sidebarToggle.getAttribute("aria-label")).toBe("收起参数面板")

    act(() => {
      sidebarToggle.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(sidebarToggle.getAttribute("aria-expanded")).toBe("false")
    expect(sidebarToggle.getAttribute("aria-label")).toBe("展开参数面板")
    const paramsPanel = container.querySelector("#quick-launch-params-panel") as HTMLDivElement
    expect(paramsPanel.hidden).toBe(true)
  })

  it("renders verify/configure guidance branches and empty template state", function () {
    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[]}
          onCreateRun={() => {}}
          onRunParamsChange={() => {}}
          runParams={{}}
          onSelectedTemplateIdChange={() => {}}
          selectedTemplateId=""
          isFirstUseActive
          firstUseStage="configure"
          firstUseProgress={{ configValid: false, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    expect(container.textContent).toContain("请先填写有效的 baseUrl / startUrl（可留空）并设置 successSelector。")
    expect(container.textContent).toContain("暂无模板")

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[]}
          onCreateRun={() => {}}
          onRunParamsChange={() => {}}
          runParams={{}}
          onSelectedTemplateIdChange={() => {}}
          selectedTemplateId=""
          isFirstUseActive
          firstUseStage="verify"
          firstUseProgress={{ configValid: true, runTriggered: true, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    expect(container.textContent).toContain("尚未检测到成功/失败结果，请先在任务中心等待任务完成。")
    const completeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "完成首用引导"
    ) as HTMLButtonElement | undefined
    expect(completeButton?.disabled).toBe(true)
  })

  it("updates optional template params and falls back to empty defaults", function () {
    const onRunParamsChange = vi.fn()
    const onSelectedTemplateIdChange = vi.fn()

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[optionalTemplate]}
          onCreateRun={() => {}}
          onRunParamsChange={onRunParamsChange}
          runParams={{ note: "" }}
          onSelectedTemplateIdChange={onSelectedTemplateIdChange}
          selectedTemplateId={optionalTemplate.template_id}
          isFirstUseActive={false}
          firstUseStage="welcome"
          firstUseProgress={{ configValid: false, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    expect(container.textContent).toContain(" / 超时 120s")
    expect(container.textContent).not.toContain(" / 验证码")

    const optionalInput = container.querySelector(
      `#template-param-${optionalTemplate.template_id}-note`
    ) as HTMLInputElement
    expect(optionalInput.placeholder).toBe("选填")

    act(() => {
      fireEvent.input(optionalInput, { target: { value: "memo" } })
    })
    expect(onRunParamsChange).toHaveBeenCalledWith({ note: "memo" })

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[optionalTemplate]}
          onCreateRun={() => {}}
          onRunParamsChange={onRunParamsChange}
          runParams={{}}
          onSelectedTemplateIdChange={onSelectedTemplateIdChange}
          selectedTemplateId=""
          isFirstUseActive={false}
          firstUseStage="welcome"
          firstUseProgress={{ configValid: false, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    const selectTemplateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "选择模板"
    )
    act(() => {
      selectTemplateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(onSelectedTemplateIdChange).toHaveBeenCalledWith(optionalTemplate.template_id)
    expect(onRunParamsChange).toHaveBeenCalledWith({})
  })

  it("allows configured users to advance into run stage", function () {
    const onFirstUseStageChange = vi.fn()

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[]}
          onCreateRun={() => {}}
          onRunParamsChange={() => {}}
          runParams={{}}
          onSelectedTemplateIdChange={() => {}}
          selectedTemplateId=""
          isFirstUseActive
          firstUseStage="configure"
          firstUseProgress={{ configValid: true, runTriggered: false, resultSeen: false }}
          canCompleteFirstUse={false}
          onFirstUseStageChange={onFirstUseStageChange}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    const runStageButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "我已配置，进入运行"
    ) as HTMLButtonElement | undefined

    act(() => {
      runStageButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onFirstUseStageChange).toHaveBeenCalledWith("run")
  })

  it("renders default timeout and secret template params with progress fully checked", function () {
    const secretTemplate: UniversalTemplate = {
      ...template,
      template_id: "tpl-secret",
      policies: {
        ...template.policies,
        timeout_seconds: undefined as unknown as number,
      },
      params_schema: [{ key: "password", type: "secret", required: true }],
      defaults: null,
    }

    act(() => {
      root.render(
        <QuickLaunchView
          commands={[]}
          commandState="success"
          activeTab="all"
          submittingId=""
          feedbackText=""
          onActiveTabChange={() => {}}
          onRunCommand={() => {}}
          params={{
            baseUrl: "http://127.0.0.1:17380",
            startUrl: "",
            successSelector: "#ok",
            modelName: "models/gemini-3.1-pro-preview",
            registerPassword: "",
            automationToken: "",
            automationClientId: "client-001",
            headless: false,
            midsceneStrict: false,
          }}
          onParamsChange={() => {}}
          templates={[secretTemplate]}
          onCreateRun={() => {}}
          onRunParamsChange={() => {}}
          runParams={{}}
          onSelectedTemplateIdChange={() => {}}
          selectedTemplateId={secretTemplate.template_id}
          isFirstUseActive
          firstUseStage="verify"
          firstUseProgress={{ configValid: true, runTriggered: true, resultSeen: true }}
          canCompleteFirstUse
          onFirstUseStageChange={() => {}}
          onCompleteFirstUse={() => {}}
        />
      )
    })

    expect(container.textContent).toContain("步骤状态：配置 ✅ / 触发运行 ✅ / 查看结果 ✅")
    expect(container.textContent).toContain(" / 验证码")
    expect(container.textContent).toContain(" / 超时 120s")

    const passwordInput = container.querySelector(
      `#template-param-${secretTemplate.template_id}-password`
    ) as HTMLInputElement
    expect(passwordInput.type).toBe("password")
    expect(passwordInput.value).toBe("")
  })
})
