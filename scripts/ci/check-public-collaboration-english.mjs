#!/usr/bin/env node

import fs from "node:fs"

const canonicalPublicFiles = [
  "LICENSE",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "SUPPORT.md",
  "CODE_OF_CONDUCT.md",
  ".github/CODEOWNERS",
  ".github/pull_request_template.md",
  "AGENTS.md",
  "CLAUDE.md",
  "apps/AGENTS.md",
  "apps/CLAUDE.md",
  "apps/api/AGENTS.md",
  "apps/api/CLAUDE.md",
  "apps/web/AGENTS.md",
  "apps/web/CLAUDE.md",
  "apps/automation-runner/AGENTS.md",
  "apps/automation-runner/CLAUDE.md",
  "packages/AGENTS.md",
  "packages/CLAUDE.md",
  "docs/README.md",
  "docs/architecture.md",
  "docs/reference/dependencies-and-third-party.md",
  "docs/reference/public-surface-sanitization-policy.md",
]

const failures = []
const hanPattern = /\p{Script=Han}/u

for (const target of canonicalPublicFiles) {
  if (!fs.existsSync(target)) {
    failures.push(`missing required public collaboration surface: ${target}`)
    continue
  }
  const content = fs.readFileSync(target, "utf8")
  if (hanPattern.test(content)) {
    failures.push(`non-English canonical collaboration surface detected: ${target}`)
  }
}

if (failures.length > 0) {
  console.error("[public-collaboration-english] failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[public-collaboration-english] ok (${canonicalPublicFiles.length} surface(s))`)
