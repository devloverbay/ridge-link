# Copy the latest web pages into the APK assets folder.
# Usage (PowerShell in this folder):
#   powershell -ExecutionPolicy Bypass -File .\sync-web.ps1

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$web  = Join-Path (Split-Path $root -Parent) ''   # parent folder = ridge-link/
$dst  = Join-Path $root 'app\src\main\assets\www'

if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force $dst | Out-Null }

$files = @(
    'index.html', 'demo.html', 'scene.html', 'proposal.html', 'pitch.html',
    'offline-mode.js',
    'manifest.webmanifest', 'sw.js',
    'icon-192.png', 'icon-512.png', 'icon-180.png'
)
$count = 0

foreach ($f in $files) {
    $src = Join-Path $web $f
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host ("  OK  {0,-22} {1,9} bytes" -f $f, (Get-Item $src).Length)
        $count++
    } else {
        Write-Host ("  --  {0} not found, skipped" -f $f)
    }
}

Write-Host ""
Write-Host ("Done: {0} files -> {1}" -f $count, $dst)
Write-Host "Next: Commit + Push in GitHub Desktop; the cloud workflow will rebuild the APK."
