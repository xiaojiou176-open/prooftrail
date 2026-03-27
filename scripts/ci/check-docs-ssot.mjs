#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const failures = []

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/README.md",
  "docs/architecture.md",
  "docs/reference/dependencies-and-third-party.md",
  "docs/reference/public-surface-sanitization-policy.md",
]

for (const relativePath of requiredFiles) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing required file: ${relativePath}`)
  }
}

if (fs.existsSync(path.join(repoRoot, "docs"))) {
  const trackedDocs = walkFiles(path.join(repoRoot, "docs")).map((p) =>
    path.relative(repoRoot, p).replaceAll(path.sep, "/")
  )
  const allowedDocs = new Set([
    "docs/README.md",
    "docs/architecture.md",
    "docs/reference/dependencies-and-third-party.md",
    "docs/reference/public-surface-sanitization-policy.md",
  ])
  for (const filePath of trackedDocs) {
    if (!allowedDocs.has(filePath)) {
      failures.push(`unexpected docs file tracked in thin docs surface: ${filePath}`)
    }
  }
}

assertIncludes("README.md", "docs/README.md", "README must route readers to docs/README.md")
assertIncludes("README.md", "docs/architecture.md", "README must route readers to docs/architecture.md")
assertIncludes("AGENTS.md", "docs/README.md", "AGENTS.md must route agents to docs/README.md")
assertIncludes("CLAUDE.md", "docs/README.md", "CLAUDE.md must route agents to docs/README.md")
assertIncludes(
  "docs/README.md",
  "thin public documentation surface",
  "docs/README.md must describe the thin public documentation surface"
)
assertIncludes(
  "docs/architecture.md",
  "## Runtime Boundaries",
  "docs/architecture.md must describe runtime boundaries"
)

if (failures.length > 0) {
  console.error("docs ssot check failed")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log("[docs-ssot] ok")

function assertIncludes(relativePath, token, message) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing required file: ${relativePath}`)
    return
  }
  const content = fs.readFileSync(fullPath, "utf8")
  if (!content.includes(token)) {
    failures.push(`${message} (${relativePath} missing ${JSON.stringify(token)})`)
  }
}

function walkFiles(dirPath) {
  const result = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath))
    } else if (entry.isFile()) {
      result.push(fullPath)
    }
  }
  return result
}
