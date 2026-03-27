import { expect } from '@playwright/test'
import { CONSOLE_TAB_FLOW_DRAFT_TEST_ID } from '../../apps/web/src/constants/testIds'
import { bootstrapButtonBehaviorApp, buttonBehaviorCase } from './support/button-behavior-harness'

buttonBehaviorCase(
  { case_id: 'nav-flow-workshop-selected', assertion_type: 'aria-selected' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    const workshopTab = page.getByTestId(CONSOLE_TAB_FLOW_DRAFT_TEST_ID)

    await workshopTab.click()

    await expect(workshopTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: '关键结果与下一步' })).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'flowworkshop-save-draft-success', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_FLOW_DRAFT_TEST_ID).click()

    await page.getByRole('button', { name: '保存草稿' }).click()

    await expect.poll(() => harness.calls.saveFlowDraft).toBe(1)
    await expect(
      page.getByRole('button', { name: '关闭通知: 流程草稿保存成功' })
    ).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'flowworkshop-replay-latest-success', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_FLOW_DRAFT_TEST_ID).click()

    await page.getByRole('button', { name: '回放最新流程' }).click()

    await expect.poll(() => harness.calls.replayLatestFlow).toBe(1)
    await expect(page.getByText('已触发流程回放')).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'flowworkshop-replay-step-success', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_FLOW_DRAFT_TEST_ID).click()
    await page.getByText('进阶工坊（可选）：系统诊断、流程编辑与调试证据').click()

    await page.getByRole('button', { name: '试跑' }).first().click()

    await expect.poll(() => harness.calls.replayStep).toBe(1)
    await expect(page.getByText('已触发单步试跑 step-1')).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'flowworkshop-replay-from-step-success', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page)
    await page.getByTestId(CONSOLE_TAB_FLOW_DRAFT_TEST_ID).click()
    await page.getByText('进阶工坊（可选）：系统诊断、流程编辑与调试证据').click()

    await page.getByRole('button', { name: '续跑' }).first().click()

    await expect.poll(() => harness.calls.replayFromStep).toBe(1)
    await expect(page.getByText('已触发从步骤 step-1 继续')).toBeVisible()
  },
)
