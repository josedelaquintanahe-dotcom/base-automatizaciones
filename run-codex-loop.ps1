$ProjectPath = "C:\Users\Manuel\PROJECTS\base-automatizaciones"
$PromptPath = "$ProjectPath\codex-auto-prompt.txt"
$PromptGuidePath = "$ProjectPath\prompt.md"
$LogDir = "$ProjectPath\.codex\logs"
$MaxIterations = 5
$TempPromptPath = Join-Path $ProjectPath ".tmp\codex-loop-next-prompt.txt"
$ParseTailLines = 200

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

New-Item -ItemType Directory -Force $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $TempPromptPath -Parent) | Out-Null

Set-Location $ProjectPath

$promptGuideText = Get-Content -Raw $PromptGuidePath
$knownBlockNames = Get-BlockNamesFromPromptGuide -PromptGuideText $promptGuideText
$currentPromptPath = $PromptPath

for ($i = 1; $i -le $MaxIterations; $i++) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $LogFile = "$LogDir\codex-loop_${Timestamp}_iter-$i.log"

    "===============================" | Tee-Object -FilePath $LogFile
    "CODEX LOOP RUN - $Timestamp" | Tee-Object -FilePath $LogFile -Append
    "ITERATION: $i / $MaxIterations" | Tee-Object -FilePath $LogFile -Append
    "PROJECT: $ProjectPath" | Tee-Object -FilePath $LogFile -Append
    "PROMPT SOURCE: $currentPromptPath" | Tee-Object -FilePath $LogFile -Append
    "===============================" | Tee-Object -FilePath $LogFile -Append
    "" | Tee-Object -FilePath $LogFile -Append

    "--- GIT STATUS BEFORE ---" | Tee-Object -FilePath $LogFile -Append
    git status --short | Tee-Object -FilePath $LogFile -Append
    "" | Tee-Object -FilePath $LogFile -Append

    "--- CODEX OUTPUT ---" | Tee-Object -FilePath $LogFile -Append
    $outputLines = Get-Content -Raw $currentPromptPath | codex exec --full-auto 2>&1
    $rawOutputText = ($outputLines -join [Environment]::NewLine)
    $rawOutputText | Tee-Object -FilePath $LogFile -Append
    $outputText = Get-CleanOutputText -OutputText $rawOutputText
    $parseText = Get-OutputTailForParsing -OutputText $outputText -TailLineCount $ParseTailLines

    "" | Tee-Object -FilePath $LogFile -Append
    "--- CODEX OUTPUT CLEAN ---" | Tee-Object -FilePath $LogFile -Append
    $outputText | Tee-Object -FilePath $LogFile -Append
    "" | Tee-Object -FilePath $LogFile -Append
    "--- CODEX OUTPUT PARSE TAIL ---" | Tee-Object -FilePath $LogFile -Append
    $parseText | Tee-Object -FilePath $LogFile -Append

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

    "" | Tee-Object -FilePath $LogFile -Append
    "--- GIT STATUS AFTER ---" | Tee-Object -FilePath $LogFile -Append
    $GitStatus = git status --short
    $GitStatus | Tee-Object -FilePath $LogFile -Append

    "" | Tee-Object -FilePath $LogFile -Append
    "Log guardado en: $LogFile" | Tee-Object -FilePath $LogFile -Append

    Write-Host ""
    Write-Host "Estado Git tras iteracion ${i}:"
    $GitStatus | Write-Host

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
