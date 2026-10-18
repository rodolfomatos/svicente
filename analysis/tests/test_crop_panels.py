"""Testes do gerador de texturas (analysis/crop_panels.py).

Contrato v2: imagens recortadas pelo investigador (1.jpg..6.jpg), ordem
confirmada, proveniência MEDIDO com cadeia documentada (SPEC §8, N4).
"""

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "analysis"))

import crop_panels  # noqa: E402


def test_six_panels_in_confirmed_order():
    """Ordem esquerda→direita confirmada pelo investigador (2026-10-18)."""
    ids = [p[0] for p in crop_panels.PANELS]
    assert ids == ["frades", "pescadores", "infante", "arcebispo", "cavaleiros", "reliquia"]


def test_panel_sources_are_numbered_1_to_6():
    sources = [p[4] for p in crop_panels.PANELS]
    assert sources == ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"]


def test_photo_metadata_has_attribution_and_licenses():
    meta = crop_panels.PHOTO_META
    assert "CC BY-SA" in meta["license_photo"]
    assert "domínio público" in meta["license_artwork"].lower()
    assert meta["author"]
    assert meta["url"].startswith("https://commons.wikimedia.org/")


def test_investigator_edit_is_documented():
    """A transformação do utilizador (GIMP) está documentada — SPEC §8."""
    edit = crop_panels.INVESTIGATOR_EDIT
    assert edit["tool"] == "GIMP"
    assert edit["date"]
    assert any("perspectiva" in op for op in edit["operations"])


def test_measurement_caveat_mentions_perspective():
    assert "perspectiva" in crop_panels.MEASUREMENT_CAVEAT
    assert "fotografia de origem" in crop_panels.MEASUREMENT_CAVEAT


def test_generated_manifest_matches_contract(tmp_path, monkeypatch):
    """Geração real: manifesto coerente, seis texturas, cadeia completa."""
    src_dir = ROOT / "assets/images/source"
    if not (src_dir / "1.jpg").exists():
        pytest.skip("imagens do investigador não presentes")
    monkeypatch.setattr(crop_panels, "OUT_DIR", tmp_path)
    monkeypatch.setattr(sys, "argv", ["crop_panels.py", "--source-dir", str(src_dir)])
    crop_panels.main()

    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == "svicente-images-v2"
    assert manifest["crop_provenance"] == "MEDIDO"
    assert manifest["provenance_chain"].count("->") == 2
    assert manifest["source_photo"]["license_photo"].startswith("CC BY-SA")
    assert manifest["investigator_edit"]["tool"] == "GIMP"
    assert len(manifest["panels"]) == 6

    for p in manifest["panels"]:
        out = tmp_path / f"{p['id']}.jpg"
        assert out.exists()
        # A textura gerada tem as mesmas dimensões da fonte do investigador.
        from PIL import Image

        assert Image.open(out).size == (
            p["resolution_px"]["width"],
            p["resolution_px"]["height"],
        )
        assert p["source_file"].endswith(".jpg")
        assert p["provenance"] == "MEDIDO"
        # Aspecto da imagem respeita o publicado dentro de 10%
        # (correcção de perspectiva manual não garante igualdade exacta).
        assert p["aspect_delta_pct"] < 10.0
