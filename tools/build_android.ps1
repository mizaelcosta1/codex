# Configure Godot's Android SDK/JDK paths and install matching 4.6.3 templates first.
$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    New-Item -ItemType Directory -Force build | Out-Null
    & godot --headless --path . --editor --import --quit
    if ($LASTEXITCODE -ne 0) { throw 'Godot import failed' }
    & godot --headless --path . --export-debug Android build/guardioes-da-mata-debug.apk
    if ($LASTEXITCODE -ne 0) { throw 'Android export failed' }
    Get-FileHash build/guardioes-da-mata-debug.apk -Algorithm SHA256
} finally { Pop-Location }
