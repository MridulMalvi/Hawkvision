$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

$codexPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$venvPython = Join-Path $backend ".venv\Scripts\python.exe"

$python = if (Test-Path $codexPython) {
    $codexPython
} elseif (Test-Path $venvPython) {
    $venvPython
} else {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand -and $pythonCommand.Source -notlike "*WindowsApps*") {
        $pythonCommand.Source
    } else {
        throw "Python was not found. Install Python 3.11+ or create backend\.venv."
    }
}


$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    throw "npm.cmd was not found. Install Node.js 20+."
}

Push-Location $backend
try {
    & $python -m alembic upgrade head
    & $python -m scripts.seed
    & $python -m scripts.download_model
} finally {
    Pop-Location
}

$apiRunning = netstat -ano | Select-String "127.0.0.1:8000\s+0.0.0.0:0\s+LISTENING"
if (-not $apiRunning) {
    Start-Process -FilePath $python `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
        -WorkingDirectory $backend `
        -WindowStyle Hidden
}

$frontendRunning = netstat -ano | Select-String "127.0.0.1:5173\s+0.0.0.0:0\s+LISTENING"
if (-not $frontendRunning) {
    Start-Process -FilePath $npmCommand.Source `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1") `
        -WorkingDirectory $frontend `
        -WindowStyle Hidden
}

Write-Host ""
Write-Host "Hawkvision is starting:"
Write-Host "  App:      http://127.0.0.1:5173"
Write-Host "  API docs: http://127.0.0.1:8000/api/docs"
Write-Host "  Login:    admin@hawkvision.ai / Admin123!"
