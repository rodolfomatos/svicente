#!/usr/bin/env python3
"""Recorta os seis painéis a partir da fotografia do políptico completo.

Reprodutível: mesma imagem de entrada -> mesmos recortes. O manifesto
gerado (manifest.json) é a fonte de verdade dos metadados de imagem
(SPEC docs/SPEC.md §8, requisito N4).

CLASSIFICAÇÃO DOS LIMITES DE RECORTE: ESTIMADO.
Os limites são proporcionais às larguras publicadas (SPEC §3) sob a
hipótese de escala uniforme. A fotografia (lente 19 mm, distorção de
perspectiva, molduras e vãos entre painéis) NÃO garante escala uniforme —
análise de zonas escuras da imagem foi inconsistente com qualquer modelo
linear. Os recortes são portanto aproximações de trabalho, não medições.

Uso:  python3 analysis/crop_panels.py [--source PATH]
"""

import argparse
import json
from fractions import Fraction
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/images/source/poliptico-villafruela-2014.jpg"
OUT_DIR = ROOT / "assets/images/panels"

# Dimensões publicadas (m) — SPEC §3; ordem na fotografia (esq. → dir.).
PANELS = [
    ("frades", "Painel dos Frades", 2.072, 0.642),
    ("pescadores", "Painel dos Pescadores", 2.070, 0.600),
    ("infante", "Painel do Infante", 2.064, 1.280),
    ("arcebispo", "Painel do Arcebispo", 2.060, 1.283),
    ("cavaleiros", "Painel dos Cavaleiros", 2.066, 0.604),
    ("reliquia", "Painel da Relíquia", 2.065, 0.631),
]

# Metadados da fonte (Wikimedia Commons, verificado 2026-10-18).
SOURCE_META = {
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
        "Fotografia: Daniel Villafruela, CC BY-SA 3.0, via Wikimedia Commons. "
        "Obra: Nuno Gonçalves, c. 1470–1480, domínio público, "
        "Museu Nacional de Arte Antiga, Lisboa."
    ),
}

PROVENANCE_NOTE = (
    "Limites de recorte ESTIMADOS: proporcionais às larguras publicadas "
    "(SPEC §3) sob hipótese de escala uniforme. A fotografia tem distorção "
    "de perspectiva (lente 19 mm) e vãos/molduras entre painéis; os "
    "recortes podem incluir moldura ou cortar conteúdo e devem ser "
    "verificados visualmente pelo investigador. Medições sobre esta imagem "
    "herdam as limitações da perspectiva fotográfica (SPEC §8)."
)

MEASUREMENT_CAVEAT = (
    "Medições feitas sobre esta fotografia estão sujeitas à distorção de "
    "perspectiva, distorção ótica da lente e resolução limitada (SPEC §8)."
)


def crop_fractions() -> list[Fraction]:
    """Fronteiras acumuladas como frações exactas da largura total."""
    total = sum(Fraction(round(w * 1000)) for _, _, _, w in PANELS)
    acc = Fraction(0)
    bounds = [Fraction(0)]
    for _, _, _, w in PANELS:
        acc += Fraction(round(w * 1000))
        bounds.append(acc / total)
    return bounds


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=SOURCE)
    args = parser.parse_args()

    if not args.source.exists():
        raise SystemExit(f"imagem de origem em falta: {args.source}")

    img = Image.open(args.source)
    width, height = img.size
    bounds = crop_fractions()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": "svicente-images-v1",
        "source": SOURCE_META,
        "measurement_caveat": MEASUREMENT_CAVEAT,
        "crop_provenance": "ESTIMADO",
        "crop_note": PROVENANCE_NOTE,
        "source_image": {
            "path": str(args.source.relative_to(ROOT)),
            "width_px": width,
            "height_px": height,
        },
        "panels": [],
    }

    for i, (pid, name, h_m, w_m) in enumerate(PANELS):
        x0 = round(float(bounds[i]) * width)
        x1 = round(float(bounds[i + 1]) * width)
        crop = img.crop((x0, 0, x1, height))
        out = OUT_DIR / f"{pid}.jpg"
        crop.save(out, "JPEG", quality=92)
        manifest["panels"].append(
            {
                "id": pid,
                "name": name,
                "file": f"assets/images/panels/{pid}.jpg",
                "crop_px": {"x0": x0, "x1": x1, "y0": 0, "y1": height},
                "crop_fraction": [str(bounds[i]), str(bounds[i + 1])],
                "resolution_px": {"width": crop.width, "height": crop.height},
                "published_m": {"height": h_m, "width": w_m},
                "provenance": "ESTIMADO",
                "source": SOURCE_META["url"],
                "license": SOURCE_META["license_photo"],
            }
        )
        print(f"{pid:12s} x[{x0:5d},{x1:5d}) {crop.width}x{crop.height}")

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"manifesto: {OUT_DIR / 'manifest.json'}")


if __name__ == "__main__":
    main()
