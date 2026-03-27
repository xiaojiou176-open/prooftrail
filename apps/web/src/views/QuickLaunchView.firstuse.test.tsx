import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { UniversalTemplate } from "../types"
import QuickLaunchView from "./QuickLaunchView"

vi.mock("../components/CommandGrid", () => ({
  default: () => null,
}))

vi.mock("../components/ParamsPanel", () => ({
  default: () => null,
}))

vi.mock("../components/EmptyState", () => ({
  default: () => null,
}))

const baseTemplate: UniversalTemplate = {
  template_id: "tpl-1",
  flow_id: "flow-abcdef123456",
  name: "示例模板",
  params_schema: [{ key: "email", type: "email", required: true }],
  defaults: { email: "demo@example.com" },
  policies: {
    retries: 0,
    timeout_seconds: 120,
    otp: {
      required: true,
      provider: "manual",
      timeout_seconds: 120,
      regex: "\\b(\\d{6})\\b",
      sender_filter: "",
      subject_filter: "",
    },
    branches: {},
  },
  created_by: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function getButtonAttributes(html: string, label: string): string {
  const buttonPattern = /<button([^>]*)>([\s\S]*?)<\/button>/g
  let match = buttonPattern.exec(html)
  while (match) {
    const attrs = match[1] ?? ""
    const text = (match[2] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    if (text === label) {
      return attrs
    }
    match = buttonPattern.exec(html)
  }
  return ""
}

function renderFirstUseView(overrides?: Partial<ComponentProps<typeof QuickLaunchView>>) {
  return renderToStaticMarkup(
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
      {...overrides}
    />
  )
}

describe("QuickLaunchView first-use guard rails", () => {
  it('disables "进入运行" before config becomes valid', () => {
    const html = renderFirstUseView()
    expect(html).toContain("请先填写有效的 baseUrl / startUrl（可留空）并设置 successSelector。")
    expect(getButtonAttributes(html, "我已配置，进入运行")).toContain("disabled")
  })

  it("disables completion when result is not visible yet", () => {
    const html = renderFirstUseView({
      firstUseStage: "verify",
      firstUseProgress: { configValid: true, runTriggered: true, resultSeen: false },
      canCompleteFirstUse: false,
    })
    expect(html).toContain("尚未检测到成功/失败结果，请先在任务中心等待任务完成。")
    expect(getButtonAttributes(html, "完成首用引导")).toContain("disabled")
  })

  it("renders localized template copy without raw engineering terms", () => {
    const html = renderFirstUseView({
      firstUseStage: "run",
      firstUseProgress: { configValid: true, runTriggered: false, resultSeen: false },
      templates: [baseTemplate],
      selectedTemplateId: baseTemplate.template_id,
      runParams: { email: "demo@example.com" },
    })
    expect(html).toContain("流程模板:")
    expect(html).toContain("验证码")
    expect(html).toContain("启动运行任务")
    expect(html).not.toContain("Flow:")
    expect(html).not.toContain("/ OTP")
    expect(html).not.toContain("启动 Run")
  })

  it("exposes sidebar toggle state with aria-expanded and aria-controls", () => {
    const html = renderFirstUseView()
    const toggleAttrs = getButtonAttributes(html, "❮")
    expect(toggleAttrs).toContain('aria-expanded="true"')
    expect(toggleAttrs).toContain('aria-controls="quick-launch-params-panel"')
    expect(html).toContain('id="quick-launch-params-panel"')
  })
})
