[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [string]$TargetWorkflowId = "automation_client_health_snapshot",

  [string]$RequestedFirstRunAt = "",

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

function Invoke-HttpJson {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [string[]]$Headers = @()
  )

  $scriptPath = Join-Path $PSScriptRoot "http-json.mjs"
  $arguments = @("--method", $Method, "--url", $Url)
  $tempBodyFile = $null

  foreach ($header in $Headers) {
    $arguments += @("--header", $header)
  }

  if ($null -ne $Body) {
    $tempBodyFile = [System.IO.Path]::GetTempFileName()
    ($Body | ConvertTo-Json -Depth 10 -Compress) | Set-Content -LiteralPath $tempBodyFile -Encoding utf8
    $arguments += @("--body-file", $tempBodyFile)
  }

  try {
    $raw = & node.exe $scriptPath @arguments
  } finally {
    if ($tempBodyFile -and (Test-Path -LiteralPath $tempBodyFile)) {
      Remove-Item -LiteralPath $tempBodyFile -Force -ErrorAction SilentlyContinue
    }
  }

  if (-not $raw) {
    throw "La llamada HTTP no devolvio salida: $Method $Url"
  }

  return $raw | ConvertFrom-Json
}

function Invoke-BackendJson {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $headerList = @()
  foreach ($key in $Headers.Keys) {
    $headerList += ("{0}: {1}" -f $key, $Headers[$key])
  }

  $response = Invoke-HttpJson -Method $Method -Url $Url -Body $Body -Headers $headerList
  return [pscustomobject]@{
    status = [int]$response.status
    ok = ($response.status -ge 200 -and $response.status -lt 300)
    body = $response.body
    rawText = $response.rawText
  }
}

function Get-SupabaseRows {
  param([string]$Url)

  $response = Invoke-HttpJson -Method "GET" -Url $Url -Headers @(
    "apikey: $env:SUPABASE_SERVICE_ROLE_KEY",
    "Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
  )

  if (-not $response.body) {
    return @()
  }

  if ($response.body -is [System.Array]) {
    return $response.body
  }

  return @($response.body)
}

function Update-SupabaseRow {
  param(
    [string]$Url,
    [object]$Body
  )

  return Invoke-HttpJson -Method "PATCH" -Url $Url -Body $Body -Headers @(
    "apikey: $env:SUPABASE_SERVICE_ROLE_KEY",
    "Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY",
    "Prefer: return=representation"
  )
}

function Normalize-IsoMinuteString {
  param([string]$Value)

  if (-not $Value) {
    return $null
  }

  return ([DateTimeOffset]::Parse($Value)).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

Set-EnvFromFile -Path $EnvFile

foreach ($requiredKey in @("BACKOFFICE_API_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
  $requiredValue = [Environment]::GetEnvironmentVariable($requiredKey)

  if (-not $requiredValue -or -not $requiredValue.Trim()) {
    throw "Falta la variable de entorno obligatoria: $requiredKey"
  }
}

if (-not $RequestedFirstRunAt) {
  $RequestedFirstRunAt = [DateTimeOffset]::UtcNow.AddDays(1).ToString("o")
}

$baseUrl = $BackendBaseUrl.TrimEnd("/")
$authHeader = "Bearer $env:BACKOFFICE_API_TOKEN"
$templateKey = "client_controlled_run_stage"
$supabaseBaseUrl = $env:SUPABASE_URL.TrimEnd("/")

$targetRowUrl = "$supabaseBaseUrl/rest/v1/automatizaciones?select=id,cliente_id,nombre,n8n_workflow_id,estado,proxima_ejecucion&cliente_id=eq.$ClientId&n8n_workflow_id=eq.$TargetWorkflowId&limit=1"
$targetRows = @(Get-SupabaseRows -Url $targetRowUrl)
$targetBefore = if ($targetRows.Count -gt 0) { $targetRows[0] } else { $null }

if (-not $targetBefore) {
  throw "No se encontro la automatizacion objetivo para el cliente indicado."
}

$provisionUrl = "$baseUrl/api/automatizaciones/backoffice/$ClientId/provisionar-base"
$provisionResponse = Invoke-BackendJson -Method "POST" -Url $provisionUrl -Headers @{
  Authorization = $authHeader
} -Body @{
  template = $templateKey
}

if (-not $provisionResponse.ok -or -not $provisionResponse.body.success) {
  throw "Fallo al provisionar la automatizacion base."
}

$provision = $provisionResponse.body.provision
$automationId = $provision.automatizacion.id
$workflowId = $provision.automatizacion.n8n_workflow_id

if (-not $automationId -or -not $workflowId) {
  throw "La provision no devolvio automatizacion.id o n8n_workflow_id."
}

$executeUrl = "$baseUrl/api/automatizaciones/backoffice/$ClientId/$workflowId/ejecutar"
$executeResponse = Invoke-BackendJson -Method "POST" -Url $executeUrl -Headers @{
  Authorization = $authHeader
} -Body @{
  scope = "controlled_run_stage"
  target_workflow_id = $TargetWorkflowId
  requested_first_run_at = $RequestedFirstRunAt
  run_window = "manual_controlled"
}

if (-not $executeResponse.ok -or -not $executeResponse.body.success) {
  throw "Fallo al ejecutar la automatizacion base."
}

$executionBody = $executeResponse.body
$correlationId = $executionBody.correlation_id

if (-not $correlationId) {
  throw "La ejecucion no devolvio correlation_id."
}

$workflowUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=workflow_name,status,correlation_id,input_payload,created_at,finished_at&workflow_name=eq.automation_client_controlled_run_stage&correlation_id=eq.$correlationId&order=created_at.desc&limit=1"
$executionLogUrl = "$supabaseBaseUrl/rest/v1/ejecuciones?select=automatizacion_id,estado,resultado,error_mensaje,fecha_ejecucion,duracion_ms&automatizacion_id=eq.$automationId&order=fecha_ejecucion.desc&limit=1"
$targetAfterUrl = "$supabaseBaseUrl/rest/v1/automatizaciones?select=id,cliente_id,nombre,n8n_workflow_id,estado,proxima_ejecucion&cliente_id=eq.$ClientId&n8n_workflow_id=eq.$TargetWorkflowId&limit=1"

$workflowRows = @()
$executionRows = @()
$workflowRow = $null
$executionRow = $null
$targetAfter = $null
$expectedRunAt = Normalize-IsoMinuteString -Value $RequestedFirstRunAt

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $workflowRows = @(Get-SupabaseRows -Url $workflowUrl)
  $executionRows = @(Get-SupabaseRows -Url $executionLogUrl)
  $targetAfterRows = @(Get-SupabaseRows -Url $targetAfterUrl)
  $workflowRow = if ($workflowRows.Count -gt 0) { $workflowRows[0] } else { $null }
  $executionRow = if ($executionRows.Count -gt 0) { $executionRows[0] } else { $null }
  $targetAfter = if ($targetAfterRows.Count -gt 0) { $targetAfterRows[0] } else { $null }

  $targetMatches = $false
  if ($targetAfter -and $targetAfter.proxima_ejecucion) {
    $targetMatches = (Normalize-IsoMinuteString -Value $targetAfter.proxima_ejecucion) -eq $expectedRunAt
  }

  if (
    $workflowRow -and
    $executionRow -and
    $targetMatches -and
    $workflowRow.status -eq "completed" -and
    $executionRow.estado -eq "exito"
  ) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$rollbackResponse = Invoke-BackendJson -Method "POST" -Url $executeUrl -Headers @{
  Authorization = $authHeader
} -Body @{
  scope = "controlled_run_stage_rollback"
  target_workflow_id = $TargetWorkflowId
  rollback_mode = $true
  previous_next_run = $targetBefore.proxima_ejecucion
  run_window = "manual_controlled"
}

if (-not $rollbackResponse.ok -or -not $rollbackResponse.body.success) {
  throw "Fallo al ejecutar el rollback controlado del staging."
}

$rollbackCorrelationId = $rollbackResponse.body.correlation_id

if (-not $rollbackCorrelationId) {
  throw "El rollback controlado no devolvio correlation_id."
}

$rollbackWorkflowUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=workflow_name,status,correlation_id,input_payload,created_at,finished_at&workflow_name=eq.automation_client_controlled_run_stage&correlation_id=eq.$rollbackCorrelationId&order=created_at.desc&limit=1"
$rollbackExecutionUrl = "$supabaseBaseUrl/rest/v1/ejecuciones?select=automatizacion_id,estado,resultado,error_mensaje,fecha_ejecucion,duracion_ms&automatizacion_id=eq.$automationId&fecha_ejecucion=gte.$([Uri]::EscapeDataString($executionRow.fecha_ejecucion))&order=fecha_ejecucion.desc&limit=1"
$rollbackWorkflowRow = $null
$rollbackExecutionRow = $null
$restoredTarget = $null

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $rollbackWorkflowRows = @(Get-SupabaseRows -Url $rollbackWorkflowUrl)
  $rollbackExecutionRows = @(Get-SupabaseRows -Url $rollbackExecutionUrl)
  $restoredRows = @(Get-SupabaseRows -Url $targetAfterUrl)
  $rollbackWorkflowRow = if ($rollbackWorkflowRows.Count -gt 0) { $rollbackWorkflowRows[0] } else { $null }
  $rollbackExecutionRow = if ($rollbackExecutionRows.Count -gt 0) { $rollbackExecutionRows[0] } else { $null }
  $restoredTarget = if ($restoredRows.Count -gt 0) { $restoredRows[0] } else { $null }

  $restoredMatches = $false
  if ($restoredTarget) {
    $restoredMatches = (Normalize-IsoMinuteString -Value $restoredTarget.proxima_ejecucion) -eq (Normalize-IsoMinuteString -Value $targetBefore.proxima_ejecucion)
  }

  if (
    $rollbackWorkflowRow -and
    $rollbackExecutionRow -and
    $restoredMatches -and
    $rollbackWorkflowRow.status -eq "completed" -and
    $rollbackExecutionRow.estado -eq "exito"
  ) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$result = [pscustomobject]@{
  target = [pscustomobject]@{
    workflow_id = $TargetWorkflowId
    before = $targetBefore
    after = $targetAfter
    restored = $restoredTarget
  }
  provision = [pscustomobject]@{
    created = $provision.created
    automatizacion_id = $automationId
    workflow_id = $workflowId
    template_key = $templateKey
  }
  execution = [pscustomobject]@{
    correlation_id = $correlationId
    workflow_target = $executionBody.workflow_target
    duracion_ms = $executionBody.duracion_ms
    workflow_response = $executionBody.resultado
  }
  rollback = [pscustomobject]@{
    correlation_id = $rollbackCorrelationId
    workflow_target = $rollbackResponse.body.workflow_target
    duracion_ms = $rollbackResponse.body.duracion_ms
    workflow_response = $rollbackResponse.body.resultado
  }
  persisted = [pscustomobject]@{
    ejecucion_workflow = $workflowRow
    ejecucion_backend = $executionRow
    rollback_workflow = $rollbackWorkflowRow
    rollback_backend = $rollbackExecutionRow
  }
}

$result | ConvertTo-Json -Depth 10

$restoredMatches = $false
if ($restoredTarget) {
  $restoredMatches = (Normalize-IsoMinuteString -Value $restoredTarget.proxima_ejecucion) -eq (Normalize-IsoMinuteString -Value $targetBefore.proxima_ejecucion)
}

if (
  -not $workflowRow -or
  -not $executionRow -or
  -not $rollbackWorkflowRow -or
  -not $rollbackExecutionRow -or
  -not $targetAfter -or
  $workflowRow.status -ne "completed" -or
  $executionRow.estado -ne "exito" -or
  $rollbackWorkflowRow.status -ne "completed" -or
  $rollbackExecutionRow.estado -ne "exito" -or
  (Normalize-IsoMinuteString -Value $targetAfter.proxima_ejecucion) -ne $expectedRunAt -or
  -not $restoredMatches
) {
  exit 1
}
