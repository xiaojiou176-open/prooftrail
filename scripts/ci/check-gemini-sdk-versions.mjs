#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TARGET_VERSION = "1.42.0"

const files = {
  pyproject: path.join(ROOT, "pyproject.toml"),
  requirements: path.join(ROOT, "scripts/computer-use/requirements.txt"),
  uvLock: path.join(ROOT, "uv.lock"),
  packageJson: path.join(ROOT, "apps/automation-runner/package.json"),
  pnpmLock: path.join(ROOT, "pnpm-lock.yaml"),
}

const read = (file) => fs.readFileSync(file, "utf8")

const errors = []

const pyprojectText = read(files.pyproject)
const pyprojectMatch = pyprojectText.match(/"google-genai([^"]*)"/)
if (!pyprojectMatch) {
  errors.push("pyproject.toml 未找到 google-genai 声明")
} else {
  const spec = pyprojectMatch[1]
  if (spec !== `==${TARGET_VERSION}`) {
    errors.push(`pyproject.toml 期望 google-genai==${TARGET_VERSION}，实际为 google-genai${spec}`)
  }
}

const requirementsText = read(files.requirements)
const requirementsMatch = requirementsText.match(/^google-genai([^\s#]*)/m)
if (!requirementsMatch) {
  errors.push("scripts/computer-use/requirements.txt 未找到 google-genai 声明")
} else {
  const spec = requirementsMatch[1]
  if (spec !== `==${TARGET_VERSION}`) {
    errors.push(`requirements.txt 期望 google-genai==${TARGET_VERSION}，实际为 google-genai${spec}`)
  }
}

const uvLockText = read(files.uvLock)
const uvSpecifierMatch = uvLockText.match(
  /\{ name = "google-genai", marker = "extra == 'dev'", specifier = "([^"]+)" \}/
)
if (!uvSpecifierMatch) {
  errors.push("uv.lock 未找到 google-genai 的 dev specifier 记录")
} else {
  const uvSpecifier = uvSpecifierMatch[1]
  if (uvSpecifier !== `==${TARGET_VERSION}`) {
    errors.push(`uv.lock specifier 期望 ==${TARGET_VERSION}，实际为 ${uvSpecifier}`)
  }
}

const uvVersionMatch = uvLockText.match(
  /\[\[package\]\]\nname = "google-genai"\nversion = "([^"]+)"/
)
if (!uvVersionMatch) {
  errors.push("uv.lock 未找到 google-genai 锁定版本")
} else {
  const uvVersion = uvVersionMatch[1]
  if (uvVersion !== TARGET_VERSION) {
    errors.push(`uv.lock 锁定版本期望 ${TARGET_VERSION}，实际为 ${uvVersion}`)
  }
}

const packageJson = JSON.parse(read(files.packageJson))
const nodeSpec = packageJson?.devDependencies?.["@google/genai"]
if (!nodeSpec) {
  errors.push("apps/automation-runner/package.json 未找到 devDependencies.@google/genai")
} else if (nodeSpec !== TARGET_VERSION) {
  errors.push(`apps/automation-runner/package.json 期望 @google/genai 为 ${TARGET_VERSION}，实际为 ${nodeSpec}`)
}

const pnpmLockLines = read(files.pnpmLock).split("\n")
let inAutomationImporter = false
let inGeminiDep = false
let lockSpecifier = ""
let lockVersion = ""

for (const line of pnpmLockLines) {
  if (/^  automation:\s*$/.test(line) || /^  automation\/package\.json:\s*$/.test(line)) {
    inAutomationImporter = true
    inGeminiDep = false
    continue
  }
  if (inAutomationImporter && /^  [^ ].*:\s*$/.test(line)) {
    break
  }
  if (!inAutomationImporter) {
    continue
  }
  if (/^      '@google\/genai':\s*$/.test(line)) {
    inGeminiDep = true
    continue
  }
  if (inGeminiDep && /^      [^ ].*:\s*$/.test(line)) {
    inGeminiDep = false
  }
  if (!inGeminiDep) {
    continue
  }
  const specifierMatch = line.match(/^\s+specifier:\s+(.+)$/)
  if (specifierMatch) {
    lockSpecifier = specifierMatch[1].trim()
  }
  const versionMatch = line.match(/^\s+version:\s+(.+)$/)
  if (versionMatch) {
    lockVersion = versionMatch[1].trim()
  }
}

if (!lockSpecifier || !lockVersion) {
  errors.push("pnpm-lock.yaml 未找到 automation importer 下的 @google/genai 记录")
} else {
  if (lockSpecifier !== TARGET_VERSION) {
    errors.push(`pnpm-lock.yaml specifier 期望 ${TARGET_VERSION}，实际为 ${lockSpecifier}`)
  }
  if (!lockVersion.startsWith(`${TARGET_VERSION}`)) {
    errors.push(`pnpm-lock.yaml version 期望以 ${TARGET_VERSION} 开头，实际为 ${lockVersion}`)
  }
}

if (errors.length > 0) {
  console.error("[gemini-sdk-check] 版本一致性检查失败:")
  for (const err of errors) {
    console.error(`- ${err}`)
  }
  process.exit(1)
}

console.log(`[gemini-sdk-check] OK: Python/Node Gemini SDK 均固定为 ${TARGET_VERSION}`)
