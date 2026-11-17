#!/usr/bin/env python3
"""풍선 아이콘(icon.png, balloon.ico)을 그린다.  사용법: python3 balloon/make_icon.py"""
import pathlib

from PIL import Image, ImageDraw, ImageFilter

here = pathlib.Path(__file__).resolve().parent
S = 1024  # 크게 그린 뒤 줄여서 테두리를 부드럽게


def balloon(color, dark, light):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, rx, ry = S * 0.5, S * 0.40, S * 0.33, S * 0.37
    # 줄
    pts = [(cx + (18 if i % 2 else -18) * (i > 0), cy + ry + 40 + i * 52) for i in range(6)]
    d.line(pts, fill=(90, 80, 100, 255), width=16, joint="curve")
    # 매듭
    d.polygon([(cx, cy + ry - 20), (cx - 48, cy + ry + 52), (cx + 48, cy + ry + 52)], fill=dark)
    # 몸통 (어두운 테두리 → 밝은 안쪽 순서로 겹쳐 입체감)
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=dark)
    d.ellipse([cx - rx + 18, cy - ry + 10, cx + rx - 34, cy + ry - 40], fill=color)
    # 반짝
    shine = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(shine).ellipse([cx - rx * 0.62, cy - ry * 0.70, cx - rx * 0.22, cy - ry * 0.05], fill=light)
    shine = shine.rotate(-25, center=(cx, cy)).filter(ImageFilter.GaussianBlur(10))
    return Image.alpha_composite(img, shine)


img = balloon((255, 79, 109, 255), (196, 30, 70, 255), (255, 255, 255, 170))
img.resize((512, 512), Image.LANCZOS).save(here / "icon.png")
img.save(here / "balloon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("icon.png, balloon.ico")
