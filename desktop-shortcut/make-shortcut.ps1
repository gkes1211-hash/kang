# 체육시간 - 바탕화면에 체육시간 앱 아이콘을 만듭니다.
# 아이콘을 누르면 크롬(없으면 엣지)이 주소창 없는 앱 창으로 체육시간을 열어요.
# 다른 주소로 바꾸려면 아래 $url 만 고치면 돼요.
$url  = 'https://gkes1211-hash.github.io/kang/'
$name = '체육시간'

$ErrorActionPreference = 'Stop'
try {
    # 아이콘을 사용자 폴더에 복사 (내려받은 폴더를 지워도 아이콘이 남도록)
    $dir = Join-Path $env:LOCALAPPDATA 'Cheyuk'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $ico = Join-Path $dir 'cheyuk.ico'
    Copy-Item -Force (Join-Path $PSScriptRoot 'cheyuk.ico') $ico

    # 바탕화면 위치 (OneDrive 바탕화면도 자동으로 찾음)
    $desktop = [Environment]::GetFolderPath('Desktop')

    # 크롬 → 엣지 순서로 찾기 (없는 폴더는 건너뜀)
    $roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA) | Where-Object { $_ }
    $apps = @('Google\Chrome\Application\chrome.exe', 'Microsoft\Edge\Application\msedge.exe')
    $browser = $null
    foreach ($app in $apps) {
        foreach ($root in $roots) {
            $path = Join-Path $root $app
            if (-not $browser -and (Test-Path -LiteralPath $path)) { $browser = $path }
        }
    }

    if ($browser) {
        # 앱 창으로 여는 바로가기 (.lnk)
        $file = Join-Path $desktop ($name + '.lnk')
        $lnk = (New-Object -ComObject WScript.Shell).CreateShortcut($file)
        $lnk.TargetPath = $browser
        $lnk.Arguments = "--app=$url"
        $lnk.WorkingDirectory = Split-Path -Parent $browser
        $lnk.IconLocation = "$ico,0"
        $lnk.Description = '체육시간: 카메라 앞에서 몸으로 하는 게임'
        $lnk.Save()
    } else {
        # 크롬·엣지가 없으면 기본 브라우저로 여는 인터넷 바로가기 (.url)
        $file = Join-Path $desktop ($name + '.url')
        $content = "[InternetShortcut]`r`nURL=$url`r`nIconFile=$ico`r`nIconIndex=0`r`n"
        $enc = [Text.Encoding]::GetEncoding([Globalization.CultureInfo]::CurrentCulture.TextInfo.ANSICodePage)
        [IO.File]::WriteAllText($file, $content, $enc)
    }

    Write-Host ''
    Write-Host '  바탕화면에 "체육시간" 아이콘을 만들었어요!' -ForegroundColor Green
    Write-Host "  위치: $file"
    Write-Host '  (아이콘 그림이 바로 안 바뀌면 바탕화면에서 F5 를 눌러 새로고침해 주세요)'
} catch {
    Write-Host ''
    Write-Host '  바로가기를 만들지 못했어요.' -ForegroundColor Red
    Write-Host ('  이유: ' + $_.Exception.Message)
}
