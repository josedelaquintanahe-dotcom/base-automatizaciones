[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [string]$EnvFile = "src/backend/.env.local",

  [string]$BackendBaseUrl = "https://base-automatizaciones.onrender.com",

  [int]$PollAttempts = 12,

  [int]$PollDelaySeconds = 3
)

$ErrorActionPreference = "Stop"

function Set-EnvFromFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "No se encontro el archivo de entorno: $Path"
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    if ($_ -match "^[ \t]*#" -or $_ -match "^[ \t]*$") {
      return
    }

    $parts = $_ -split "=", 2

    if ($parts.Length -eq 2) {
      [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
    }
  }
}

function Invoke-JsonScript {
  param(
    [string]$ScriptPath,
    [string[]]$Arguments
  )

  $raw = & powershell.exe -ExecutionPolicy Bypass -File $ScriptPath @Arguments

  if (-not $raw) {
    throw "El script no devolvio salida JSON: $ScriptPath"
  }

  return $raw | ConvertFrom-Json
}

function Get-SupabaseRows {
  param([string]$Url)

  $scriptPath = Join-Path $PSScriptRoot "http-json.mjs"
  $response = & node.exe $scriptPath `
    --method GET `
    --url $Url `
    --header "apikey: $env:SUPABASE_SERVICE_ROLE_KEY" `
    --header "Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY"

  if (-not $response) {
    return @()
  }

  $parsedResponse = $response | ConvertFrom-Json

  if (-not $parsedResponse.body) {
    return @()
  }

  $parsed = $parsedResponse.body

  if ($parsed -is [System.Array]) {
    return $parsed
  }

  return @($parsed)
}

Set-EnvFromFile -Path $EnvFile

foreach ($requiredKey in @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
  $requiredValue = [Environment]::GetEnvironmentVariable($requiredKey)

  if (-not $requiredValue -or -not $requiredValue.Trim()) {
    throw "Falta la variable de entorno obligatoria: $requiredKey"
  }
}

$baseScript = Join-Path $PSScriptRoot "verify-onboarding-flow.ps1"

$baseCheck = Invoke-JsonScript -ScriptPath $baseScript -Arguments @(
  "-ClientId", $ClientId,
  "-EnvFile", $EnvFile,
  "-BackendBaseUrl", $BackendBaseUrl
)

$correlationId = $baseCheck.correlation_id

if (-not $correlationId) {
  throw "No se obtuvo correlation_id desde verify-onboarding-flow.ps1"
}

$requiredWorkflows = @(
  "onboarding_activated",
  "onboarding_trace_verified",
  "onboarding_readiness_revalidated",
  "onboarding_credentials_metadata_checked",
  "onboarding_dispatch_health_checked",
  "onboarding_sanitized_report_compiled"
)

$supabaseBaseUrl = $env:SUPABASE_URL.TrimEnd("/")
$executionsUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=workflow_name,status,correlation_id,created_at,finished_at,input_payload&correlation_id=eq.$correlationId&order=created_at.desc"

$rows = @()
$latestByWorkflow = @{}

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $rows = @(Get-SupabaseRows -Url $executionsUrl)
  $latestByWorkflow = @{}

  foreach ($row in $rows) {
    if (-not $row.workflow_name) {
      continue
    }

    if (-not $latestByWorkflow.ContainsKey($row.workflow_name)) {
      $latestByWorkflow[$row.workflow_name] = $row
    }
  }

  $allPresent = $true
  $allCompleted = $true

  foreach ($workflowName in $requiredWorkflows) {
    if (-not $latestByWorkflow.ContainsKey($workflowName)) {
      $allPresent = $false
      $allCompleted = $false
      break
    }

    if ($latestByWorkflow[$workflowName].status -ne "completed") {
      $allCompleted = $false
      break
    }
  }

  if ($allPresent -and $allCompleted) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$workflowSummary = foreach ($workflowName in $requiredWorkflows) {
  $row = if ($latestByWorkflow.ContainsKey($workflowName)) {
    $latestByWorkflow[$workflowName]
  }
  else {
    $null
  }

  [pscustomobject]@{
    workflow_name = $workflowName
    status = if ($row) { $row.status } else { $null }
    finished_at = if ($row) { $row.finished_at } else { $null }
  }
}

$finalReport = $latestByWorkflow["onboarding_sanitized_report_compiled"]
$finalPayload = if ($finalReport) { $finalReport.input_payload } else { $null }
$allChecksPassed = $null

if ($finalPayload -and $finalPayload.sanitized_result) {
  $allChecksPassed = $finalPayload.sanitized_result.all_checks_passed
}

$result = [pscustomobject]@{
  correlation_id = $correlationId
  onboarding = $baseCheck
  workflows = $workflowSummary
  workflow_count = $rows.Count
  all_checks_passed = $allChecksPassed
}

$result | ConvertTo-Json -Depth 8

$hasAllCompleted = $true

foreach ($workflow in $workflowSummary) {
  if ($workflow.status -ne "completed") {
    $hasAllCompleted = $false
    break
  }
}

if (-not $hasAllCompleted -or $allChecksPassed -ne $true) {
  exit 1
}
