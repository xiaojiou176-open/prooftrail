import type { Command, CommandCategory } from "../types"

const HIGH_RISK_COMMAND_IDS = new Set([
  "setup",
  "clean",
  "map",
  "diagnose",
  "dev-frontend",
  "automation-install",
  "automation-record",
  "automation-record-manual",
  "automation-record-midscene",
])

export const categoryMeta: Record<CommandCategory, { label: string; className: string }> = {
  init: { label: "初始化", className: "cat-init" },
  pipeline: { label: "流水线", className: "cat-pipeline" },
  frontend: { label: "前端", className: "cat-frontend" },
  automation: { label: "自动化", className: "cat-automation" },
  maintenance: { label: "维护", className: "cat-maintenance" },
  backend: { label: "后端", className: "cat-backend" },
}

export function guessCategory(command: Command): CommandCategory {
  const all = [command.command_id, command.title, ...command.tags].join(" ").toLowerCase()
  if (all.includes("setup") || all.includes("init")) return "init"
  if (
    all.includes("pipeline") ||
    all.includes("run-ui") ||
    all.includes("run-midscene") ||
    all.includes("run")
  )
    return "pipeline"
  if (all.includes("frontend")) return "frontend"
  if (all.includes("backend")) return "backend"
  if (
    all.includes("clean") ||
    all.includes("map") ||
    all.includes("diagnose") ||
    all.includes("maintenance")
  )
    return "maintenance"
  return "automation"
}

export function isDangerous(command: Command): boolean {
  const commandId = command.command_id.toLowerCase()
  if (HIGH_RISK_COMMAND_IDS.has(commandId)) return true
  const text = `${command.command_id} ${command.title} ${command.description}`.toLowerCase()
  return text.includes("rm -rf") || text.includes("drop table")
}

export function isAiCommand(command: Command): boolean {
  return (
    command.tags.some((tag) => tag.toLowerCase() === "ai") ||
    command.command_id.includes("midscene")
  )
}
