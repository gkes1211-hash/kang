#!/usr/bin/env python3
"""풍선 터트리기를 HTML 파일 하나로 묶는다 (서버 없이 더블클릭으로 실행).

손 인식 엔진(js, wasm)과 손 모델을 base64 글자로 HTML 안에 넣는다.
사용법 (저장소 폴더에서):  python3 balloon/build_single.py [출력파일]
"""
import base64
import zipfile
import pathlib
import re
import sys

here = pathlib.Path(__file__).resolve().parent
vendor = here.parent / "mugunghwa" / "vendor"
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent / "dist" / "풍선터트리기.html"


def b64(path):
    return base64.b64encode(path.read_bytes()).decode("ascii")


html = (here / "index.html").read_text(encoding="utf-8")
css = (here / "style.css").read_text(encoding="utf-8")
js = (here / "game.js").read_text(encoding="utf-8")

# 파일로 열 때는 'self' 가 없으니 보안 규칙(CSP)은 뺀다. 이 파일은 바깥 주소를 하나도 부르지 않는다.
html = re.sub(r'\s*<!--[^>]*?-->\s*<meta http-equiv="Content-Security-Policy"[^>]*>', "", html, flags=re.S)
html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>\n{css}</style>")
html = html.replace('<script type="module" src="game.js"></script>', "")
# 파일로 열 때는 홈 화면 추가(manifest)가 안 되니 뺀다
html = re.sub(r'\s*<link rel="(apple-touch-icon|manifest)"[^>]*>', "", html)
html = html.replace('href="icon.png"', f'href="data:image/png;base64,{b64(here / "icon.png")}"')

data = "\n".join(
    f'<script type="application/octet-stream" id="{id_}">{b64(p)}</script>'
    for id_, p in [
        ("inline-bundle", vendor / "vision_bundle.mjs"),
        ("inline-loader", vendor / "wasm" / "vision_wasm_internal.js"),
        ("inline-wasm", vendor / "wasm" / "vision_wasm_internal.wasm"),
        ("inline-model", here / "vendor" / "hand_landmarker.task"),
    ]
)
# 켜질 때 GitHub 에서 최신 화면(index.html)·모양(style.css)·게임 코드(game.js)를 받아 쓴다.
# 인터넷이 없거나 못 받으면 이 파일 안에 든 판으로 그냥 한다. (엔진과 손 모델은 늘 이 파일 안의 것을 쓴다)
UPDATE_BASE = "https://raw.githubusercontent.com/gkes1211-hash/kang/claude/elegant-allen-9dx5iv/balloon/"
loader = f"""<script type="module">
const BASE = {UPDATE_BASE!r};
async function latest() {{
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {{
    const get = async (n) => {{
      const r = await fetch(BASE + n + '?t=' + Date.now(), {{ cache: 'no-store', signal: ctl.signal }});
      if (!r.ok) throw new Error(n);
      return r.text();
    }};
    const [page, css, js] = await Promise.all([get('index.html'), get('style.css'), get('game.js')]);
    const app = new DOMParser().parseFromString(page, 'text/html').getElementById('app');
    if (!app || !js.includes('inline-bundle')) throw new Error('bad');
    return {{ app: app.innerHTML, css, js }};
  }} catch {{ return null; }} finally {{ clearTimeout(timer); }}
}}
const startBtn = document.getElementById('start');
const statusEl = document.getElementById('status');
startBtn.disabled = true;
statusEl.textContent = '🔄 새 버전 확인 중…';
const fresh = await latest();
startBtn.disabled = false;
statusEl.textContent = '';
if (fresh) {{
  document.getElementById('app').innerHTML = fresh.app;
  document.getElementById('app-style').textContent = fresh.css;
}}
const code = fresh ? fresh.js : document.getElementById('embedded-js').textContent;
await import(URL.createObjectURL(new Blob([code], {{ type: 'text/javascript' }})));
</script>"""
embedded = js.replace("</script", "<\\/script")
html = html.replace("<style>\n", '<style id="app-style">\n', 1)
html = html.replace("</body>", f'{data}\n<script type="text/plain" id="embedded-js">{embedded}</script>\n{loader}\n</body>')

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"{out}  ({out.stat().st_size / 1e6:.1f} MB)")

# 바로가기(풍선 아이콘) 만드는 파일까지 한 zip 으로
zip_path = out.with_suffix(".zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(out, out.name)
    z.write(here / "balloon.ico", "balloon.ico")
    z.write(here / "install-shortcut.bat", "바로가기만들기.bat")
print(f"{zip_path}  ({zip_path.stat().st_size / 1e6:.1f} MB)")
