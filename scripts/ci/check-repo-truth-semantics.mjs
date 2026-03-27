#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const failures = []
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))

expectScript("repo:truth:semantic-check", "node scripts/ci/check-repo-truth-semantics.mjs && node scripts/ci/check-claim-boundaries.mjs")
expectScript("public:readiness:deep-check", "node scripts/ci/check-public-readiness-deep.mjs")
expectScript("public:redaction:check", "node scripts/ci/check-public-redaction.mjs")
expectScript("public:history:check", "node scripts/ci/check-history-sensitive-surface.mjs")

requireIncludes("README.md", "docs/README.md", "README must route readers to the thin docs index")
requireIncludes("README.md", "docs/architecture.md", "README must route readers to architecture truth")
requireIncludes("README.md", "auditable browser automation platform", "README must keep the public product identity")
requireIncludes("docs/README.md", "thin public documentation surface", "docs index must describe the thin public surface")
requireIncludes("docs/reference/public-surface-sanitization-policy.md", "thin public surface", "public surface policy must describe the thin public surface")

if (failures.length > 0) {
  console.error("[repo-truth-semantics] failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("[repo-truth-semantics] ok")

function expectScript(name, expected) {
  if (packageJson.scripts?.[name] !== expected) {
    failures.push(`package.json must register ${name} -> ${expected}`)
  }
}

function requireIncludes(relativePath, needle, failure) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    failures.push(`${failure} (${relativePath} missing)`)
    return
  }
  const content = fs.readFileSync(fullPath, "utf8")
  if (!content.includes(needle)) {
    failures.push(`${failure} (${relativePath} missing ${JSON.stringify(needle)})`)
  }
}
