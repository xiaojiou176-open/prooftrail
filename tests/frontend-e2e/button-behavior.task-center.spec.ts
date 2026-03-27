import { expect } from '@playwright/test'
import {
  CONSOLE_TAB_TASK_CENTER_TEST_ID,
  TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID,
  TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID,
  TASK_CENTER_TAB_COMMAND_RUNS_TEST_ID,
  TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID,
  TASK_CENTER_TEMPLATE_RUNS_REFRESH_TEST_ID,
} from '../../apps/web/src/constants/testIds'
import { bootstrapButtonBehaviorApp, buttonBehaviorCase } from './support/button-behavior-harness'

buttonBehaviorCase(
  { case_id: 'nav-task-center-selected', assertion_type: 'aria-selected' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    const taskCenterTab = page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID)

    await taskCenterTab.click()

    await expect(taskCenterTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.task-center-view')).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'taskcenter-template-runs-visible', assertion_type: 'visibility-toggle' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID).click()

    const templateTab = page.getByTestId(TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID)
    const commandPanel = page.getByTestId(TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID)
    const templatePanel = page.getByTestId(TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID)

    await templateTab.click()

    await expect(templatePanel).toBeVisible()
    await expect(commandPanel).toBeHidden()
  },
)

buttonBehaviorCase(
  { case_id: 'taskcenter-command-runs-visible', assertion_type: 'visibility-toggle' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID).click()

    const commandTab = page.getByTestId(TASK_CENTER_TAB_COMMAND_RUNS_TEST_ID)
    const templateTab = page.getByTestId(TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID)
    const commandPanel = page.getByTestId(TASK_CENTER_PANEL_COMMAND_RUNS_TEST_ID)
    const templatePanel = page.getByTestId(TASK_CENTER_PANEL_TEMPLATE_RUNS_TEST_ID)

    await templateTab.click()
    await commandTab.click()

    await expect(commandPanel).toBeVisible()
    await expect(templatePanel).toBeHidden()
  },
)

buttonBehaviorCase(
  { case_id: 'taskcenter-submit-waiting-input-success', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page, {
      runs: [
        {
          run_id: 'run-waiting-otp-001',
          template_id: 'tpl-demo-001',
          status: 'waiting_otp',
          step_cursor: 1,
          params: { email: 'demo@example.com' },
          task_id: null,
          last_error: null,
          artifacts_ref: {},
          created_at: '2026-02-20T00:00:00.000Z',
          updated_at: '2026-02-20T00:00:00.000Z',
          logs: [],
        },
      ],
    })
    await page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID).click()
    await page.getByTestId(TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID).click()

    await page.locator('#task-center-template-option-run-waiting-otp-001').click()
    await page.getByPlaceholder('Enter OTP').fill('123456')
    await expect(page.getByText('This run is waiting for an OTP. Enter it and submit to continue:')).toBeVisible()
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect.poll(() => harness.calls.submitRunOtp).toBe(1)
    await expect(page.getByText('OTP submitted and the run resumed')).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'taskcenter-refresh-template-runs', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID).click()
    await page.getByTestId(TASK_CENTER_TAB_TEMPLATE_RUNS_TEST_ID).click()

    const fetchBefore = harness.calls.fetchTasks
    await page.getByTestId(TASK_CENTER_TEMPLATE_RUNS_REFRESH_TEST_ID).click()

    await expect.poll(() => harness.calls.fetchTasks).toBeGreaterThan(fetchBefore)
  },
)
