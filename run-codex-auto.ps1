$ProjectPath = "C:\Users\Manuel\PROJECTS\base-automatizaciones"
$PromptPath = "$ProjectPath\codex-auto-prompt.txt"
$LogDir = "$ProjectPath\.codex\logs"

New-Item -ItemType Directory -Force $LogDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LogFile = "$LogDir\codex-auto_$Timestamp.log"

Set-Location $ProjectPath

"===============================" | Tee-Object -FilePath $LogFile
"CODEX AUTO RUN - $Timestamp" | Tee-Object -FilePath $LogFile -Append
"PROJECT: $ProjectPath" | Tee-Object -FilePath $LogFile -Append
"===============================" | Tee-Object -FilePath $LogFile -Append
"" | Tee-Object -FilePath $LogFile -Append

"--- GIT STATUS BEFORE ---" | Tee-Object -FilePath $LogFile -Append
git status --short | Tee-Object -FilePath $LogFile -Append
"" | Tee-Object -FilePath $LogFile -Append

"--- CODEX OUTPUT ---" | Tee-Object -FilePath $LogFile -Append
Get-Content -Raw $PromptPath | codex exec --full-auto 2>&1 | Tee-Object -FilePath $LogFile -Append

"" | Tee-Object -FilePath $LogFile -Append
"--- GIT STATUS AFTER ---" | Tee-Object -FilePath $LogFile -Append
git status --short | Tee-Object -FilePath $LogFile -Append

"" | Tee-Object -FilePath $LogFile -Append
"Log guardado en: $LogFile" | Tee-Object -FilePath $LogFile -Append

Write-Host ""
Write-Host "Codex ha terminado."
Write-Host "Log guardado en:"
Write-Host $LogFile
Write-Host ""
Write-Host "Estado Git:"
git status --short
