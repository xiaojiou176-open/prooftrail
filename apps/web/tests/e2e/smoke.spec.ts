import { expect, test as pwTest } from "@playwright/test"
import {
  CONSOLE_TAB_FLOW_DRAFT_TEST_ID,
  CONSOLE_TAB_QUICK_LAUNCH_TEST_ID,
  CONSOLE_TAB_TASK_CENTER_TEST_ID,
  TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID,
  TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID,
  TASK_CENTER_TAB_COMMAND_RUNS_TEST_ID,
  TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID,
} from "../../src/constants/testIds"

pwTest.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === "/api/automation/commands") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          commands: [
            {
              command_id: "cmd-smoke-001",
              title: "Smoke 命令",
              description: "用于前端冒烟测试",
              tags: ["smoke"],
            },
          ],
        }),
      })
      return
    }
    if (url.pathname === "/api/automation/tasks") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tasks: [] }),
      })
      return
    }
    if (url.pathname === "/api/command-tower/latest-flow") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          session_id: null,
          start_url: null,
          generated_at: null,
          source_event_count: 0,
          step_count: 0,
          steps: [],
        }),
      })
      return
    }
    if (url.pathname === "/api/command-tower/latest-flow-draft") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session_id: null, flow: null }),
      })
      return
    }
    if (url.pathname === "/api/command-tower/evidence-timeline") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      })
      return
    }
    if (url.pathname === "/api/flows") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ flows: [] }),
      })
      return
    }
    if (url.pathname === "/api/templates") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ templates: [] }),
      })
      return
    }
    if (url.pathname === "/api/runs") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [] }),
      })
      return
    }
    throw new Error(`[frontend-smoke] Unhandled API route: ${route.request().method()} ${url.pathname}`)
  })
  await page.route("**/health/**", async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === "/health/diagnostics") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          uptime_seconds: 120,
          task_total: 0,
          task_counts: { queued: 0, running: 0, success: 0, failed: 0, cancelled: 0 },
          metrics: { requests_total: 1, rate_limited: 0 },
        }),
      })
      return
    }
    if (url.pathname === "/health/alerts") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          state: "ok",
          failure_rate: 0,
          threshold: 0.2,
          completed: 0,
          failed: 0,
        }),
      })
      return
    }
    throw new Error(`[frontend-smoke] Unhandled health route: ${route.request().method()} ${url.pathname}`)
  })
  await page.addInitScript(() => {
    window.localStorage.setItem("ab_onboarding_done", "1")
    window.localStorage.setItem("ab_first_use_done", "1")
  })
})

pwTest("@smoke frontend shell and primary navigation", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1, name: "ProofTrail" })).toBeVisible()
  await expect(page.getByRole("tablist", { name: "主导航" })).toBeVisible()
  await expect(page.getByRole("tab", { name: "快速启动" })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("tablist", { name: "命令分类" })).toBeVisible()
  const sidebarToggle = page.getByLabel("收起参数面板")
  await expect(sidebarToggle).toHaveAttribute("aria-expanded", "true")
  await expect(sidebarToggle).toHaveAttribute("aria-controls", "quick-launch-params-panel")

  const quickLaunchTab = page.getByTestId(CONSOLE_TAB_QUICK_LAUNCH_TEST_ID)
  const taskCenterTab = page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID)
  const flowDraftTab = page.getByTestId(CONSOLE_TAB_FLOW_DRAFT_TEST_ID)

  await quickLaunchTab.click()
  await expect(quickLaunchTab).toHaveAttribute("aria-selected", "true")

  await taskCenterTab.click()
  await expect(taskCenterTab).toHaveAttribute("aria-selected", "true")
  await expect(taskCenterTab).toHaveAttribute("aria-controls", "app-view-tasks-panel")
  const taskCenterPanel = page.locator('section#app-view-tasks-panel')
  await expect(taskCenterPanel).toHaveAttribute("role", "tabpanel")
  await expect(taskCenterPanel).toHaveAttribute("aria-labelledby", "console-tab-tasks")

  const commandRunsTab = page.getByTestId(TASK_CENTER_TAB_COMMAND_RUNS_TEST_ID)
  const templateRunsTab = page.getByTestId(TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID)
  const commandRunsPanel = page.getByTestId(TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID)
  const templateRunsPanel = page.getByTestId(TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID)

  await commandRunsTab.click()
  await expect(commandRunsPanel).toBeVisible()
  await expect(templateRunsPanel).toBeHidden()

  await templateRunsTab.click()
  await expect(templateRunsPanel).toBeVisible()
  await expect(commandRunsPanel).toBeHidden()

  await flowDraftTab.click()
  await expect(flowDraftTab).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("heading", { name: "关键结果与下一步" })).toBeVisible()
  await expect(page.getByText("进阶工坊（可选）：系统诊断、流程编辑与调试证据")).toBeVisible()
})
