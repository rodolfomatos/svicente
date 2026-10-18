#!/usr/bin/env python3
"""Gera as texturas dos painéis a partir das imagens recortadas pelo investigador.

Cadeia de proveniência (SPEC §8, N4):
  1. Fotografia original: Daniel Villafruela, 2014-09-17, Wikimedia Commons,
     CC BY-SA 3.0 (assets/images/source/poliptico-villafruela-2014.jpg).
  2. Recorte por painel + correcção de perspectiva + remoção de molduras:
     transformação manual do INVESTIGADOR (GIMP), 2026-10-18, a partir da
     fotografia acima. Ficheiros: assets/images/source/1.jpg .. 6.jpg.
     Ordem confirmada pelo investigador (2026-10-18): esquerda → direita.
  3. Geração de textura: este script, reprodutível — mesma entrada → mesma saída.

Classificação: MEDIDO — os recortes são medições directas do investigador
sobre a fotografia, com transformação de perspectiva aplicada. Continuam
sujeitas às limitações da fotografia de origem (lente 19 mm, resolução;
SPEC §8).

Uso:  python3 analysis/crop_panels.py [--source-dir PATH]
"""

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets/images/source"
OUT_DIR = ROOT / "assets/images/panels"

# Ordem esquerda → direita, confirmada pelo investigador (2026-10-18).
# Dimensões publicadas (m) — SPEC §3.
PANELS = [
    ("frades", "Painel dos Frades", 2.072, 0.642, "1.jpg"),
    ("pescadores", "Painel dos Pescadores", 2.070, 0.600, "2.jpg"),
    ("infante", "Painel do Infante", 2.064, 1.280, "3.jpg"),
    ("arcebispo", "Painel do Arcebispo", 2.060, 1.283, "4.jpg"),
    ("cavaleiros", "Painel dos Cavaleiros", 2.066, 0.604, "5.jpg"),
    ("reliquia", "Painel da Relíquia", 2.065, 0.631, "6.jpg"),
]

PHOTO_META = {
    "url": (
        "https://commons.wikimedia.org/wiki/"
        "File:Lisboa-Museu_Nacional_de_Arte_Antiga-Pol%C3%ADptico_de_S%C3%A3o_Vicente-20140917.jpg"
    ),
    "author": "Daniel Villafruela",
    "date": "2014-09-17",
    "camera": "Canon EOS 70D, 19 mm, f/2.8, ISO 3200",
    "license_photo": "CC BY-SA 3.0",
    "license_photo_url": "https://creativecommons.org/licenses/by-sa/3.0/",
    "license_artwork": "Domínio público (PD-Art) — Nuno Gonçalves, c. 1470–1480",
    "attribution_required": (
        "Fotografia: Daniel Villafruela, CC BY-SA 3.0, via Wikimedia Commons; "
        "recorte e correcção de perspectiva: investigador. Obra: Nuno Gonçalves, "
        "c. 1470–1480, domínio público, Museu Nacional de Arte Antiga, Lisboa."
    ),
}

INVESTIGATOR_EDIT = {
    "author": "investigator",
    "date": "2026-10-18",
    "tool": "GIMP",
    "operations": [
        "recorte por painel a partir da fotografia completa",
        "correcção de perspectiva (transformação de plano) até retificação rectangular",
        "remoção das molduras",
    ],
}

MEASUREMENT_CAVEAT = (
    "Medições feitas sobre estas imagens estão sujeitas às limitações da "
    "fotografia de origem: distorção de perspectiva residual da lente de "
    "19 mm, resolução limitada e correcção de perspectiva aproximada "
    "(SPEC §8). A correcção de perspectiva do investigador é documentada, "
    "mas a exactidão métrica do retângulo resultante não é garantida."
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=SOURCE_DIR)
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": "svicente-images-v2",
        "provenance_chain": "foto-villafruela -> recorte+perspectiva-investigador -> textura",
        "source_photo": PHOTO_META,
        "investigator_edit": INVESTIGATOR_EDIT,
        "measurement_caveat": MEASUREMENT_CAVEAT,
        "crop_provenance": "MEDIDO",
        "panels": [],
    }

    for pid, name, h_m, w_m, src_name in PANELS:
        src_path = args.source_dir / src_name
        if not src_path.exists():
            raise SystemExit(f"imagem de origem em falta: {src_path}")
        img = Image.open(src_path)
        if img.mode != "RGB":
            img = img.convert("RGB")
        out = OUT_DIR / f"{pid}.jpg"
        img.save(out, "JPEG", quality=92)
        aspect = img.width / img.height
        pub_aspect = w_m / h_m
        manifest["panels"].append(
            {
                "id": pid,
                "name": name,
                "file": f"assets/images/panels/{pid}.jpg",
                "source_file": f"assets/images/source/{src_name}",
                "resolution_px": {"width": img.width, "height": img.height},
                "published_m": {"height": h_m, "width": w_m},
                "aspect_delta_pct": round(abs(aspect - pub_aspect) / pub_aspect * 100, 1),
                "provenance": "MEDIDO",
                "source": PHOTO_META["url"],
                "license": PHOTO_META["license_photo"],
            }
        )
        print(
            f"{pid:12s} <- {src_name}  {img.width}x{img.height}  "
            f"aspect={aspect:.3f} (pub={pub_aspect:.3f}, Δ{manifest['panels'][-1]['aspect_delta_pct']}%)"
        )

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"manifesto: {OUT_DIR / 'manifest.json'}")


if __name__ == "__main__":
    main()
