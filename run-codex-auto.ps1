$ProjectPath = "C:\Users\Manuel\PROJECTS\base-automatizaciones"
$PromptPath = "$ProjectPath\codex-auto-prompt.txt"
$LogDir = "$ProjectPath\.codex\logs"
$FallbackLogDir = "$ProjectPath\.tmp\codex-logs"
$CodexRuntimeDir = "$ProjectPath\.tmp\codex-home"
$CodexCliPath = "C:\Users\manuel\AppData\Roaming\npm\node_modules\@openai\codex\bin\codex.js"
$NodeExePath = "C:\Program Files\nodejs\node.exe"
$SslCertFilePath = "C:\Program Files\Git\usr\ssl\cert.pem"
$script:ActiveLogFile = $null
$script:ActiveLogEnabled = $false

function Initialize-LogFile {
    param(
        [string]$PreferredDir,
        [string]$FallbackDir,
        [string]$Timestamp
    )

    $candidateDirs = @($PreferredDir, $FallbackDir)

    foreach ($dir in $candidateDirs) {
        try {
            New-Item -ItemType Directory -Force -Path $dir -ErrorAction Stop | Out-Null
            $logFile = Join-Path $dir ("codex-auto_{0}.log" -f $Timestamp)
            "" | Set-Content -LiteralPath $logFile -Encoding utf8 -ErrorAction Stop
            $script:ActiveLogFile = $logFile
            $script:ActiveLogEnabled = $true
            return $logFile
        }
        catch {
            continue
        }
    }

    $script:ActiveLogFile = $null
    $script:ActiveLogEnabled = $false
    return $null
}

function Write-LogLine {
    param(
        [string]$Text = "",
        [switch]$NoConsole
    )

    if (-not $NoConsole) {
        Write-Host $Text
    }

    if ($script:ActiveLogEnabled -and $script:ActiveLogFile) {
        try {
            Add-Content -LiteralPath $script:ActiveLogFile -Value $Text -Encoding utf8 -ErrorAction Stop
        }
        catch {
            $script:ActiveLogEnabled = $false
            $script:ActiveLogFile = $null
            Write-Host "Aviso: no se pudo seguir escribiendo el log de codexauto. La ejecucion continua sin log persistente."
        }
    }
}

function Initialize-CodexRuntime {
    param(
        [string]$RuntimeDir,
        [string]$SourceCodexHome
    )

    New-Item -ItemType Directory -Force -Path $RuntimeDir -ErrorAction Stop | Out-Null

    $sourceAuthPath = Join-Path $SourceCodexHome "auth.json"
    $sourceAgentsPath = Join-Path $SourceCodexHome "AGENTS.md"
    $sourceConfigPath = Join-Path $SourceCodexHome "config.toml"

    if (-not (Test-Path $sourceAuthPath)) {
        throw "No se encontro auth.json en $sourceAuthPath"
    }

    Copy-Item -LiteralPath $sourceAuthPath -Destination (Join-Path $RuntimeDir "auth.json") -Force

    if (Test-Path $sourceAgentsPath) {
        Copy-Item -LiteralPath $sourceAgentsPath -Destination (Join-Path $RuntimeDir "AGENTS.md") -Force
    }

    if (Test-Path $sourceConfigPath) {
        $configText = Get-Content -Raw $sourceConfigPath
        $configText = [regex]::Replace($configText, '(?ms)^\[windows\].*?(?=^\[|\z)', '')
        Set-Content -LiteralPath (Join-Path $RuntimeDir "config.toml") -Value $configText.Trim() -Encoding utf8
    }

    $env:CODEX_HOME = $RuntimeDir
    $env:SSL_CERT_FILE = $SslCertFilePath
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LogFile = Initialize-LogFile -PreferredDir $LogDir -FallbackDir $FallbackLogDir -Timestamp $Timestamp

Set-Location $ProjectPath
Initialize-CodexRuntime -RuntimeDir $CodexRuntimeDir -SourceCodexHome (Join-Path $env:USERPROFILE ".codex")

Write-LogLine "===============================" -NoConsole
Write-LogLine "CODEX AUTO RUN - $Timestamp" -NoConsole
Write-LogLine "PROJECT: $ProjectPath" -NoConsole
Write-LogLine "===============================" -NoConsole
Write-LogLine "" -NoConsole

Write-LogLine "--- GIT STATUS BEFORE ---" -NoConsole
$gitStatusBefore = git status --short
foreach ($line in $gitStatusBefore) {
    Write-LogLine $line -NoConsole
}
Write-LogLine "" -NoConsole

Write-LogLine "--- CODEX OUTPUT ---" -NoConsole
$outputLines = Get-Content -Raw $PromptPath | & $NodeExePath $CodexCliPath exec --sandbox workspace-write 2>&1
$outputText = ($outputLines -join [Environment]::NewLine)
foreach ($line in ($outputText -split "(`r`n|`n|`r)")) {
    if ($line -ne "`r" -and $line -ne "`n") {
        Write-LogLine $line -NoConsole
    }
}

Write-LogLine "" -NoConsole
Write-LogLine "--- GIT STATUS AFTER ---" -NoConsole
$gitStatusAfter = git status --short
foreach ($line in $gitStatusAfter) {
    Write-LogLine $line -NoConsole
}

Write-LogLine "" -NoConsole
if ($script:ActiveLogEnabled -and $LogFile) {
    Write-LogLine "Log guardado en: $LogFile" -NoConsole
}

Write-Host ""
Write-Host "Codex ha terminado."
Write-Host "Log guardado en:"
if ($script:ActiveLogEnabled -and $LogFile) {
    Write-Host $LogFile
}
else {
    Write-Host "Sin log persistente"
}
Write-Host ""
Write-Host "Estado Git:"
$gitStatusAfter | Write-Host
