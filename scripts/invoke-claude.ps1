#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PromptFile,
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$')][string]$TaskId,
    [ValidateRange(1,180)][int]$TimeoutSec = 180,
    [ValidateSet('isolated','normal')][string]$Mode = 'isolated',
    [switch]$FrontendDesign
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$OutputEncoding = [Text.UTF8Encoding]::new($false)
$projectRoot = Split-Path -Parent $PSScriptRoot
try {
    $claudePath = (Get-Command claude -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    $runnerArgs = @((Join-Path $PSScriptRoot 'claude-runner.cjs'), '--prompt-file', $PromptFile, '--task-id', $TaskId, '--timeout-seconds', "$TimeoutSec", '--mode', $Mode, '--claude-executable', $claudePath)
    if ($FrontendDesign) { $runnerArgs += '--frontend-design' }
    Push-Location -LiteralPath $projectRoot
    try { & node @runnerArgs; $resultCode = $LASTEXITCODE } finally { Pop-Location }
    exit $resultCode
} catch {
    [pscustomobject]@{ status = 'configuration_error'; message = $_.Exception.Message } | ConvertTo-Json
    exit 1
}
