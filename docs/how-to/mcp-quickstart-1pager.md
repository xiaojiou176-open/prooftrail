# MCP Quickstart in One Page

This page is for operators who need the MCP side road without confusing it with
the repo default road.

Repo mainline: `just run` / `pnpm uiq run --profile pr --target web.local`

Machine-readable MCP tool contract:
`docs/reference/generated/mcp-tool-contract.md`

Optional advanced tool groups:
`UIQ_MCP_TOOL_GROUPS=advanced,register,proof,analysis`

The repo mainline is the public default road, while this MCP page is the operator side road.

If you use an internal generic `run` surface, it should still resolve to that same repo mainline rather than the manual workshop pipeline.

When you document an internal generic `run` surface, it should still resolve to that same repo mainline rather than the manual workshop pipeline.

Use this page only when:

- you already understand the canonical repo run
- you now need MCP-specific local operator setup

Do not treat MCP setup as the first-run public story.
