# 🏃 체육시간

카메라 앞에서 몸으로 하는 아이들 게임 모음이에요. 체육시간 첫 화면(`pe/index.html`)에서 게임을 골라요.

**▶ 체육시간 바로 가기: https://gkes1211-hash.github.io/kang/pe/**

| 게임 | 바로가기 | 설명 |
| --- | --- | --- |
| [무궁화 꽃이 피었습니다](mugunghwa/) | [▶ 하러 가기](https://gkes1211-hash.github.io/kang/pe/mugunghwa/) | 카메라가 술래가 되는 아이들 몸놀이 게임 |
| [풍선 터트리기](balloon/) | [▶ 하러 가기](https://gkes1211-hash.github.io/kang/pe/balloon/) | 카메라로 손을 인식해 풍선을 터트리고 폭탄은 피하는 게임 |
| [벽 통과하기](byeok/) | [▶ 하러 가기](https://gkes1211-hash.github.io/kang/pe/byeok/) | 다가오는 벽의 구멍 모양대로 몸을 맞춰 통과하는 몸놀이 게임 |
| [체력왕 운동 카운터](fitness/) | [▶ 하러 가기](https://gkes1211-hash.github.io/kang/pe/fitness/) | 스쿼트·팔 벌려 뛰기·무릎 들기 횟수를 카메라가 세어 주는 운동 게임 |
| [제기차기](jegi/) | [▶ 하러 가기](https://gkes1211-hash.github.io/kang/pe/jegi/) | 화면 속 제기를 발과 무릎으로 차올리는 전통 놀이 게임 |

## 체육시간 앱으로 설치하기

첫 화면을 홈 화면에 설치하면 **체육시간** 앱 하나로 모든 게임을 할 수 있어요.
앱 안에서 게임을 누르면 같은 창에서 열리고, 게임 첫 화면 왼쪽 위 **"← 🏃 체육시간"**을 누르면 게임 고르기로 돌아와요.

- **안드로이드·크롬·엣지**: 첫 화면의 **📲 홈 화면에 설치하기** 버튼, 또는 주소창 메뉴 → "앱 설치"
- **아이패드·아이폰 사파리**: 공유 버튼 → **홈 화면에 추가**
- 한 번 연 게임은 기기에 담아 두어서, 다음부터는 인터넷이 없어도 열려요.

## 윈도우 바탕화면 아이콘 만들기 💻

1. 윈도우 컴퓨터에서 체육시간 첫 화면 아래의 **💻 윈도우 바탕화면 아이콘 받기**를 눌러 압축 파일을 받아요.
   (또는 저장소의 [`pe/desktop-shortcut/cheyuk-desktop-shortcut.zip`](desktop-shortcut/cheyuk-desktop-shortcut.zip) → Download)
2. 압축을 풀고 **`make-shortcut.bat`**을 두 번 눌러요. ("Windows의 PC 보호" 창이 나오면 "추가 정보" → "실행")
3. 바탕화면에 **체육시간** 아이콘이 생겨요. 누르면 크롬(없으면 엣지)이 주소창 없는 앱 창으로 체육시간을 열어요.

크롬·엣지의 **📲 홈 화면에 설치하기**(앱 설치)로 설치해도 보통 바탕화면과 시작 메뉴에 아이콘이 생겨요.

> 바로가기 주소는 이 저장소의 **GitHub Pages**가 켜져 있어야 열려요.
> 저장소 **Settings → Pages → Build and deployment**에서 Source를 **Deploy from a branch**, Branch를 **`main`** / **`/ (root)`**로 두고 Save 하면, 1~2분 뒤 위 주소로 열려요.

## 파일 (`pe/` 안)

| 파일 | 하는 일 |
| --- | --- |
| `index.html` | 체육시간 첫 화면 (게임 고르기) |
| `home.js` | 오프라인 준비, 설치 버튼·설치 안내 |
| `manifest.webmanifest`, `sw.js`, `icons/` | 체육시간 앱 설치·오프라인 |
| `desktop-shortcut/` | 윈도우 바탕화면 아이콘 만들기 |
| `mugunghwa/`, `balloon/`, `byeok/`, `fitness/`, `jegi/` | 게임 (각 폴더 README 참고) |
| `common/` | 게임들이 같이 쓰는 카메라·몸 인식·소리·꾸밈 도우미 (꼬마 탐험대 공원의 몸 움직이기 문제도 써요) |
