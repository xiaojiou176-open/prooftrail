import { useCallback } from "react"
import type { MutableRefObject } from "react"
import type {
  AlertsPayload,
  DiagnosticsPayload,
  EvidenceTimelinePayload,
  FlowDraftDocumentPayload,
  FlowEditableDraft,
  FlowPreviewPayload,
  StepEvidencePayload,
  Task,
  UniversalFlow,
  UniversalRun,
  UniversalTemplate,
} from "../types"
import { formatApiError, readErrorDetail } from "../utils/api"
import type { ApiClientTransport } from "./useApiClient.transport"
import type { AppStore } from "./useAppStore"

type WorkshopParams = {
  store: AppStore
  transport: ApiClientTransport
  fetchTasks: () => Promise<void>
  fetchStepEvidenceRequestSeqRef: MutableRefObject<number>
}

export function useApiClientWorkshop({
  store,
  transport,
  fetchTasks,
  fetchStepEvidenceRequestSeqRef,
}: WorkshopParams) {
  const { apiFetch, assertResponseOk, buildHeaders, formatActionableError, requestJson } = transport

  const fetchDiagnostics = useCallback(async () => {
    try {
      const response = await apiFetch("/health/diagnostics", { headers: buildHeaders() })
      if (!response.ok) {
        store.setDiagnosticsError(
          formatActionableError(
            formatApiError("诊断失败", await readErrorDetail(response)),
            "检查服务状态后重试。",
            "查看健康检查面板与后端诊断日志。"
          )
        )
        store.setDiagnostics(null)
        return
      }
      store.setDiagnosticsError("")
      store.setDiagnostics((await response.json()) as DiagnosticsPayload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "诊断失败"
      store.setDiagnosticsError(
        formatActionableError(
          formatApiError("诊断失败", { status: 0, detail: message, requestId: null }),
          "检查服务状态后重试。",
          "查看健康检查面板与后端诊断日志。"
        )
      )
      store.setDiagnostics(null)
    }
  }, [apiFetch, buildHeaders, formatActionableError, store])

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await apiFetch("/health/alerts", { headers: buildHeaders() })
      if (!response.ok) {
        store.setAlertError(
          formatActionableError(
            formatApiError("告警失败", await readErrorDetail(response)),
            "确认告警配置与服务连接后重试。",
            "查看告警面板与后端日志。"
          )
        )
        store.setAlerts(null)
        return
      }
      store.setAlertError("")
      store.setAlerts((await response.json()) as AlertsPayload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "告警失败"
      store.setAlertError(
        formatActionableError(
          formatApiError("告警失败", { status: 0, detail: message, requestId: null }),
          "确认告警配置与服务连接后重试。",
          "查看告警面板与后端日志。"
        )
      )
      store.setAlerts(null)
    }
  }, [apiFetch, buildHeaders, formatActionableError, store])

  const fetchLatestFlow = useCallback(async () => {
    const response = await apiFetch("/api/command-tower/latest-flow", { headers: buildHeaders() })
    if (!response.ok) {
      store.setFlowError(
        formatActionableError(
          formatApiError("流程预览失败", await readErrorDetail(response)),
          "检查录制结果后重新加载。",
          "查看流程工坊与后端编排日志。"
        )
      )
      store.setLatestFlow(null)
      return
    }
    store.setFlowError("")
    store.setLatestFlow((await response.json()) as FlowPreviewPayload)
  }, [apiFetch, buildHeaders, formatActionableError, store])

  const fetchLatestFlowDraft = useCallback(async () => {
    const response = await apiFetch("/api/command-tower/latest-flow-draft", {
      headers: buildHeaders(),
    })
    if (!response.ok) {
      store.setFlowError(
        formatActionableError(
          formatApiError("流程草稿加载失败", await readErrorDetail(response)),
          "确认流程草稿可用后重试。",
          "查看流程工坊草稿区与后端编排日志。"
        )
      )
      store.setFlowDraft(null)
      return
    }
    const payload = (await response.json()) as FlowDraftDocumentPayload
    store.setFlowError("")
    if (!payload.flow || typeof payload.flow !== "object") {
      store.setFlowDraft(null)
      return
    }
    const flow = payload.flow as Partial<FlowEditableDraft>
    if (!flow.start_url || !Array.isArray(flow.steps)) {
      store.setFlowDraft(null)
      return
    }
    const steps = flow.steps as FlowEditableDraft["steps"]
    store.setFlowDraft({
      flow_id: flow.flow_id,
      session_id: flow.session_id,
      start_url: String(flow.start_url),
      generated_at: flow.generated_at,
      source_event_count: flow.source_event_count,
      steps,
    })
    store.setSelectedStepId((prev) => {
      if (prev && steps.some((step) => step.step_id === prev)) return prev
      return steps[0]?.step_id ?? ""
    })
  }, [apiFetch, buildHeaders, formatActionableError, store])

  const fetchStepEvidence = useCallback(
    async (stepId: string) => {
      const requestSeq = ++fetchStepEvidenceRequestSeqRef.current
      const step = stepId.trim()
      if (!step) {
        store.setStepEvidence(null)
        store.setStepEvidenceError("")
        return
      }
      if (!store.evidenceTimeline.some((item) => item.step_id === step)) {
        store.setStepEvidence(null)
        store.setStepEvidenceError("")
        return
      }
      try {
        const response = await apiFetch(
          `/api/command-tower/evidence?step_id=${encodeURIComponent(step)}`,
          {
            headers: buildHeaders(),
          }
        )
        if (requestSeq !== fetchStepEvidenceRequestSeqRef.current) return
        if (!response.ok) {
          if (response.status === 404) {
            store.setStepEvidence(null)
            store.setStepEvidenceError("")
            return
          }
          store.setStepEvidenceError(
            formatActionableError(
              formatApiError("步骤证据获取失败", await readErrorDetail(response)),
              "先执行对应步骤后再查看证据。",
              "查看步骤详情与后端证据日志。"
            )
          )
          store.setStepEvidence(null)
          return
        }
        store.setStepEvidenceError("")
        const payload = (await response.json()) as StepEvidencePayload
        if (requestSeq !== fetchStepEvidenceRequestSeqRef.current) return
        store.setStepEvidence(payload)
      } catch (error) {
        if (requestSeq !== fetchStepEvidenceRequestSeqRef.current) return
        const message = error instanceof Error ? error.message : "步骤证据获取失败"
        store.setStepEvidence(null)
        store.setStepEvidenceError(
          formatActionableError(
            message,
            "先执行对应步骤后再查看证据。",
            "查看步骤详情与后端证据日志。"
          )
        )
      }
    },
    [apiFetch, buildHeaders, fetchStepEvidenceRequestSeqRef, formatActionableError, store]
  )

  const fetchEvidenceTimeline = useCallback(async () => {
    const response = await apiFetch("/api/command-tower/evidence-timeline", {
      headers: buildHeaders(),
    })
    if (!response.ok) {
      store.setEvidenceTimelineError(
        formatActionableError(
          formatApiError("证据时间轴加载失败", await readErrorDetail(response)),
          "确认已执行回放后再次刷新时间轴。",
          "查看流程工坊证据区与后端 evidence timeline 日志。"
        )
      )
      store.setEvidenceTimeline([])
      return
    }
    const payload = (await response.json()) as EvidenceTimelinePayload
    store.setEvidenceTimelineError("")
    store.setEvidenceTimeline(payload.items ?? [])
  }, [apiFetch, buildHeaders, formatActionableError, store])

  const fetchStudioData = useCallback(async () => {
    const [flowResp, templateResp, runResp] = await Promise.all([
      apiFetch("/api/flows?limit=100", { headers: buildHeaders() }),
      apiFetch("/api/templates?limit=100", { headers: buildHeaders() }),
      apiFetch("/api/runs?limit=100", { headers: buildHeaders() }),
    ])
    await assertResponseOk(flowResp, "Universal Studio 数据加载失败")
    await assertResponseOk(templateResp, "Universal Studio 数据加载失败")
    await assertResponseOk(runResp, "Universal Studio 数据加载失败")
    const flowPayload = (await flowResp.json()) as { flows: UniversalFlow[] }
    const templatePayload = (await templateResp.json()) as { templates: UniversalTemplate[] }
    const runPayload = (await runResp.json()) as { runs: UniversalRun[] }
    store.setStudioFlows(flowPayload.flows ?? [])
    store.setStudioTemplates(templatePayload.templates ?? [])
    store.setStudioRuns(runPayload.runs ?? [])
    store.setStudioError("")
    store.setSelectedStudioFlowId((prev) => prev || flowPayload.flows?.[0]?.flow_id || "")
    store.setSelectedStudioTemplateId(
      (prev) => prev || templatePayload.templates?.[0]?.template_id || ""
    )
    store.setSelectedStudioRunId((prev) => prev || runPayload.runs?.[0]?.run_id || "")
  }, [apiFetch, assertResponseOk, buildHeaders, store])

  const saveFlowDraft = useCallback(async () => {
    try {
      if (!store.flowDraft) throw new Error("流程草稿为空")
      await requestJson<unknown>("/api/command-tower/latest-flow-draft", "流程草稿保存失败", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildHeaders() },
        body: JSON.stringify({ flow: store.flowDraft }),
      })
      store.addLog("success", "流程草稿保存成功")
      store.pushNotice("success", "流程草稿保存成功")
      await Promise.all([fetchLatestFlow(), fetchLatestFlowDraft(), fetchEvidenceTimeline()])
      if (store.selectedStepId) await fetchStepEvidence(store.selectedStepId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "流程草稿保存失败"
      const formatted = formatActionableError(message)
      store.addLog("error", formatted)
      store.pushNotice("error", formatted)
    }
  }, [
    store,
    requestJson,
    buildHeaders,
    fetchLatestFlow,
    fetchLatestFlowDraft,
    fetchEvidenceTimeline,
    fetchStepEvidence,
    formatActionableError,
  ])

  const replayLatestFlow = useCallback(async () => {
    try {
      const payload = await requestJson<{ task: Task }>(
        "/api/command-tower/replay-latest",
        "回放触发失败",
        {
          method: "POST",
          headers: buildHeaders(),
        }
      )
      store.setSelectedTaskId(payload.task.task_id)
      store.addLog("success", `触发回放任务 ${payload.task.task_id}`, payload.task.command_id)
      store.pushNotice("success", "已触发流程回放")
      await Promise.all([fetchTasks(), fetchDiagnostics(), fetchAlerts(), fetchEvidenceTimeline()])
      if (store.selectedStepId) await fetchStepEvidence(store.selectedStepId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "回放触发失败"
      const formatted = formatActionableError(message)
      store.addLog("error", formatted)
      store.pushNotice("error", formatted)
    }
  }, [
    store,
    requestJson,
    buildHeaders,
    fetchTasks,
    fetchDiagnostics,
    fetchAlerts,
    fetchEvidenceTimeline,
    fetchStepEvidence,
    formatActionableError,
  ])

  const replayStep = useCallback(
    async (stepId: string) => {
      try {
        const payload = await requestJson<{ task: Task }>(
          "/api/command-tower/replay-latest-step",
          "单步试跑触发失败",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...buildHeaders() },
            body: JSON.stringify({ step_id: stepId }),
          }
        )
        store.setSelectedTaskId(payload.task.task_id)
        store.setSelectedStepId(stepId)
        store.addLog(
          "success",
          `触发单步试跑 ${stepId} -> ${payload.task.task_id}`,
          payload.task.command_id
        )
        store.pushNotice("success", `已触发单步试跑 ${stepId}`)
        await Promise.all([
          fetchTasks(),
          fetchDiagnostics(),
          fetchAlerts(),
          fetchEvidenceTimeline(),
        ])
        await fetchStepEvidence(stepId)
      } catch (error) {
        const message = error instanceof Error ? error.message : "单步试跑触发失败"
        const formatted = formatActionableError(message)
        store.addLog("error", formatted)
        store.pushNotice("error", formatted)
      }
    },
    [
      store,
      requestJson,
      buildHeaders,
      fetchTasks,
      fetchDiagnostics,
      fetchAlerts,
      fetchEvidenceTimeline,
      fetchStepEvidence,
      formatActionableError,
    ]
  )

  const replayFromStep = useCallback(
    async (stepId: string) => {
      try {
        const payload = await requestJson<{ task: Task }>(
          "/api/command-tower/replay-latest-from-step",
          "从步骤恢复触发失败",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...buildHeaders() },
            body: JSON.stringify({
              step_id: stepId,
              replay_preconditions: store.resumeWithPreconditions,
            }),
          }
        )
        store.setSelectedTaskId(payload.task.task_id)
        store.setSelectedStepId(stepId)
        store.addLog(
          "success",
          `触发从步骤继续 ${stepId} -> ${payload.task.task_id}`,
          payload.task.command_id
        )
        store.pushNotice("success", `已触发从步骤 ${stepId} 继续`)
        await Promise.all([
          fetchTasks(),
          fetchDiagnostics(),
          fetchAlerts(),
          fetchEvidenceTimeline(),
        ])
      } catch (error) {
        const message = error instanceof Error ? error.message : "从步骤恢复触发失败"
        const formatted = formatActionableError(message)
        store.addLog("error", formatted)
        store.pushNotice("error", formatted)
      }
    },
    [
      store,
      requestJson,
      buildHeaders,
      fetchTasks,
      fetchDiagnostics,
      fetchAlerts,
      fetchEvidenceTimeline,
      formatActionableError,
    ]
  )

  const refreshDiagnostics = useCallback(() => {
    void Promise.all([
      fetchDiagnostics(),
      fetchAlerts(),
      fetchLatestFlow(),
      fetchLatestFlowDraft(),
      fetchEvidenceTimeline(),
    ])
    if (store.selectedStepId) void fetchStepEvidence(store.selectedStepId)
  }, [
    fetchAlerts,
    fetchDiagnostics,
    fetchEvidenceTimeline,
    fetchLatestFlow,
    fetchLatestFlowDraft,
    fetchStepEvidence,
    store.selectedStepId,
  ])

  return {
    fetchDiagnostics,
    fetchAlerts,
    fetchLatestFlow,
    fetchLatestFlowDraft,
    fetchStepEvidence,
    fetchEvidenceTimeline,
    fetchStudioData,
    saveFlowDraft,
    replayLatestFlow,
    replayStep,
    replayFromStep,
    refreshDiagnostics,
  }
}
