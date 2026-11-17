# 픽셀 마법사 연구소 - 바탕화면에 마법사 모자 아이콘 바로가기를 만듭니다.
# 다른 주소(예: 학교 서버에 올린 dist 폴더 주소)로 바꾸려면 아래 $url 만 고치면 돼요.
$url  = 'https://claude.ai/artifact/NXNWnaJnTDvqiK6hWAr2eB'
$name = '픽셀 마법사 연구소'

$ErrorActionPreference = 'Stop'
try {
    # 아이콘을 사용자 폴더에 복사 (이 압축 폴더를 지워도 아이콘이 남도록)
    $dir = Join-Path $env:LOCALAPPDATA 'PixelMagicLab'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $ico = Join-Path $dir 'pixel-magic-lab.ico'
    Copy-Item -Force (Join-Path $PSScriptRoot 'pixel-magic-lab.ico') $ico

    # 바탕화면 위치 (OneDrive 바탕화면도 자동으로 찾음)
    $desktop = [Environment]::GetFolderPath('Desktop')
    $file = Join-Path $desktop ($name + '.url')

    $content = "[InternetShortcut]`r`nURL=$url`r`nIconFile=$ico`r`nIconIndex=0`r`n"
    $enc = [Text.Encoding]::GetEncoding([Globalization.CultureInfo]::CurrentCulture.TextInfo.ANSICodePage)
    [IO.File]::WriteAllText($file, $content, $enc)

    Write-Host ''
    Write-Host '  바탕화면에 "픽셀 마법사 연구소" 아이콘을 만들었어요!' -ForegroundColor Green
    Write-Host "  위치: $file"
    Write-Host '  (아이콘이 바로 안 바뀌면 바탕화면에서 F5 를 눌러 새로고침해 주세요)'
} catch {
    Write-Host ''
    Write-Host '  바로가기를 만들지 못했어요.' -ForegroundColor Red
    Write-Host ('  이유: ' + $_.Exception.Message)
}
