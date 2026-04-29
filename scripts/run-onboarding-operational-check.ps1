[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [string]$BackendBaseUrl = "https://base-automatizaciones.onrender.com",

  [string]$EnvFile = "src/backend/.env.local",

  [int]$PollAttempts = 8,

  [int]$PollDelaySeconds = 3
)

$ErrorActionPreference = "Stop"

function Invoke-CurlJson {
  param([string]$Url)

  $raw = & curl.exe -sS $Url

  if (-not $raw) {
    return $null
  }

  return $raw | ConvertFrom-Json
}

$healthUrl = "$($BackendBaseUrl.TrimEnd('/'))/api/health"
$statusUrl = "$($BackendBaseUrl.TrimEnd('/'))/api/system/status"

$health = Invoke-CurlJson -Url $healthUrl
$systemStatus = Invoke-CurlJson -Url $statusUrl

if (-not $health) {
  throw "No se recibio respuesta valida de $healthUrl"
}

if (-not $systemStatus) {
  throw "No se recibio respuesta valida de $statusUrl"
}

$verifyScriptPath = Join-Path -Path $PSScriptRoot -ChildPath "verify-onboarding-flow.ps1"

if (-not (Test-Path -LiteralPath $verifyScriptPath)) {
  throw "No se encontro el script de verificacion base: $verifyScriptPath"
}

$smokeRaw = & powershell.exe -ExecutionPolicy Bypass -File $verifyScriptPath `
  -ClientId $ClientId `
  -EnvFile $EnvFile `
  -BackendBaseUrl $BackendBaseUrl `
  -PollAttempts $PollAttempts `
  -PollDelaySeconds $PollDelaySeconds

if (-not $smokeRaw) {
  throw "La verificacion de onboarding no devolvio salida."
}

$smoke = $smokeRaw | ConvertFrom-Json

$result = [pscustomobject]@{
  health = [pscustomobject]@{
    status = $health.status
    service = $health.service
    environment = $health.environment
  }
  systemStatus = [pscustomobject]@{
    status = $systemStatus.status
    provider = $systemStatus.provider
    connectivity = $systemStatus.connectivity
    onboardingDispatch = $systemStatus.onboardingDispatch
  }
  onboardingFlow = $smoke
}

$result | ConvertTo-Json -Depth 6

if (
  $health.status -ne "ok" -or
  $systemStatus.status -ne "ok" -or
  -not $systemStatus.onboardingDispatch -or
  -not $systemStatus.onboardingDispatch.configured -or
  $systemStatus.onboardingDispatch.pathStatus -ne "expected" -or
  $smoke.status -ne 200 -or
  $smoke.delivery_status -ne "accepted" -or
  $smoke.automation_events -lt 1 -or
  $smoke.ejecuciones_workflows -lt 1 -or
  $smoke.workflow_status -ne "completed"
) {
  exit 1
}
