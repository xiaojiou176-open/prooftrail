#!/usr/bin/env node

import { execFileSync } from "node:child_process"

const commands = [
  ["bash", ["scripts/docs-gate.sh"]],
  ["node", ["scripts/ci/check-public-collaboration-english.mjs"]],
  ["node", ["scripts/ci/check-public-redaction.mjs"]],
  ["node", ["scripts/ci/check-history-sensitive-surface.mjs"]],
  ["node", ["scripts/ci/check-tracked-heavy-artifacts.mjs"]],
  ["bash", ["scripts/ci/check-oss-redaction-tooling.sh"]],
]

for (const [command, args] of commands) {
  execFileSync(command, args, { stdio: "inherit" })
}

console.log("[public-readiness-deep] ok")
