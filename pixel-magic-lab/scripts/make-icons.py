"""마법사 모자 픽셀 아이콘 만들기 (32×32 픽셀 그림 → 여러 크기 PNG, ICO)"""
from PIL import Image, ImageDraw
import os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/icons'
os.makedirs(OUT, exist_ok=True)

C = {
    'B': (251, 246, 236),   # 크림 배경
    'O': (91, 66, 55),      # 외곽선 (짙은 브라운)
    'P': (169, 139, 220),   # 라벤더 모자
    'D': (122, 95, 191),    # 모자 그림자
    'L': (210, 196, 245),   # 모자 하이라이트
    'Y': (246, 213, 92),    # 노란 띠·별
    'y': (214, 170, 60),    # 띠 그림자
    'K': (243, 156, 195),   # 분홍 반짝이
    'M': (111, 211, 193),   # 민트 반짝이
    'W': (255, 255, 255),
}

ART = [
    "................................",
    "................................",
    "..................OOO...........",
    ".................OPPO......K....",
    "................OPPDO.....KWK...",
    "...M...........OPPDO.......K....",
    "..MWM.........OPPPDO............",
    "...M.........OLPPPDO............",
    ".............OLPPPDDO...........",
    "............OLPPPPPDO...........",
    "............OLPPPYPDO...........",
    "...........OLPPPYYYPDO..........",
    "...........OLPPYYYYYDO.....M....",
    "..........OLPPPPYYYPPDO...MWM...",
    "..........OLPPPYPPPYPDO....M....",
    ".........OLPPPPPPPPPPPDO........",
    ".........OLPPPPPPPPPPPDO........",
    "........OLPPPPPPPPPPPPPDO.......",
    "........OYYYYYYYYYYYYYYYO.......",
    "........OYYYYYYYYYYYYYYYO.......",
    "........OyyyyyyyyyyyyyyyO.......",
    "....OOOOOPPPPPPPPPPPPPPPOOOOO...",
    "...OLLPPPPPPPPPPPPPPPPPPPPPPDO..",
    "...OPPPPPPPPPPPPPPPPPPPPPPPPDO..",
    "....ODDDDDDDDDDDDDDDDDDDDDDDO...",
    ".....OOOOOOOOOOOOOOOOOOOOOOO....",
    "................................",
    "................................",
]
H = len(ART); Wd = 32
ART = [r.ljust(Wd, '.') for r in ART]
# 세로 가운데 맞춤
pad = (32 - H) // 2
ART = ['.' * 32] * pad + ART + ['.' * 32] * (32 - H - pad)

def pixel_layer(scale):
    im = Image.new('RGBA', (32 * scale, 32 * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y, row in enumerate(ART):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=C[ch] + (255,))
    return im

def icon(size, maskable=False, round_bg=True):
    big = 1024
    base = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    if maskable:
        d.rectangle([0, 0, big, big], fill=C['B'] + (255,))
        inner = int(big * 0.70)
    else:
        r = int(big * 0.22)
        d.rounded_rectangle([0, 0, big - 1, big - 1], r, fill=C['B'] + (255,), outline=(220, 196, 166, 255), width=int(big * 0.025))
        inner = int(big * 0.92)
    art = pixel_layer(inner // 32)
    off = ((big - art.width) // 2, (big - art.height) // 2)
    base.alpha_composite(art, off)
    return base.resize((size, size), Image.LANCZOS if size < 256 else Image.NEAREST)

for s in (192, 512):
    icon(s).save(f'{OUT}/icon-{s}.png')
icon(512, maskable=True).save(f'{OUT}/icon-maskable-512.png')
icon(180, maskable=True).save(f'{OUT}/apple-touch-icon.png')
ico = icon(256)
ico.save(f'{OUT}/pixel-magic-lab.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print('ok', OUT)
