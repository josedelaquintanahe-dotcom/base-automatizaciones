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

function Get-PendingInvoice {
  param([string]$SupabaseBaseUrl, [string]$ClienteId)

  $pendingUrl = "$SupabaseBaseUrl/rest/v1/facturas?select=id,cliente_id,mes,estado,total,created_at&cliente_id=eq.$ClienteId&estado=eq.pendiente&order=created_at.desc&limit=1"
  $rows = @(Get-SupabaseRows -Url $pendingUrl)

  if ($rows.Count -eq 0) {
    throw "No se encontro ninguna factura pendiente para validar la cancelacion."
  }

  return $rows[0]
}

Set-EnvFromFile -Path $EnvFile

foreach ($requiredKey in @("BACKOFFICE_API_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
  $requiredValue = [Environment]::GetEnvironmentVariable($requiredKey)

  if (-not $requiredValue -or -not $requiredValue.Trim()) {
    throw "Falta la variable de entorno obligatoria: $requiredKey"
  }
}

$baseUrl = $BackendBaseUrl.TrimEnd("/")
$authHeader = "Bearer $env:BACKOFFICE_API_TOKEN"
$templateKey = "client_invoice_cancel"
$supabaseBaseUrl = $env:SUPABASE_URL.TrimEnd("/")
$pendingInvoice = Get-PendingInvoice -SupabaseBaseUrl $supabaseBaseUrl -ClienteId $ClientId
$invoiceId = $pendingInvoice.id
$invoiceMonth = $pendingInvoice.mes

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
  scope = "invoice_cancel"
  invoice_id = $invoiceId
  invoice_month = $invoiceMonth
  expected_status = "pendiente"
  cancel_reason = "rollback_test_versioned"
}

if (-not $executeResponse.ok -or -not $executeResponse.body.success) {
  throw "Fallo al ejecutar la automatizacion base."
}

$executionBody = $executeResponse.body
$correlationId = $executionBody.correlation_id

if (-not $correlationId) {
  throw "La ejecucion no devolvio correlation_id."
}

if (
  -not $executionBody.resultado -or
  $executionBody.resultado.accepted -ne $true -or
  $executionBody.resultado.workflow_name -ne "automation_client_invoice_cancel" -or
  $executionBody.resultado.correlation_id -ne $correlationId
) {
  throw "La respuesta del workflow no cumple el contrato esperado para la ejecucion principal."
}

$workflowUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=workflow_name,status,correlation_id,input_payload,created_at,finished_at&workflow_name=eq.automation_client_invoice_cancel&correlation_id=eq.$correlationId&order=created_at.desc&limit=1"
$executionLogUrl = "$supabaseBaseUrl/rest/v1/ejecuciones?select=automatizacion_id,estado,resultado,error_mensaje,fecha_ejecucion,duracion_ms&automatizacion_id=eq.$automationId&order=fecha_ejecucion.desc&limit=1"
$invoiceUrl = "$supabaseBaseUrl/rest/v1/facturas?select=id,cliente_id,mes,estado,total,created_at&id=eq.$invoiceId&cliente_id=eq.$ClientId&order=created_at.desc&limit=1"

$workflowRow = $null
$executionRow = $null
$invoiceRow = $null

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $workflowRows = @(Get-SupabaseRows -Url $workflowUrl)
  $executionRows = @(Get-SupabaseRows -Url $executionLogUrl)
  $invoiceRows = @(Get-SupabaseRows -Url $invoiceUrl)
  $workflowRow = if ($workflowRows.Count -gt 0) { $workflowRows[0] } else { $null }
  $executionRow = if ($executionRows.Count -gt 0) { $executionRows[0] } else { $null }
  $invoiceRow = if ($invoiceRows.Count -gt 0) { $invoiceRows[0] } else { $null }

  if (
    $workflowRow -and
    $executionRow -and
    $invoiceRow -and
    $workflowRow.status -eq "completed" -and
    $executionRow.estado -eq "exito" -and
    $invoiceRow.estado -eq "cancelada"
  ) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$rollbackResponse = Invoke-BackendJson -Method "POST" -Url $executeUrl -Headers @{
  Authorization = $authHeader
} -Body @{
  scope = "invoice_cancel_rollback"
  rollback_mode = $true
  invoice_id = $invoiceId
  invoice_month = $invoiceMonth
}

if (-not $rollbackResponse.ok -or -not $rollbackResponse.body.success) {
  throw "Fallo al ejecutar el rollback de la cancelacion."
}

$rollbackBody = $rollbackResponse.body
$rollbackCorrelationId = $rollbackBody.correlation_id

if (-not $rollbackCorrelationId) {
  throw "El rollback no devolvio correlation_id."
}

if ($rollbackCorrelationId -eq $correlationId) {
  throw "El rollback debe devolver un correlation_id tecnico distinto al de la ejecucion principal."
}

if (
  -not $rollbackBody.resultado -or
  $rollbackBody.resultado.accepted -ne $true -or
  $rollbackBody.resultado.workflow_name -ne "automation_client_invoice_cancel" -or
  $rollbackBody.resultado.correlation_id -ne $rollbackCorrelationId
) {
  throw "La respuesta del workflow no cumple el contrato esperado para el rollback."
}

$rollbackWorkflowUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=workflow_name,status,correlation_id,input_payload,created_at,finished_at&workflow_name=eq.automation_client_invoice_cancel&correlation_id=eq.$rollbackCorrelationId&order=created_at.desc&limit=1"
$rollbackExecutionUrl = "$supabaseBaseUrl/rest/v1/ejecuciones?select=automatizacion_id,estado,resultado,error_mensaje,fecha_ejecucion,duracion_ms&automatizacion_id=eq.$automationId&order=fecha_ejecucion.desc&limit=1"

$rollbackWorkflowRow = $null
$rollbackExecutionRow = $null
$invoiceAfterRollback = $null

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $rollbackWorkflowRows = @(Get-SupabaseRows -Url $rollbackWorkflowUrl)
  $rollbackExecutionRows = @(Get-SupabaseRows -Url $rollbackExecutionUrl)
  $invoiceAfterRows = @(Get-SupabaseRows -Url $invoiceUrl)
  $rollbackWorkflowRow = if ($rollbackWorkflowRows.Count -gt 0) { $rollbackWorkflowRows[0] } else { $null }
  $rollbackExecutionRow = if ($rollbackExecutionRows.Count -gt 0) { $rollbackExecutionRows[0] } else { $null }
  $invoiceAfterRollback = if ($invoiceAfterRows.Count -gt 0) { $invoiceAfterRows[0] } else { $null }

  if (
    $rollbackWorkflowRow -and
    $rollbackExecutionRow -and
    $invoiceAfterRollback -and
    $rollbackWorkflowRow.status -eq "completed" -and
    $rollbackExecutionRow.estado -eq "exito" -and
    $invoiceAfterRollback.estado -eq "pendiente"
  ) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$result = [pscustomobject]@{
  target_invoice = [pscustomobject]@{
    invoice_id = $invoiceId
    invoice_month = $invoiceMonth
    previous_status = $pendingInvoice.estado
    total = $pendingInvoice.total
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
    workflow_target = $rollbackBody.workflow_target
    duracion_ms = $rollbackBody.duracion_ms
    workflow_response = $rollbackBody.resultado
  }
  persisted = [pscustomobject]@{
    ejecucion_workflow = $workflowRow
    ejecucion_backend = $executionRow
    factura_cancelada = $invoiceRow
    rollback_workflow = $rollbackWorkflowRow
    rollback_backend = $rollbackExecutionRow
    factura_final = $invoiceAfterRollback
  }
}

$result | ConvertTo-Json -Depth 10

if (
  -not $workflowRow -or
  -not $executionRow -or
  -not $invoiceRow -or
  -not $rollbackWorkflowRow -or
  -not $rollbackExecutionRow -or
  -not $invoiceAfterRollback -or
  $workflowRow.status -ne "completed" -or
  $executionRow.estado -ne "exito" -or
  $invoiceRow.estado -ne "cancelada" -or
  $rollbackWorkflowRow.status -ne "completed" -or
  $rollbackExecutionRow.estado -ne "exito" -or
  $invoiceAfterRollback.estado -ne "pendiente"
) {
  exit 1
}
