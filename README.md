# kang — 🎒 학습 앱 모음

아이들 학습 앱을 **주제별 폴더**로 모아 두었어요. 맨 앞 주소는 전체 메뉴이고, 주제를 누르면 그 주제의 앱 목록이 나와요.

**▶ 전체 메뉴: https://gkes1211-hash.github.io/kang/**

| 주제 (목록 폴더) | 바로 가기 | 들어 있는 앱 |
| --- | --- | --- |
| 🏃 [체육시간](pe/) | https://gkes1211-hash.github.io/kang/pe/ | [무궁화 꽃이 피었습니다](pe/mugunghwa/) · [풍선 터트리기](pe/balloon/) · [벽 통과하기](pe/byeok/) · [체력왕 운동 카운터](pe/fitness/) · [제기차기](pe/jegi/) |
| 📚 [공부](study/) | https://gkes1211-hash.github.io/kang/study/ | [꼬마 탐험대 공원](study/kkoma-park/) · [우리 아이 공부 플래너](study/planner/) |
| 🔤 [영어](english/) | https://gkes1211-hash.github.io/kang/english/ | [여행 영어 첫걸음](english/travel/) |
| 🎵 [음악](music/) | https://gkes1211-hash.github.io/kang/music/ | [노래 연습장](music/sing/) |

## 주소 구조

```
kang/                  학습 앱 모음 (전체 메뉴)
├─ pe/                 체육시간 (목록 + 설치하는 체육시간 앱)
│  ├─ mugunghwa/ balloon/ byeok/ fitness/ jegi/
│  └─ common/          체육 게임들이 같이 쓰는 카메라·소리 도우미
├─ study/              공부 목록
│  ├─ kkoma-park/      꼬마 탐험대 공원 (따로 설치하는 앱)
│  └─ planner/         우리 아이 공부 플래너 (아이용: planner/kid/)
├─ english/            영어 목록
│  └─ travel/          여행 영어 첫걸음
└─ music/              음악 목록
   └─ sing/            노래 연습장
```

- 앱마다 **설치(홈 화면·바탕화면 아이콘)가 따로**예요. 체육시간 아이콘은 체육 게임만, 꼬마 탐험대 아이콘은 꼬마 탐험대만 열려요.
- 새 앱을 만들면 알맞은 주제 폴더 안에 넣고, 그 주제의 `index.html` 목록과 맨 앞 `index.html` 메뉴에 한 줄씩 더해요.

## 예전 주소

예전 주소(`/kang/escape/`, `/kang/mugunghwa/`, `/kang/sing/` 같은)로 들어와도 새 주소로 자동으로 옮겨 가요.
예전에 맨 앞 주소로 설치한 **체육시간** 아이콘은 열면 체육시간 목록(`pe/`)으로 바로 가요.
바탕화면 아이콘은 새 주소로 다시 만들어 두면 더 빨리 열려요 (각 앱의 💻 바탕화면 아이콘 받기).

| 파일 | 하는 일 |
| --- | --- |
| `index.html`, `hub.css`, `hub.js` | 전체 메뉴, 주제 목록 화면 모양 |
| `moved.js`, `escape/` `mugunghwa/` `balloon/` `byeok/` `fitness/` `jegi/` `planner/` `sing/` | 예전 주소 → 새 주소로 옮겨 주는 안내 (예전 오프라인 저장도 지워요) |
| `sw.js`, `english/sw.js` | 예전 주소에 남은 오프라인 저장 정리 |

> 바로가기 주소는 이 저장소의 **GitHub Pages**가 켜져 있어야 열려요.
> 저장소 **Settings → Pages → Build and deployment**에서 Source를 **Deploy from a branch**, Branch를 **`main`** / **`/ (root)`**로 두고 Save 하면, 1~2분 뒤 위 주소로 열려요.
