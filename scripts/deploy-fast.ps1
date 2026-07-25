param(
  [switch]$Full
)

$ErrorActionPreference = "Stop"
$Project = Resolve-Path (Join-Path $PSScriptRoot "..")
$DeployScript = Join-Path $Project "scripts\deploy-hostspk-backend.ps1"

Push-Location $Project
try {
  npm run check:release

  if ($Full) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $DeployScript
  } else {
    # Homepage, shared assets, key hubs, sitemap and data status are enough for routine UI updates.
    & powershell -NoProfile -ExecutionPolicy Bypass -File $DeployScript -CriticalOnly
  }

  if ($LASTEXITCODE -ne 0) {
    throw "HostSPK deployment failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
