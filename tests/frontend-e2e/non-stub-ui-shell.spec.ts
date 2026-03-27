import { expect, test as pwTest } from "@playwright/test"

const backendPort = process.env.BACKEND_PORT?.trim() || "17380"
const apiOrigin = process.env.BACKEND_BASE_URL?.trim() || `http://127.0.0.1:${backendPort}`
const automationClientId = process.env.VITE_DEFAULT_AUTOMATION_CLIENT_ID?.trim() || "client-frontend-e2e"
const automationToken =
  process.env.AUTOMATION_API_TOKEN?.trim() || process.env.VITE_DEFAULT_AUTOMATION_TOKEN?.trim() || ""
const authHeaders = automationToken
  ? {
      "x-automation-token": automationToken,
      "x-automation-client-id": automationClientId,
    }
  : { "x-automation-client-id": automationClientId }
const isCI = process.env.CI === "true"

async function getBackendUnavailableReason(): Promise<string | null> {
  try {
    const response = await fetch(`${apiOrigin}/api/automation/commands`, { headers: authHeaders })
    if (response.status === 401 || response.status === 403) {
      if (!automationToken) {
        return "backend requires auth token; set AUTOMATION_API_TOKEN or VITE_DEFAULT_AUTOMATION_TOKEN"
      }
      return `GET /api/automation/commands rejected with ${response.status} even with token`
    }
    if (!response.ok) {
      return `GET /api/automation/commands returned ${response.status}`
    }
    const payload = (await response.json()) as { commands?: unknown[] }
    if (!Array.isArray(payload.commands) || payload.commands.length === 0) {
      return "GET /api/automation/commands returned no commands"
    }
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `GET /api/automation/commands failed: ${message}`
  }
}

let skipReason: string | null = null

function exitIfBackendUnavailable(): boolean {
  if (!skipReason) return false
  pwTest.info().annotations.push({
    type: "local-backend-unavailable",
    description: `[frontend-e2e-nonstub] ${skipReason}`,
  })
  return true
}

pwTest.beforeAll(async () => {
  const unavailableReason = await getBackendUnavailableReason()
  if (unavailableReason) {
    const reason = `backend unavailable at ${apiOrigin}: ${unavailableReason}`
    if (isCI) {
      throw new Error(`[frontend-e2e-nonstub] ${reason}; CI must fail instead of skipping.`)
    }
    skipReason = reason
  }
})

pwTest.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("ab_onboarding_done", "1")
    window.localStorage.setItem("ab_first_use_done", "1")
  })
})

pwTest("@frontend-nonstub @nonstub real ui shell loads commands and navigates tabs", async ({ page }) => {
  if (exitIfBackendUnavailable()) return

  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1, name: "ProofTrail" })).toBeVisible()
  await expect(page.getByRole("tablist", { name: "主导航" })).toBeVisible()
  await expect(page.getByRole("tablist", { name: "命令分类" })).toBeVisible()
  await expect(page.locator(".command-card").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "执行" }).first()).toBeVisible()

  await page.getByRole("tab", { name: "任务中心" }).click()
  await expect(page.getByRole("tab", { name: "任务中心" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect(page.getByRole("region", { name: "实时终端" })).toBeVisible()

  await page.getByRole("tab", { name: "流程工坊" }).click()
  await expect(page.getByRole("tab", { name: "流程工坊" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect(page.getByRole("heading", { name: "关键结果与下一步" })).toBeVisible()

  await page.getByRole("tab", { name: "快速启动" }).click()
  await expect(page.getByRole("tab", { name: "快速启动" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect(page.getByTestId("param-base-url-input")).toBeVisible()
})
