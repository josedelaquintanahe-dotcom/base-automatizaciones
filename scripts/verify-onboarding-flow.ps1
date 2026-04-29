[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [string]$EnvFile = "src/backend/.env.local",

  [string]$BackendBaseUrl = "https://base-automatizaciones.onrender.com",

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

function Invoke-CurlJson {
  param(
    [string]$Url,
    [string]$Method = "GET",
    [string[]]$Headers = @(),
    [string]$Body = ""
  )

  $arguments = @("-sS", "-X", $Method, $Url)

  foreach ($header in $Headers) {
    $arguments += @("-H", $header)
  }

  if ($Body) {
    $arguments += @("--data-raw", $Body)
  }

  $raw = & curl.exe @arguments

  if (-not $raw) {
    return $null
  }

  return $raw | ConvertFrom-Json
}

function Assert-OnboardingDispatchPreflight {
  param([string]$BaseUrl)

  $statusUrl = "$($BaseUrl.TrimEnd('/'))/api/system/status"
  $statusPayload = Invoke-CurlJson -Url $statusUrl -Headers @()

  if (-not $statusPayload) {
    throw "No se recibio respuesta valida de $statusUrl"
  }

  if ($statusPayload.status -ne "ok") {
    throw "El preflight operativo ha fallado: /api/system/status no devuelve status=ok."
  }

  if (-not $statusPayload.onboardingDispatch) {
    throw "El preflight operativo ha fallado: falta onboardingDispatch en /api/system/status."
  }

  if (-not $statusPayload.onboardingDispatch.configured) {
    throw "El preflight operativo ha fallado: onboardingDispatch no esta configurado."
  }

  if ($statusPayload.onboardingDispatch.pathStatus -ne "expected") {
    throw "El preflight operativo ha fallado: onboardingDispatch.pathStatus no es expected."
  }

  return [pscustomobject]@{
    status = $statusPayload.status
    onboardingDispatch = $statusPayload.onboardingDispatch
  }
}

function Invoke-Activation {
  param(
    [string]$BaseUrl,
    [string]$TargetClientId
  )

  $url = "$($BaseUrl.TrimEnd('/'))/api/clientes/backoffice/$TargetClientId/activar-onboarding"

  $raw = & curl.exe -sS -X POST $url `
    -H "Authorization: Bearer $env:BACKOFFICE_API_TOKEN" `
    -H "Content-Type: application/json" `
    -w "`nHTTPSTATUS:%{http_code}"

  $status = ($raw -split "HTTPSTATUS:")[-1].Trim()
  $body = ($raw -split "HTTPSTATUS:")[0].Trim() | ConvertFrom-Json

  return @{
    Status = [int]$status
    Body = $body
  }
}

function Get-SupabaseRows {
  param([string]$Url)

  return Invoke-CurlJson -Url $Url -Headers @(
    "apikey: $env:SUPABASE_SERVICE_ROLE_KEY",
    "Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
  )
}

Set-EnvFromFile -Path $EnvFile
Assert-RequiredEnv -Keys @(
  "BACKOFFICE_API_TOKEN",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
)

$preflight = Assert-OnboardingDispatchPreflight -BaseUrl $BackendBaseUrl

$activation = Invoke-Activation -BaseUrl $BackendBaseUrl -TargetClientId $ClientId

if ($activation.Status -ne 200) {
  throw "La activacion devolvio HTTP $($activation.Status)."
}

$correlationId = $activation.Body.activation.correlation_id

if (-not $correlationId) {
  throw "La respuesta de activacion no devolvio correlation_id."
}

$supabaseBaseUrl = $env:SUPABASE_URL.TrimEnd("/")
$eventUrl = "$supabaseBaseUrl/rest/v1/automation_events?select=correlation_id,dispatch_status,destination,event_name,created_at&correlation_id=eq.$correlationId"
$execUrl = "$supabaseBaseUrl/rest/v1/ejecuciones_workflows?select=correlation_id,workflow_name,status,started_at,finished_at&correlation_id=eq.$correlationId"

$eventRows = @()
$execRows = @()

for ($attempt = 1; $attempt -le $PollAttempts; $attempt++) {
  $eventRows = @(Get-SupabaseRows -Url $eventUrl)
  $execRows = @(Get-SupabaseRows -Url $execUrl)

  if ($eventRows.Count -gt 0 -and $execRows.Count -gt 0) {
    break
  }

  Start-Sleep -Seconds $PollDelaySeconds
}

$result = [pscustomobject]@{
  preflight = $preflight
  status = $activation.Status
  correlation_id = $correlationId
  webhook_target = $activation.Body.activation.dispatch.webhook_target
  delivery_status = $activation.Body.activation.dispatch.delivery_status
  automation_events = $eventRows.Count
  automation_dispatch_status = if ($eventRows.Count -gt 0) { $eventRows[0].dispatch_status } else { $null }
  ejecuciones_workflows = $execRows.Count
  workflow_status = if ($execRows.Count -gt 0) { $execRows[0].status } else { $null }
  workflow_name = if ($execRows.Count -gt 0) { $execRows[0].workflow_name } else { $null }
}

$result | ConvertTo-Json -Depth 4

if (
  $activation.Status -ne 200 -or
  $result.delivery_status -ne "accepted" -or
  $result.automation_events -lt 1 -or
  $result.ejecuciones_workflows -lt 1 -or
  $result.workflow_status -ne "completed"
) {
  exit 1
}
