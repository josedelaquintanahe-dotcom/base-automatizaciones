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

  foreach ($header in $Headers) {
    $arguments += @("--header", $header)
  }

  if ($null -ne $Body) {
    $arguments += @("--body", ($Body | ConvertTo-Json -Depth 10 -Compress))
  }

  $raw = & node.exe $scriptPath @arguments

  if (-not $raw) {
    throw "La llamada HTTP no devolvio salida: $Method $Url"
  }

  return $raw | ConvertFrom-Json
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

Set-EnvFromFile -Path $EnvFile

foreach ($requiredKey in @("BACKOFFICE_API_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
  $requiredValue = [Environment]::GetEnvironmentVariable($requiredKey)

  if (-not $requiredValue -or -not $requiredValue.Trim()) {
    throw "Falta la variable de entorno obligatoria: $requiredKey"
  }
}

$baseUrl = $BackendBaseUrl.TrimEnd("/")
$authHeader = "Authorization: Bearer $env:BACKOFFICE_API_TOKEN"
$templateKey = "client_next_actions_brief"
$provisionUrl = "$baseUrl/api/automatizaciones/backoffice/$ClientId/provisionar-base"
$provisionResponse = Invoke-HttpJson -Method "POST" -Url $provisionUrl -Headers @($authHeader) -Body @{
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
$executeResponse = Invoke-HttpJson -Method "POST" -Url $executeUrl -Headers @($authHeader) -Body @{
  scope = "next_actions"
}

if (-not $executeResponse.ok -or -not $executeResponse.body.success) {
  throw "Fallo al ejecutar la automatizacion base."
}

$executionBody = $executeResponse.body
$correlationId = $executionBody.correlation_id

if (-not $correlationId) {
  throw "La ejecucion no devolvio correlation_id."
}

$supabaseBaseUrl = $env:SUPABASE_URL.TrimEnd("/")
$workflowUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=workflow_name,status,correlation_id,input_payload,created_at,finished_at&workflow_name=eq.automation_client_next_actions_brief&correlation_id=eq.$correlationId&order=created_at.desc&limit=1"
$executionLogUrl = "$supabaseBaseUrl/rest/v1/ejecuciones?select=automatizacion_id,estado,resultado,error_mensaje,fecha_ejecucion,duracion_ms&automatizacion_id=eq.$automationId&order=fecha_ejecucion.desc&limit=1"

$workflowRows = @()
$executionRows = @()
$workflowRow = $null
$executionRow = $null

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $workflowRows = @(Get-SupabaseRows -Url $workflowUrl)
  $executionRows = @(Get-SupabaseRows -Url $executionLogUrl)
  $workflowRow = if ($workflowRows.Count -gt 0) { $workflowRows[0] } else { $null }
  $executionRow = if ($executionRows.Count -gt 0) { $executionRows[0] } else { $null }

  if (
    $workflowRow -and
    $executionRow -and
    $workflowRow.status -eq "completed" -and
    $executionRow.estado -eq "exito"
  ) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$result = [pscustomobject]@{
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
  persisted = [pscustomobject]@{
    ejecucion_workflow = $workflowRow
    ejecucion_backend = $executionRow
  }
}

$result | ConvertTo-Json -Depth 10

if (
  -not $workflowRow -or
  -not $executionRow -or
  $workflowRow.status -ne "completed" -or
  $executionRow.estado -ne "exito"
) {
  exit 1
}
