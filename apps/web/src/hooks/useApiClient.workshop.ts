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
            formatApiError("Diagnostics failed", await readErrorDetail(response)),
            "Check the service state and try again.",
            "Review the health panel and backend diagnostics log."
          )
        )
        store.setDiagnostics(null)
        return
      }
      store.setDiagnosticsError("")
      store.setDiagnostics((await response.json()) as DiagnosticsPayload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Diagnostics failed"
      store.setDiagnosticsError(
        formatActionableError(
          formatApiError("Diagnostics failed", { status: 0, detail: message, requestId: null }),
          "Check the service state and try again.",
          "Review the health panel and backend diagnostics log."
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
            formatApiError("Alert refresh failed", await readErrorDetail(response)),
            "Verify the alert configuration and service connectivity, then try again.",
            "Review the alert panel and backend log."
          )
        )
        store.setAlerts(null)
        return
      }
      store.setAlertError("")
      store.setAlerts((await response.json()) as AlertsPayload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Alert refresh failed"
      store.setAlertError(
        formatActionableError(
          formatApiError("Alert refresh failed", { status: 0, detail: message, requestId: null }),
          "Verify the alert configuration and service connectivity, then try again.",
          "Review the alert panel and backend log."
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
          formatApiError("Flow preview failed", await readErrorDetail(response)),
          "Review the recording result and reload the latest flow preview.",
          "Check Flow Workshop and the backend orchestration log."
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
          formatApiError("Flow draft loading failed", await readErrorDetail(response)),
          "Confirm that a flow draft exists, then try again.",
          "Check the Flow Workshop draft area and backend orchestration log."
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
              formatApiError("Step evidence loading failed", await readErrorDetail(response)),
              "Run the step first, then inspect its evidence.",
              "Review the step detail view and backend evidence log."
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
        const message = error instanceof Error ? error.message : "Step evidence loading failed"
        store.setStepEvidence(null)
        store.setStepEvidenceError(
          formatActionableError(
            message,
            "Run the step first, then inspect its evidence.",
            "Review the step detail view and backend evidence log."
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
          formatApiError("Evidence timeline loading failed", await readErrorDetail(response)),
          "Confirm that a replay has already run, then refresh the timeline again.",
          "Review the Flow Workshop evidence rail and backend evidence timeline log."
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
    await assertResponseOk(flowResp, "Universal Studio data loading failed")
    await assertResponseOk(templateResp, "Universal Studio data loading failed")
    await assertResponseOk(runResp, "Universal Studio data loading failed")
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
      if (!store.flowDraft) throw new Error("Flow draft is empty")
      await requestJson<unknown>("/api/command-tower/latest-flow-draft", "Flow draft save failed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildHeaders() },
        body: JSON.stringify({ flow: store.flowDraft }),
      })
      store.addLog("success", "Flow draft saved successfully")
      store.pushNotice("success", "Flow draft saved successfully")
      await Promise.all([fetchLatestFlow(), fetchLatestFlowDraft(), fetchEvidenceTimeline()])
      if (store.selectedStepId) await fetchStepEvidence(store.selectedStepId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Flow draft save failed"
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
        "Replay trigger failed",
        {
          method: "POST",
          headers: buildHeaders(),
        }
      )
      store.setSelectedTaskId(payload.task.task_id)
      store.addLog("success", `Triggered replay task ${payload.task.task_id}`, payload.task.command_id)
      store.pushNotice("success", "Flow replay triggered")
      await Promise.all([fetchTasks(), fetchDiagnostics(), fetchAlerts(), fetchEvidenceTimeline()])
      if (store.selectedStepId) await fetchStepEvidence(store.selectedStepId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Replay trigger failed"
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
          "Step replay trigger failed",
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
          `Triggered step replay ${stepId} -> ${payload.task.task_id}`,
          payload.task.command_id
        )
        store.pushNotice("success", `Step replay triggered for ${stepId}`)
        await Promise.all([
          fetchTasks(),
          fetchDiagnostics(),
          fetchAlerts(),
          fetchEvidenceTimeline(),
        ])
        await fetchStepEvidence(stepId)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Step replay trigger failed"
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
          "Resume from step trigger failed",
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
          `Triggered replay resume from step ${stepId} -> ${payload.task.task_id}`,
          payload.task.command_id
        )
        store.pushNotice("success", `Resume from step ${stepId} triggered`)
        await Promise.all([
          fetchTasks(),
          fetchDiagnostics(),
          fetchAlerts(),
          fetchEvidenceTimeline(),
        ])
      } catch (error) {
        const message = error instanceof Error ? error.message : "Resume from step trigger failed"
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
