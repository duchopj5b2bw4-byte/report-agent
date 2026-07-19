$ErrorActionPreference = "Stop"

# 1. Install flyctl
$tmp = "$env:TEMP\flyctl"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
Invoke-WebRequest -Uri "https://github.com/superfly/flyctl/releases/latest/download/flyctl_windows_x86_64.zip" -OutFile "$tmp\flyctl.zip"
Expand-Archive -Path "$tmp\flyctl.zip" -DestinationPath "$tmp" -Force
$env:Path += ";$tmp"

# 2. Login (opens browser - sign in with GitHub)
Write-Host "Opening browser for Fly.io login..."
flyctl auth login

# 3. Deploy
Set-Location $PSScriptRoot\..
if (-not $env:DASHSCOPE_API_KEY) {
    throw "Set DASHSCOPE_API_KEY in your shell before running this script."
}
flyctl secrets set DASHSCOPE_API_KEY="$env:DASHSCOPE_API_KEY"
flyctl launch --auto-confirm --now

Write-Host "Deployed! Check https://report-agent.fly.dev"
