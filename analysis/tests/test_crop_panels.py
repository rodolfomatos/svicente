"""Testes do recorte de painéis (analysis/crop_panels.py)."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "analysis"))

import crop_panels  # noqa: E402


def test_fractions_partition_the_width():
    """As frações de recorte particionam [0,1] sem sobreposições."""
    bounds = crop_panels.crop_fractions()
    assert bounds[0] == 0
    assert bounds[-1] == 1
    assert all(a < b for a, b in zip(bounds, bounds[1:]))


def test_six_panels_in_published_order():
    ids = [p[0] for p in crop_panels.PANELS]
    assert ids == ["frades", "pescadores", "infante", "arcebispo", "cavaleiros", "reliquia"]


def test_source_metadata_has_attribution_and_licenses():
    meta = crop_panels.SOURCE_META
    assert "CC BY-SA" in meta["license_photo"]
    assert "domínio público" in meta["license_artwork"].lower()
    assert meta["author"]
    assert meta["url"].startswith("https://commons.wikimedia.org/")


def test_crop_is_estimated_with_perspective_note():
    """Os limites de recorte são ESTIMADOS com nota de perspectiva (SPEC §8)."""
    assert "ESTIMADO" in crop_panels.PROVENANCE_NOTE
    assert "perspectiva" in crop_panels.PROVENANCE_NOTE
    assert "perspectiva" in crop_panels.MEASUREMENT_CAVEAT


def test_generated_manifest_matches_contract(tmp_path, monkeypatch):
    """Geração real: manifesto coerente com os seis painéis e caminhos."""
    src = ROOT / "assets/images/source/poliptico-villafruela-2014.jpg"
    if not src.exists():
        import pytest

        pytest.skip("imagem de origem não descarregada")
    monkeypatch.setattr(crop_panels, "OUT_DIR", tmp_path)
    monkeypatch.setattr(sys, "argv", ["crop_panels.py", "--source", str(src)])
    crop_panels.main()

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["crop_provenance"] == "ESTIMADO"
    assert len(manifest["panels"]) == 6
    assert manifest["source"]["license_photo"].startswith("CC BY-SA")

    prev_x1 = 0
    for p in manifest["panels"]:
        assert (tmp_path / f"{p['id']}.jpg").exists()
        assert p["crop_px"]["x0"] == prev_x1  # contíguos, sem saltos
        prev_x1 = p["crop_px"]["x1"]
        assert p["resolution_px"]["width"] == p["crop_px"]["x1"] - p["crop_px"]["x0"]
        assert p["published_m"]["width"] > 0
    assert prev_x1 == manifest["source_image"]["width_px"]  # cobrem a imagem toda
