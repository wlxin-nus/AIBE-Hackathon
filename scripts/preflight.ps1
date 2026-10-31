#Requires -Version 5.1
[CmdletBinding()]
param([switch]$Online)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$checks = [System.Collections.Generic.List[object]]::new()
function Add-Check([string]$Name, [string]$Status, $Detail) {
    $checks.Add([pscustomobject]@{ name = $Name; status = $Status; detail = $Detail })
}
Push-Location -LiteralPath $projectRoot
try {
    foreach ($tool in @('node','npm','git','claude')) {
        $command = Get-Command $tool -ErrorAction SilentlyContinue | Select-Object -First 1
        if (!$command) { Add-Check $tool 'fail' 'Command not found'; continue }
        $version = (& $tool --version 2>&1 | Out-String).Trim()
        $ok = $LASTEXITCODE -eq 0
        Add-Check $tool $(if ($ok) { 'pass' } else { 'fail' }) ([ordered]@{ version = $version; path = $command.Source })
    }
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $version = [version](& node -p 'process.versions.node')
        $compatible = ($version.Major -gt 22) -or ($version.Major -eq 22 -and $version.Minor -ge 12) -or ($version.Major -eq 20 -and $version.Minor -ge 19)
        Add-Check 'vite-node-compatibility' $(if ($compatible) { 'pass' } else { 'fail' }) 'Vite requirement checked: ^20.19.0 || >=22.12.0'
    }
    if (Get-Command claude -ErrorAction SilentlyContinue) {
        try {
            $auth = (& claude auth status 2>$null | Out-String) | ConvertFrom-Json
            Add-Check 'claude-auth-local' $(if ($auth.loggedIn) { 'pass' } else { 'fail' }) ([ordered]@{ loggedIn = [bool]$auth.loggedIn; authMethod = $auth.authMethod; subscriptionType = $auth.subscriptionType })
        } catch { Add-Check 'claude-auth-local' 'fail' 'Authentication status unavailable; no credentials logged.' }
    }
    $browsers = @('C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe') | Where-Object { Test-Path -LiteralPath $_ }
    Add-Check 'browser-installed' $(if ($browsers.Count -gt 0) { 'pass' } else { 'fail' }) @($browsers)
    $skill = Join-Path $projectRoot '.claude/skills/frontend-design/SKILL.md'
    $lockFile = Join-Path $projectRoot 'docs/skills-lock.json'
    $skillOk = (Test-Path -LiteralPath $skill) -and (Test-Path -LiteralPath $lockFile)
    if ($skillOk) {
        $lock = Get-Content -LiteralPath $lockFile -Raw | ConvertFrom-Json
        foreach ($file in $lock.files) {
            $installedFile = Join-Path $projectRoot $file.file
            if (!(Test-Path -LiteralPath $installedFile) -or (Get-FileHash -LiteralPath $installedFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.sha256) { $skillOk = $false }
        }
    }
    Add-Check 'frontend-design-integrity' $(if ($skillOk) { 'pass' } else { 'fail' }) 'Project-local skill and recorded SHA256 hashes'
    $gitRoot = (& git rev-parse --show-toplevel 2>$null | Out-String).Trim()
    Add-Check 'git-project-root' $(if ($LASTEXITCODE -eq 0 -and [IO.Path]::GetFullPath($gitRoot) -eq $projectRoot) { 'pass' } else { 'fail' }) $gitRoot
    $apiPresence = [ordered]@{}
    foreach ($name in @('ANTHROPIC_API_KEY','OPENAI_API_KEY','GEMINI_API_KEY','GOOGLE_API_KEY')) { $apiPresence[$name] = ![string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name)) }
    Add-Check 'app-api-key-presence' 'info' $apiPresence
    Add-Check 'app-runtime-ai' 'info' 'Deferred until the challenge is known; developer login is not app API readiness.'
    if ($Online) {
        # Windows PowerShell 5.1 can turn native stderr notices into terminating errors.
        # Windows PowerShell 5.1 可能将原生命令的标准错误通知当作终止错误。
        $savedPreference = $ErrorActionPreference
        $npmOk = $false
        try {
            $ErrorActionPreference = 'Continue'
            & npm ping --fetch-timeout=10000 --fetch-retries=0 --loglevel=error 2>&1 | Out-Null
            $npmOk = $LASTEXITCODE -eq 0
        } catch {} finally { $ErrorActionPreference = $savedPreference }
        Add-Check 'npm-online' $(if ($npmOk) { 'pass' } else { 'fail' }) 'Official/configured registry; 10-second timeout, no retries'
        $shellPath = (Get-Process -Id $PID).Path
        $replyText = ''
        $replyCode = 1
        try {
            $ErrorActionPreference = 'Continue'
            $replyText = (& $shellPath -NoProfile -File (Join-Path $PSScriptRoot 'invoke-claude.ps1') -PromptFile tasks/ping.md -TaskId preflight-ping -TimeoutSec 180 2>&1 | Out-String)
            $replyCode = $LASTEXITCODE
        } catch {} finally { $ErrorActionPreference = $savedPreference }
        try {
            $reply = $replyText | ConvertFrom-Json
            $replyOk = $replyCode -eq 0 -and $reply.status -eq 'success' -and $reply.response.Trim() -eq 'CODEX_CLAUDE_OK' -and ($reply.reportedModel -eq 'claude-opus-5-5' -or $reply.usedModels -contains 'claude-opus-5-5')
            Add-Check 'claude-online-reply' $(if ($replyOk) { 'pass' } else { 'fail' }) ([ordered]@{ status = $reply.status; reportedModel = $reply.reportedModel; outputDir = $reply.outputDir; durationMs = $reply.durationMs })
        } catch { Add-Check 'claude-online-reply' 'fail' 'Invocation did not return a valid result; inspect outputs/claude.' }
    }
    $diagnosticsDir = Join-Path $projectRoot 'outputs/diagnostics'
    New-Item -ItemType Directory -Path $diagnosticsDir -Force | Out-Null
    $reportFile = Join-Path $diagnosticsDir ('preflight-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.json')
    $report = [ordered]@{ checkedAt = [DateTimeOffset]::Now.ToString('o'); projectRoot = $projectRoot; scope = $(if ($Online) { 'environment-and-live-connection' } else { 'offline-environment-only' }); online = [bool]$Online; passed = @($checks | Where-Object status -EQ 'fail').Count -eq 0; appRuntimeAiReady = $false; checks = @($checks.ToArray()); reportFile = $reportFile }
    [IO.File]::WriteAllText($reportFile, ($report | ConvertTo-Json -Depth 8) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
    $report | ConvertTo-Json -Depth 8
    if (!$report.passed) { exit 1 }
} finally { Pop-Location }
