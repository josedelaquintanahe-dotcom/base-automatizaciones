[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [string]$EnvFile = "src/backend/.env.local",

  [string]$BackendBaseUrl = "https://base-automatizaciones.onrender.com"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

function Invoke-JsonScript {
  param(
    [string]$ScriptPath,
    [string[]]$Arguments
  )

  $raw = & powershell -ExecutionPolicy Bypass -File $ScriptPath @Arguments

  if (-not $raw) {
    throw "El script no devolvio salida JSON: $ScriptPath"
  }

  return $raw | ConvertFrom-Json
}

$operationalCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "run-onboarding-operational-check.ps1") -Arguments @(
  "-ClientId", $ClientId
)

$correlationId = $operationalCheck.onboardingFlow.correlation_id

if (-not $correlationId) {
  throw "No se obtuvo correlation_id desde run-onboarding-operational-check.ps1"
}

$traceCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "verify-onboarding-trace-workflow.ps1") -Arguments @(
  "-CorrelationId", $correlationId,
  "-ClientId", $ClientId
)

$readinessCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "verify-onboarding-readiness-workflow.ps1") -Arguments @(
  "-CorrelationId", $correlationId,
  "-ClientId", $ClientId
)

$credentialsCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "verify-onboarding-credentials-workflow.ps1") -Arguments @(
  "-CorrelationId", $correlationId,
  "-ClientId", $ClientId
)

$dispatchCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "verify-onboarding-dispatch-workflow.ps1") -Arguments @(
  "-CorrelationId", $correlationId,
  "-ClientId", $ClientId,
  "-BackendBaseUrl", $BackendBaseUrl
)

$reportCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "verify-onboarding-report-workflow.ps1") -Arguments @(
  "-CorrelationId", $correlationId,
  "-ClientId", $ClientId
)

$result = [pscustomobject]@{
  correlation_id = $correlationId
  onboarding = $operationalCheck.onboardingFlow
  trace = $traceCheck
  readiness = $readinessCheck
  credentials = $credentialsCheck
  dispatch = $dispatchCheck
  report = $reportCheck
}

$result | ConvertTo-Json -Depth 10
