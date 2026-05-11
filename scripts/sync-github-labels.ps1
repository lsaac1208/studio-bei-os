# ─────────────────────────────────────────────────────────────
# 把 .github/labels.yml 同步到当前 git remote 对应的仓库。
# 前置：已装 gh CLI 且 gh auth login 完成。
# 用法（仓库根目录）：
#   pwsh -File scripts/sync-github-labels.ps1
# ─────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "未找到 gh CLI；请先 winget install GitHub.cli 并 gh auth login"
}

$labelsPath = Join-Path $PSScriptRoot "..\.github\labels.yml"
if (-not (Test-Path $labelsPath)) {
  Write-Error "找不到 $labelsPath"
}

# 解析 labels.yml（极简 parser；只识别 - name/color/description 三字段）
$labels = @()
$current = $null
foreach ($line in Get-Content $labelsPath) {
  if ($line -match '^\s*- name:\s*"?([^"]+)"?\s*$') {
    if ($current) { $labels += $current }
    $current = @{ name = $matches[1]; color = ""; description = "" }
  }
  elseif ($line -match '^\s*color:\s*"?([^"]+)"?\s*$') {
    if ($current) { $current.color = $matches[1] }
  }
  elseif ($line -match '^\s*description:\s*"?([^"]+)"?\s*$') {
    if ($current) { $current.description = $matches[1] }
  }
}
if ($current) { $labels += $current }

Write-Host ("发现 {0} 条 label，开始同步…" -f $labels.Count) -ForegroundColor Cyan

foreach ($l in $labels) {
  $args = @("label", "create", $l.name, "--color", $l.color, "--description", $l.description, "--force")
  Write-Host ("  · {0}" -f $l.name)
  & gh @args | Out-Null
}

Write-Host "完成。" -ForegroundColor Green
