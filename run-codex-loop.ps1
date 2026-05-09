$ProjectPath = "C:\Users\Manuel\PROJECTS\base-automatizaciones"
$PromptPath = "$ProjectPath\codex-auto-prompt.txt"
$PromptGuidePath = "$ProjectPath\prompt.md"
$PreferredLogDir = "$ProjectPath\.codex\logs"
$FallbackLogDir = "$ProjectPath\.tmp\codex-logs"
$CodexRuntimeDir = "$ProjectPath\.tmp\codex-home"
$CodexCliPath = "C:\Users\manuel\AppData\Roaming\npm\node_modules\@openai\codex\bin\codex.js"
$NodeExePath = "C:\Program Files\nodejs\node.exe"
$SslCertFilePath = "C:\Program Files\Git\usr\ssl\cert.pem"
$MaxIterations = 5
$TempPromptPath = Join-Path $ProjectPath ".tmp\codex-loop-next-prompt.txt"
$ParseTailLines = 200
$script:ActiveLogFile = $null
$script:ActiveLogEnabled = $false

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

function Initialize-LogFile {
    param(
        [string]$PreferredDir,
        [string]$FallbackDir,
        [string]$Timestamp,
        [int]$Iteration
    )

    $candidateDirs = @($PreferredDir, $FallbackDir)

    foreach ($dir in $candidateDirs) {
        try {
            New-Item -ItemType Directory -Force -Path $dir -ErrorAction Stop | Out-Null
            $logFile = Join-Path $dir ("codex-loop_{0}_iter-{1}.log" -f $Timestamp, $Iteration)
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
            Write-Host "Aviso: no se pudo seguir escribiendo el log de codexloop. El bucle continua sin log persistente."
        }
    }
}

function Get-CleanOutputText {
    param([string]$OutputText)

    if (-not $OutputText) {
        return ""
    }

    $lines = $OutputText -split "(`r`n|`n|`r)"
    $filteredLines = New-Object System.Collections.Generic.List[string]

    foreach ($line in $lines) {
        if (
            $line -match '^\s*System\.Management\.Automation\.RemoteException\s*$' -or
            $line -match '^\s*Reading prompt from stdin\.\.\.\s*$' -or
            $line -match '^\s*\. : No se puede cargar el archivo .*Microsoft\.PowerShell_profile\.ps1.*$' -or
            $line -match '^\s*about_Execution_Policies.*$' -or
            $line -match '^\s*En l[ií]nea:\s*\d+\s*Car[aá]cter:\s*\d+.*$' -or
            $line -match '^\s*\+\s+\. .*Microsoft\.PowerShell_profile.*$' -or
            $line -match '^\s*\+\s+~+\s*$' -or
            $line -match '^\s*CategoryInfo\s*:.*$' -or
            $line -match '^\s*FullyQualifiedErrorId\s*:.*$' -or
            $line -match '^\s*OpenAI Codex v' -or
            $line -match '^\s*workdir:\s*' -or
            $line -match '^\s*model:\s*' -or
            $line -match '^\s*provider:\s*' -or
            $line -match '^\s*approval:\s*' -or
            $line -match '^\s*sandbox:\s*' -or
            $line -match '^\s*reasoning effort:\s*' -or
            $line -match '^\s*reasoning summaries:\s*' -or
            $line -match '^\s*session id:\s*' -or
            $line -match '^\s*--------\s*$' -or
            $line -match '^\s*codex\s*$' -or
            $line -match '^\s*user\s*$'
        ) {
            continue
        }

        $filteredLines.Add($line)
    }

    $cleanText = ($filteredLines -join [Environment]::NewLine)
    $cleanText = [regex]::Replace($cleanText, "(\r?\n){3,}", [Environment]::NewLine + [Environment]::NewLine)
    return $cleanText.Trim()
}

function Sanitize-PromptText {
    param([string]$PromptText)

    if (-not $PromptText) {
        return $null
    }

    $truncateMarkers = @(
        '. : No se puede cargar el archivo',
        'about_Execution_Policies',
        'Microsoft.PowerShell_profile.ps1'
    )

    foreach ($marker in $truncateMarkers) {
        $markerIndex = $PromptText.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase)
        if ($markerIndex -ge 0) {
            $PromptText = $PromptText.Substring(0, $markerIndex)
        }
    }

    $lines = $PromptText -split "(`r`n|`n|`r)"
    $sanitizedLines = New-Object System.Collections.Generic.List[string]

    foreach ($line in $lines) {
        if (
            $line -match 'No se puede cargar el archivo' -or
            $line -match 'about_Execution_Policies' -or
            $line -match 'Microsoft\.PowerShell_profile' -or
            $line -match '^\s*En l.*Car.*:\s*\d+.*$' -or
            $line -match '^\s*\+\s+\. .*Microsoft\.PowerShell_profile.*$' -or
            $line -match '^\s*\+\s+~+\s*$' -or
            $line -match 'CategoryInfo' -or
            $line -match 'FullyQualifiedErrorId'
        ) {
            continue
        }

        $sanitizedLines.Add($line)
    }

    $sanitizedText = ($sanitizedLines -join [Environment]::NewLine)
    $sanitizedText = [regex]::Replace($sanitizedText, "(\r?\n){3,}", [Environment]::NewLine + [Environment]::NewLine)
    return $sanitizedText.Trim()
}

function Get-OutputTailForParsing {
    param(
        [string]$OutputText,
        [int]$TailLineCount = 200
    )

    if (-not $OutputText) {
        return ""
    }

    $lines = $OutputText -split "(`r`n|`n|`r)"

    if ($lines.Count -le $TailLineCount) {
        return $OutputText.Trim()
    }

    $tail = $lines[($lines.Count - $TailLineCount)..($lines.Count - 1)]
    return (($tail -join [Environment]::NewLine).Trim())
}

function Get-NextPromptFromOutput {
    param([string]$OutputText)

    if (-not $OutputText) {
        return $null
    }

    $structuredMatches = [regex]::Matches(
        $OutputText,
        '(?is)===\s*CODEX_NEXT\s*===.*?prompt:\s*```(?:text)?\s*(.*?)\s*```\s*===\s*/CODEX_NEXT\s*==='
    )

    if ($structuredMatches.Count -gt 0) {
        return $structuredMatches[$structuredMatches.Count - 1].Groups[1].Value.Trim()
    }

    $matches = [regex]::Matches(
        $OutputText,
        '(?is)siguiente prompt exacto(?: recomendado)?\s*:\s*```(?:text)?\s*(.*?)\s*```'
    )

    if ($matches.Count -gt 0) {
        return $matches[$matches.Count - 1].Groups[1].Value.Trim()
    }

    return $null
}

function Get-NextBlockFromOutput {
    param([string]$OutputText)

    if (-not $OutputText) {
        return $null
    }

    $structuredMatches = [regex]::Matches(
        $OutputText,
        '(?im)===\s*CODEX_NEXT\s*===.*?^\s*block:\s*(.+?)\s*$.*?===\s*/CODEX_NEXT\s*===',
        [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::Multiline
    )

    if ($structuredMatches.Count -gt 0) {
        return $structuredMatches[$structuredMatches.Count - 1].Groups[1].Value.Trim()
    }

    $patterns = @(
        '(?im)^\s*-\s*siguiente bloque recomendado\s*:\s*`?([^`\r\n]+)`?\s*$',
        '(?im)^\s*siguiente bloque recomendado\s*:\s*`?([^`\r\n]+)`?\s*$'
    )

    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($OutputText, $pattern)
        if ($matches.Count -gt 0) {
            return $matches[$matches.Count - 1].Groups[1].Value.Trim()
        }
    }

    return $null
}

function Get-NextStepFromOutput {
    param([string]$OutputText)

    if (-not $OutputText) {
        return $null
    }

    $patterns = @(
        '(?im)^\s*-\s*siguiente paso recomendado\s*:\s*(.+?)\s*$',
        '(?im)^\s*\*\*Siguiente paso recomendado\*\*\s*$\s*(.+?)\s*$',
        '(?im)^\s*siguiente paso recomendado\s*:\s*(.+?)\s*$'
    )

    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($OutputText, $pattern)
        if ($matches.Count -gt 0) {
            return $matches[$matches.Count - 1].Groups[1].Value.Trim(" `t`r`n`"")
        }
    }

    return $null
}

function Get-PromptForBlock {
    param(
        [string]$PromptGuideText,
        [string]$BlockName
    )

    if (-not $PromptGuideText -or -not $BlockName) {
        return $null
    }

    $escapedBlockName = [regex]::Escape($BlockName.Trim())
    $pattern = '(?is)##\s+\d+\.\s+{0}.*?\*\*Prompt exacto para Codex\*\*\s*```text\s*(.*?)\s*```' -f $escapedBlockName
    $match = [regex]::Match($PromptGuideText, $pattern)

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return $null
}

function Get-BlockNamesFromPromptGuide {
    param([string]$PromptGuideText)

    if (-not $PromptGuideText) {
        return @()
    }

    $matches = [regex]::Matches($PromptGuideText, '(?im)^##\s+\d+\.\s+(.+?)\s*$')
    $blockNames = @()

    foreach ($match in $matches) {
        $blockNames += $match.Groups[1].Value.Trim()
    }

    return $blockNames
}

function Resolve-BlockFromRecommendedStep {
    param(
        [string]$RecommendedStep,
        [string[]]$KnownBlockNames
    )

    if (-not $RecommendedStep) {
        return $null
    }

    $normalizedStep = $RecommendedStep.ToLowerInvariant()

    foreach ($blockName in $KnownBlockNames) {
        if ($normalizedStep -like "*$($blockName.ToLowerInvariant())*") {
            return $blockName
        }
    }

    $keywordMap = @(
        @{ Pattern = 'desplieg|render|staging|publicar|validar.*entorno'; Block = 'Preparacion de despliegue' },
        @{ Pattern = 'n8n|workflow|workflows'; Block = 'Revision de n8n/workflows' },
        @{ Pattern = 'seguridad|secret|token|permis|rls'; Block = 'Revision de seguridad' },
        @{ Pattern = 'frontend|vite|ui|ux'; Block = 'Revision de frontend' },
        @{ Pattern = 'backend|servicio|ruta|middleware|adaptador'; Block = 'Revision de backend' },
        @{ Pattern = 'supabase|base de datos|database|sql|tabla'; Block = 'Revision de Supabase/base de datos' },
        @{ Pattern = 'qa|test|tests|lint|build'; Block = 'QA, tests, lint y build' },
        @{ Pattern = 'error|fallo|bug|correg'; Block = 'Correccion de errores' },
        @{ Pattern = 'documentacion|docs|status|roadmap'; Block = 'Documentacion' },
        @{ Pattern = 'ventas|comercial|oferta|icp'; Block = 'Preparacion comercial/ventas' },
        @{ Pattern = 'commit|push|git'; Block = 'Commit y push' },
        @{ Pattern = 'cierre|cerrar bloque'; Block = 'Cierre de bloque' },
        @{ Pattern = 'disen|diseñ|siguiente funcionalidad'; Block = 'Diseno de siguiente funcionalidad' },
        @{ Pattern = 'implement|construir|publicar y validar'; Block = 'Implementacion de funcionalidad' },
        @{ Pattern = 'diagnost'; Block = 'Diagnostico inicial del proyecto' }
    )

    foreach ($entry in $keywordMap) {
        if ($normalizedStep -match $entry.Pattern) {
            return $entry.Block
        }
    }

    return $null
}

function Has-UsageLimitError {
    param([string]$OutputText)

    if (-not $OutputText) {
        return $false
    }

    return $OutputText -match '(?is)hit your usage limit|purchase more credits|try again at'
}

New-Item -ItemType Directory -Force -Path (Split-Path $TempPromptPath -Parent) | Out-Null

Set-Location $ProjectPath
Initialize-CodexRuntime -RuntimeDir $CodexRuntimeDir -SourceCodexHome (Join-Path $env:USERPROFILE ".codex")

$promptGuideText = Get-Content -Raw $PromptGuidePath
$knownBlockNames = Get-BlockNamesFromPromptGuide -PromptGuideText $promptGuideText
$currentPromptPath = $PromptPath

for ($i = 1; $i -le $MaxIterations; $i++) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $LogFile = Initialize-LogFile -PreferredDir $PreferredLogDir -FallbackDir $FallbackLogDir -Timestamp $Timestamp -Iteration $i

    Write-LogLine "===============================" -NoConsole
    Write-LogLine "CODEX LOOP RUN - $Timestamp" -NoConsole
    Write-LogLine "ITERATION: $i / $MaxIterations" -NoConsole
    Write-LogLine "PROJECT: $ProjectPath" -NoConsole
    Write-LogLine "PROMPT SOURCE: $currentPromptPath" -NoConsole
    Write-LogLine "===============================" -NoConsole
    Write-LogLine "" -NoConsole

    Write-LogLine "--- GIT STATUS BEFORE ---" -NoConsole
    $gitStatusBefore = git status --short
    foreach ($line in $gitStatusBefore) {
        Write-LogLine $line -NoConsole
    }
    Write-LogLine "" -NoConsole

    Write-LogLine "--- CODEX OUTPUT ---" -NoConsole
    $outputLines = Get-Content -Raw $currentPromptPath | & $NodeExePath $CodexCliPath exec --sandbox workspace-write 2>&1
    $rawOutputText = ($outputLines -join [Environment]::NewLine)
    foreach ($line in ($rawOutputText -split "(`r`n|`n|`r)")) {
        if ($line -ne "`r" -and $line -ne "`n") {
            Write-LogLine $line -NoConsole
        }
    }
    $outputText = Get-CleanOutputText -OutputText $rawOutputText
    $parseText = Get-OutputTailForParsing -OutputText $outputText -TailLineCount $ParseTailLines

    Write-LogLine "" -NoConsole
    Write-LogLine "--- CODEX OUTPUT CLEAN ---" -NoConsole
    foreach ($line in ($outputText -split "(`r`n|`n|`r)")) {
        if ($line -ne "`r" -and $line -ne "`n") {
            Write-LogLine $line -NoConsole
        }
    }
    Write-LogLine "" -NoConsole
    Write-LogLine "--- CODEX OUTPUT PARSE TAIL ---" -NoConsole
    foreach ($line in ($parseText -split "(`r`n|`n|`r)")) {
        if ($line -ne "`r" -and $line -ne "`n") {
            Write-LogLine $line -NoConsole
        }
    }

    Write-Host ""
    Write-Host "==============================="
    Write-Host "Iteracion Codex $i de $MaxIterations"
    Write-Host "==============================="
    Write-Host ""
    $outputText | Write-Host

    if (Has-UsageLimitError -OutputText $outputText) {
        Write-Host ""
        Write-Host "Bucle detenido: Codex devolvio un limite de uso y no puede continuar ahora."
        break
    }

    Write-LogLine "" -NoConsole
    Write-LogLine "--- GIT STATUS AFTER ---" -NoConsole
    $GitStatus = git status --short
    foreach ($line in $GitStatus) {
        Write-LogLine $line -NoConsole
    }

    Write-LogLine "" -NoConsole
    if ($script:ActiveLogEnabled -and $LogFile) {
        Write-LogLine "Log guardado en: $LogFile" -NoConsole
    }

    Write-Host ""
    Write-Host "Estado Git tras iteracion ${i}:"
    $GitStatus | Write-Host
    if ($script:ActiveLogEnabled -and $LogFile) {
        Write-Host "Log guardado en: $LogFile"
    }
    else {
        Write-Host "Aviso: esta iteracion se ha ejecutado sin log persistente."
    }

    if ($GitStatus -match "\.env" -or $GitStatus -match "node_modules") {
        Write-Host ""
        Write-Host "PARADA DE SEGURIDAD: se detectaron archivos sensibles o no deseados."
        break
    }

    $nextPrompt = Get-NextPromptFromOutput -OutputText $parseText

    if (-not $nextPrompt) {
        $nextBlock = Get-NextBlockFromOutput -OutputText $parseText

        if ($nextBlock) {
            Write-Host ""
            Write-Host "Fallback activado: reconstruyendo prompt desde prompt.md para el bloque '$nextBlock'."
            $nextPrompt = Get-PromptForBlock -PromptGuideText $promptGuideText -BlockName $nextBlock
        }
    }

    if (-not $nextPrompt) {
        $recommendedStep = Get-NextStepFromOutput -OutputText $parseText

        if ($recommendedStep) {
            $resolvedBlock = Resolve-BlockFromRecommendedStep -RecommendedStep $recommendedStep -KnownBlockNames $knownBlockNames

            if ($resolvedBlock) {
                Write-Host ""
                Write-Host "Fallback activado: reconstruyendo prompt desde 'siguiente paso recomendado' hacia el bloque '$resolvedBlock'."
                $nextPrompt = Get-PromptForBlock -PromptGuideText $promptGuideText -BlockName $resolvedBlock
            }
        }
    }

    if (-not $nextPrompt) {
        Write-Host ""
        Write-Host "Bucle detenido: Codex no devolvio un siguiente prompt exacto reutilizable y no se pudo reconstruir desde prompt.md."
        break
    }

    $nextPrompt = Sanitize-PromptText -PromptText $nextPrompt

    if (-not $nextPrompt) {
        Write-Host ""
        Write-Host "Bucle detenido: el prompt siguiente quedo vacio tras el saneado."
        break
    }

    $nextPrompt | Set-Content -LiteralPath $TempPromptPath -Encoding utf8
    $currentPromptPath = $TempPromptPath

    if ($i -eq $MaxIterations) {
        Write-Host ""
        Write-Host "Bucle completado: se alcanzo el maximo de iteraciones configurado."
    }
}
