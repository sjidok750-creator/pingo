#!/usr/bin/env python3
"""Generate PWA icon set (192/512) and a maskable variant from assets/icon.png."""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "icon.png"
OUT = ROOT / "assets" / "pwa"
OUT.mkdir(parents=True, exist_ok=True)

src = Image.open(SRC).convert("RGBA")

# Standard PWA icons
for size in (192, 512):
    out = src.resize((size, size), Image.LANCZOS)
    out.save(OUT / f"icon-{size}.png", optimize=True)

# Maskable variant: pad so the artwork sits inside the ~80% safe zone Android
# adaptive launchers use, then drop a solid bg matching the artwork.
BG = (27, 25, 22, 255)  # #1B1916
for size in (192, 512):
    padded = Image.new("RGBA", (size, size), BG)
    inner = src.resize((int(size * 0.78), int(size * 0.78)), Image.LANCZOS)
    off = ((size - inner.width) // 2, (size - inner.height) // 2)
    padded.alpha_composite(inner, off)
    padded.save(OUT / f"icon-maskable-{size}.png", optimize=True)

# Apple touch icon (180×180) — non-transparent, no rounded corners (iOS adds them)
touch = src.resize((180, 180), Image.LANCZOS)
flat = Image.new("RGB", (180, 180), (27, 25, 22))
flat.paste(touch, mask=touch.split()[-1])
flat.save(OUT / "apple-touch-icon.png", optimize=True)

print("generated:", *(p.name for p in sorted(OUT.iterdir())))
