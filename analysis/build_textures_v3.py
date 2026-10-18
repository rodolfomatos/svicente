#!/usr/bin/env python3
"""Gera as texturas v3 a partir das digitalizações sem moldura (PD).

Cadeia de proveniência v3 (SPEC §8, N4) — substitui a v2 (bases GIMP,
manifesto histórico preservado em manifest-v2.json):
  1. Digitalização directa dos painéis, sem moldura, straight-on —
     Google Arts & Culture / MNAAT, via Wikimedia Commons, DOMÍNIO
     PÚBLICO (PD-Art, obra de Nuno Gonçalves, domínio público).
     Descarregadas por este script (cache local em assets/images/source-v3/,
     gitignorado — 46–77 MB cada).
  2. Derivação de textura web: redimensionamento para altura máxima
     2048 px (Lanczos) + JPEG qualidade 90. Sem correcção de
     perspectiva (a digitalização já é retificada), sem recorte manual.

Classificação: a digitalização é DOCUMENTADO (metadados do Commons);
o redimensionamento é procedimento determinístico deste script. Os
DELTAS de proporção entre a digitalização e as dimensões publicadas
(medidas do MNAAT/SPEC §3) são MEDIDO e registados por painel —
a textura estica/encolhe ligeiramente para caber no rectângulo
publicado, que é normativo.

Uso:  python3 analysis/build_textures_v3.py [--force]
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "assets/images/source-v3"
OUT_DIR = ROOT / "assets/images/panels"

MAX_HEIGHT_PX = 2048
JPEG_QUALITY = 90
USER_AGENT = "svicente-research/0.1 (reprodutibilidade de texturas)"

# Títulos Commons verificados via API (2026-10-18). `published_m` são as
# dimensões publicadas dos painéis (SPEC §3 / src/model/panels.js) —
# NORMATIVAS: a geometria do modelo não muda com a troca de textura.
PANELS_V3 = {
    "infante": {
        "commons": "Painéis de São Vicente de Fora - Painel do Infante (MNAA, inv. 1361 Pint).png",
        "published_m": {"width": 1.310, "height": 2.173},
    },
    "reliquia": {
        "commons": "Painéis de São Vicente de Fora - Painel da Relíquia (MNAA, inv. 1362 Pint).png",
        "published_m": {"width": 0.601, "height": 2.072},
    },
    "frades": {
        "commons": "Painéis de São Vicente de Fora - Painel dos Frades (MNAA, inv. 1363 Pint).png",
        "published_m": {"width": 0.642, "height": 2.072},
    },
    "arcebispo": {
        "commons": "Painéis de São Vicente de Fora - Painel do Arcebispo (MNAA, inv. 1364 Pint).png",
        "published_m": {"width": 1.336, "height": 2.177},
    },
    "cavaleiros": {
        "commons": "Painéis de São Vicente de Fora - Painel dos Cavaleiros (MNAA, inv. 1365 Pint).png",
        "published_m": {"width": 0.600, "height": 2.328},
    },
    "pescadores": {
        "commons": "Painéis de São Vicente de Fora - Painel dos Pescadores (MNAA, inv. 1366 Pint).png",
        "published_m": {"width": 0.600, "height": 2.076},
    },
}


def commons_api(params):
    params.update({"format": "json", "formatversion": "2"})
    url = f"https://commons.wikimedia.org/w/api.php?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def verify_license(title):
    """Confirma PD no Commons; falha em voz alta se a licença mudou."""
    data = commons_api({
        "action": "query", "titles": f"File:{title}", "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
    })
    ii = data["query"]["pages"][0]["imageinfo"][0]
    em = ii.get("extmetadata", {})
    lic = em.get("LicenseShortName", {}).get("value", "")
    if "public domain" not in lic.lower():
        raise SystemExit(f"LICENÇA INESPERADA para {title!r}: {lic!r} — "
                         "não continuar sem revisão do investigador")
    return ii


def download(url, dest):
    if dest.exists() and dest.stat().st_size > 1_000_000:
        return  # cache local
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=300) as resp, open(dest, "wb") as f:
        while chunk := resp.read(1 << 20):
            f.write(chunk)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true",
                    help="regenera texturas mesmo se já existirem")
    args = ap.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Preservar o manifesto v2 (cadeia GIMP) como histórico, se existir.
    v2 = OUT_DIR / "manifest.json"
    if v2.exists() and json.loads(v2.read_text()).get("schema") == "svicente-images-v2":
        (OUT_DIR / "manifest-v2.json").write_text(v2.read_text())

    manifest_panels = []
    for pid, spec in PANELS_V3.items():
        title = spec["commons"]
        print(f"[{pid}] a verificar licença + a obter URL…")
        ii = verify_license(title)
        cache = CACHE_DIR / f"{pid}.png"
        download(ii["url"].split("?")[0], cache)

        img = Image.open(cache)
        img_w, img_h = img.size
        pub = spec["published_m"]
        img_ratio = img_w / img_h
        pub_ratio = pub["width"] / pub["height"]
        delta_pct = round((img_ratio - pub_ratio) / pub_ratio * 100, 2)

        out = OUT_DIR / f"{pid}.jpg"
        if args.force or not out.exists():
            scale = MAX_HEIGHT_PX / img_h
            new_size = (round(img_w * scale), MAX_HEIGHT_PX) \
                if img_h > MAX_HEIGHT_PX else (img_w, img_h)
            img.convert("RGB").resize(new_size, Image.LANCZOS) \
                .save(out, "JPEG", quality=JPEG_QUALITY)
        derived = Image.open(out)

        manifest_panels.append({
            "id": pid,
            "file": f"assets/images/panels/{pid}.jpg",
            "cache_file": f"assets/images/source-v3/{pid}.png (gitignorado)",
            "commons_title": f"File:{title}",
            "commons_url": ii["descriptionurl"],
            "original_resolution_px": {"width": img_w, "height": img_h},
            "texture_resolution_px": {"width": derived.width, "height": derived.height},
            "published_m": pub,
            "aspect_delta_pct": delta_pct,
            "license": "Domínio público (PD-Art) — obra de Nuno Gonçalves",
            "credit": ("Digitalização: Google Arts & Culture / Museu Nacional "
                       "de Arte Antiga, via Wikimedia Commons (domínio público)"),
            "provenance": "MEDIDO (digitalização) + redimensionamento determinístico",
        })
        print(f"    {img_w}x{img_h} -> {derived.width}x{derived.height} "
              f"(delta proporção {delta_pct:+.2f}%)")

    manifest = {
        "schema": "svicente-images-v3",
        "supersedes": "svicente-images-v2 (bases GIMP — ver manifest-v2.json)",
        "provenance_chain": ("digitalização-directa-gaamnaat -> (sem correcção "
                             "manual) -> redimensionamento-2048px -> textura"),
        "source": {
            "collection": "Google Arts & Culture / MNAAT",
            "via": "Wikimedia Commons",
            "license_artwork": "Domínio público — Nuno Gonçalves, séc. XV "
                               "(dendrocronologia: c. 1445)",
            "retrieved": "2026-10-18",
            "attribution_required": ("Digitalização: Google Arts & Culture / "
                                     "Museu Nacional de Arte Antiga (domínio "
                                     "público), via Wikimedia Commons. Obra: "
                                     "Nuno Gonçalves, domínio público."),
        },
        "measurement_caveat": (
            "As dimensões publicadas (SPEC §3) são normativas para a "
            "geometria; a textura ajusta-se ao rectângulo publicado. Os "
            "deltas de proporção (digitalização vs publicado, até ~7% em "
            "três painéis) podemreflectir margens da digitalização ou "
            "diferenças nas medidas publicadas — MEDIDO e registado por "
            "painel; não é garantido que o rectângulo pintado preencha "
            "exactamente a textura."),
        "panels": manifest_panels,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"\nmanifest v3 escrito ({len(manifest_panels)} painéis); "
          f"histórico v2 em manifest-v2.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
