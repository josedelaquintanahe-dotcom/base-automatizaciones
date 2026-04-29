[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$CorrelationId,

  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [string]$EnvFile = "src/backend/.env.local",

  [string]$WorkflowWebhookUrl = "",

  [int]$PollAttempts = 8,

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

function Assert-RequiredEnv {
  param([string[]]$Keys)

  $missing = @()

  foreach ($key in $Keys) {
    $value = [Environment]::GetEnvironmentVariable($key)

    if (-not $value -or -not $value.Trim()) {
      $missing += $key
    }
  }

  if ($missing.Count -gt 0) {
    throw "Faltan variables de entorno obligatorias para la verificacion: $($missing -join ', ')"
  }
}

function Resolve-WorkflowWebhookUrl {
  param(
    [string]$ExplicitUrl,
    [string]$WorkflowPath
  )

  if ($ExplicitUrl -and $ExplicitUrl.Trim()) {
    return $ExplicitUrl.Trim()
  }

  $baseUrl = [Environment]::GetEnvironmentVariable("N8N_WEBHOOK_BASE_URL")

  if (-not $baseUrl -or -not $baseUrl.Trim()) {
    throw "Falta N8N_WEBHOOK_BASE_URL y no se ha proporcionado WorkflowWebhookUrl."
  }

  $normalizedBaseUrl = $baseUrl.Trim().TrimEnd("/")
  $publicBaseUrl = if ($normalizedBaseUrl -match "/mcp-server/http$") {
    $normalizedBaseUrl -replace "/mcp-server/http$", ""
  }
  else {
    $normalizedBaseUrl
  }

  if ($publicBaseUrl.EndsWith("/webhook")) {
    return "$publicBaseUrl/$WorkflowPath"
  }

  return "$publicBaseUrl/webhook/$WorkflowPath"
}

function Invoke-JsonRequest {
  param(
    [string]$Url,
    [string]$Method = "GET",
    [string[]]$Headers = @(),
    [string]$Body = ""
  )

  $scriptPath = Join-Path $PSScriptRoot "http-json.mjs"
  $arguments = @($scriptPath, "--method", $Method, "--url", $Url)

  foreach ($header in $Headers) {
    $arguments += @("--header", $header)
  }

  if ($Body) {
    $arguments += @("--body", $Body)
  }

  $raw = & node.exe @arguments

  if (-not $raw) {
    return [pscustomobject]@{ Status = 0; Body = $null }
  }

  $response = $raw | ConvertFrom-Json

  return [pscustomobject]@{
    Status = [int]$response.status
    Body = $response.body
  }
}

function Invoke-WebhookJsonRequest {
  param(
    [string]$Url,
    [string]$Body
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Method POST -ContentType "application/json" -Body $Body -UseBasicParsing
    $statusCode = [int]$response.StatusCode
    $bodyRaw = $response.Content
  }
  catch {
    if (-not $_.Exception.Response) {
      throw
    }

    $statusCode = [int]$_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $bodyRaw = $reader.ReadToEnd()
    $reader.Dispose()
  }

  $bodyJson = $null

  if ($bodyRaw) {
    try {
      $bodyJson = $bodyRaw | ConvertFrom-Json
    }
    catch {
      $bodyJson = $bodyRaw
    }
  }

  return [pscustomobject]@{
    Status = $statusCode
    Body = $bodyJson
  }
}

function Get-SupabaseRows {
  param([string]$Url)

  $response = Invoke-JsonRequest -Url $Url -Headers @(
    "apikey: $env:SUPABASE_SERVICE_ROLE_KEY",
    "Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
  )

  if ($response.Status -ne 200) {
    throw "Supabase devolvio HTTP $($response.Status) para $Url"
  }

  if ($null -eq $response.Body) {
    return @()
  }

  if ($response.Body -is [System.Array]) {
    return $response.Body
  }

  return @($response.Body)
}

Set-EnvFromFile -Path $EnvFile

$requiredEnvKeys = @(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
)

if (-not $WorkflowWebhookUrl -or -not $WorkflowWebhookUrl.Trim()) {
  $requiredEnvKeys += "N8N_WEBHOOK_BASE_URL"
}

Assert-RequiredEnv -Keys $requiredEnvKeys

$resolvedWebhookUrl = Resolve-WorkflowWebhookUrl -ExplicitUrl $WorkflowWebhookUrl -WorkflowPath "onboarding_credentials_metadata_checked"

$payload = @{
  correlation_id = $CorrelationId
  cliente_id = $ClientId
  event_name = "onboarding_activated"
} | ConvertTo-Json -Depth 4 -Compress

$invocation = Invoke-WebhookJsonRequest -Url $resolvedWebhookUrl -Body $payload

$supabaseBaseUrl = $env:SUPABASE_URL.TrimEnd("/")
$execUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=correlation_id,workflow_name,status,started_at,finished_at,input_payload&workflow_name=eq.onboarding_credentials_metadata_checked&correlation_id=eq.$CorrelationId&order=created_at.desc&limit=1"

$execRows = @()

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $execRows = @(Get-SupabaseRows -Url $execUrl)

  if ($execRows.Count -gt 0) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$row = if ($execRows.Count -gt 0) { $execRows[0] } else { $null }
$responseBody = $invocation.Body
$accepted = if ($responseBody -is [string] -or $null -eq $responseBody) { $null } else { $responseBody.accepted }
$resultSummary = if ($responseBody -is [string] -or $null -eq $responseBody) { $null } else { $responseBody.result_summary }
$nextAction = if ($responseBody -is [string] -or $null -eq $responseBody) { $null } else { $responseBody.next_action }

$result = [pscustomobject]@{
  status = $invocation.Status
  workflow_webhook_url = $resolvedWebhookUrl
  correlation_id = $CorrelationId
  cliente_id = $ClientId
  accepted = $accepted
  result_summary = $resultSummary
  next_action = $nextAction
  ejecuciones_workflows = $execRows.Count
  workflow_status = if ($row) { $row.status } else { $null }
  workflow_name = if ($row) { $row.workflow_name } else { $null }
  persisted_input_payload = if ($row) { $row.input_payload } else { $null }
}

$result | ConvertTo-Json -Depth 6

if (
  $invocation.Status -ne 202 -or
  $accepted -ne $true -or
  $result.ejecuciones_workflows -lt 1 -or
  $result.workflow_status -ne "completed"
) {
  exit 1
}
