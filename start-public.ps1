# RidgeLink 公网访问守护脚本
# 作用：1) 确保静态服务在跑  2) 保持 cloudflared 隧道在线  3) 把公网地址写入 public-url.txt
# 用法：powershell -ExecutionPolicy Bypass -File .\start-public.ps1
# 说明：cloudflared 走 quick tunnel，不需要账号；电脑关机 / 进程退出后地址失效，重跑本脚本即可拿到新地址。

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$port = 8931
$cf = Join-Path $env:LOCALAPPDATA 'Temp\opencode\cf.exe'
$urlFile = Join-Path $root 'public-url.txt'

# 自动判断首页路径：仓库根就是本目录，还是本目录在 /ridge-link/ 下
$base = if (Test-Path (Join-Path $root 'index.html')) { '' } else { '/ridge-link' }

function Test-Local {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$port$base/index.html" -TimeoutSec 5 -UseBasicParsing
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Start-Server {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "[serve] starting static server on $port"
        Start-Process -FilePath 'node' -ArgumentList 'serve.js' -WorkingDirectory $root -WindowStyle Hidden
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Milliseconds 500
            if (Test-Local) { Write-Host "[serve] up"; return $true }
        }
        Write-Host "[serve] FAILED"
        return $false
    }
    Write-Host "[serve] Node.js 未安装：https://nodejs.org/  （或直接双击 index.html 也能看）"
    return $false
}

if (-not (Test-Local)) { Start-Server | Out-Null }

if (-not (Test-Path $cf)) {
    Write-Host "[tunnel] 正在下载 cloudflared ..."
    New-Item -ItemType Directory -Force (Split-Path $cf) | Out-Null
    Invoke-WebRequest "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cf
}

if (-not (Test-Path $cf)) {
    Write-Host "[tunnel] cloudflared 下载失败，请手动下载到：$cf"
    exit 1
}

$attempt = 0
while ($true) {
    $attempt++
    Write-Host "[tunnel] launch #$attempt"

    $log = Join-Path $env:LOCALAPPDATA "Temp\opencode\cf-tunnel-$attempt.log"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $cf
    # QUIC 在部分网络下会连到不可达的 region2，固定走 http2 更稳
    $psi.Arguments = "tunnel --url http://localhost:$port --no-autoupdate --protocol http2"
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardOutput = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $proc.Start() | Out-Null

    $printed = $false
    $deadline = (Get-Date).AddSeconds(90)
    while (-not $proc.HasExited -and (Get-Date) -lt $deadline) {
        $line = $proc.StandardError.ReadLine()
        if ($line) {
            Add-Content -Path $log -Value $line
            if (-not $printed -and $line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
                $u = $Matches[0]
                Set-Content -Path $urlFile -Value "$u$base/index.html" -Encoding UTF8
                Write-Host "[tunnel] PUBLIC URL: $u$base/index.html"
                Write-Host "[tunnel] (已写入 public-url.txt，手机浏览器直接打开即可)"
                $printed = $true
            }
        } else {
            Start-Sleep -Milliseconds 200
        }
    }

    if (-not $printed) { Write-Host "[tunnel] no url in time, retrying" }
    if (-not $proc.HasExited) { Write-Host "[tunnel] alive, entering keep-alive" }
    $proc.WaitForExit()

    Write-Host "[tunnel] exited (code $($proc.ExitCode)), restarting in 3s"
    Start-Sleep -Seconds 3
}
