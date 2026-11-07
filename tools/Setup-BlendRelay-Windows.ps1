# Execute locally on Windows after installing Blender 4.5+, Codex CLI and uvx.
# This only sets up a free local MCP. It never invokes the paid Lux3D API.
$ErrorActionPreference = 'Stop'
if (-not (Get-Command uvx -ErrorAction SilentlyContinue)) { throw 'Install uv first: https://docs.astral.sh/uv/' }
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) { throw 'Install/login to Codex CLI first.' }
uvx blendrelay-mcp setup
if ($LASTEXITCODE -ne 0) { throw 'BlendRelay setup failed' }
$current = codex mcp list | Out-String
if ($current -notmatch 'blendrelay') {
  codex mcp add blendrelay -- uvx blendrelay-mcp mcp
  if ($LASTEXITCODE -ne 0) { throw 'Codex MCP registration failed' }
}
codex mcp list
uvx blendrelay-mcp doctor
Write-Host 'In Blender: Edit > Preferences > Add-ons > enable BlendRelay; open Viewport > N > BlendRelay > Connect.'
