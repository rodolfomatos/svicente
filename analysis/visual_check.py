#!/usr/bin/env python3
"""Cheque visual da aplicação com Playwright (WebGL via Chromium headless).

O WebGL não corre em CI, mas corre localmente com/software rendering. Este
script arranca o http-server, carrega a aplicação, verifica que a cena
renderiza de facto (canvas com pixels não-pretos), que não há erros de
consola e que as texturas dos painéis carregam (respostas HTTP 200).
Produz screenshots em tmp/ para inspecção humana.

Uso:  python3 analysis/visual_check.py [--headed]
"""

import argparse
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8137
BASE = f"http://127.0.0.1:{PORT}"
OUT = ROOT / "tmp"


def wait_server(timeout_s=20):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            urllib.request.urlopen(f"{BASE}/index.html", timeout=1)
            return
        except OSError:
            time.sleep(0.3)
    raise SystemExit("servidor não arrancou")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--headed", action="store_true", help="abrir janela visível")
    args = parser.parse_args()

    OUT.mkdir(exist_ok=True)
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    failures = []
    try:
        wait_server()
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=not args.headed,
                args=["--enable-unsafe-swiftshader", "--use-gl=angle",
                      "--use-angle=swiftshader"],
            )
            page = browser.new_page(viewport={"width": 1600, "height": 900})
            console_errors = []
            failed_requests = []
            page.on("console", lambda m: console_errors.append(m.text)
                    if m.type == "error" else None)
            page.on("requestfailed", lambda r: failed_requests.append(r.url))

            page.goto(f"{BASE}/index.html", wait_until="networkidle")

            # 1. Canvas existe e tem tamanho.
            page.wait_for_selector("#scene", timeout=10000)
            page.wait_for_timeout(1500)  # primeiros frames + texturas
            # 2. A cena renderiza: screenshot do canvas com variação real de
            #    pixels (lê o buffer via screenshot — readPixels com
            #    preserveDrawingBuffer=false daria preto).
            canvas_png = OUT / "visual-check-canvas.png"
            page.locator("#scene").screenshot(path=str(canvas_png))
            from PIL import Image
            import numpy as np

            arr = np.asarray(Image.open(canvas_png).convert("L"), dtype=np.float32)
            if arr.std() < 5.0:
                failures.append(f"canvas parece vazio/uniforme (std={arr.std():.1f})")

            # 3. Anotação: seis camadas no painel de análise.
            layers = page.locator("#analysis-layers .layer")
            n_layers = layers.count()
            if n_layers != 6:
                failures.append(f"camadas de análise: esperado 6, obtido {n_layers}")

            # 4. Modo de traço activa-se e desenha-se um segmento.
            # Vista de centro: câmara no centro do espaço a olhar para uma
            # parede — o raio ao meio do canvas apanha um painel.
            page.click("#view-centro")
            page.wait_for_timeout(400)
            page.click("#toggle-draw")
            pressed = page.get_attribute("#toggle-draw", "aria-pressed")
            if pressed != "true":
                failures.append("toggle-draw não activou")
            box = page.locator("#scene").bounding_box()
            cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            page.mouse.move(cx - 60, cy)
            page.mouse.down()
            page.mouse.move(cx + 60, cy, steps=8)
            page.mouse.up()
            page.wait_for_timeout(300)
            total = page.evaluate(
                "document.querySelectorAll('#analysis-layers .layer-count')"
                "&& [...document.querySelectorAll('#analysis-layers .layer-count')]"
                ".reduce((s, el) => s + Number(el.textContent), 0)"
            )
            if total < 1:
                failures.append("traço no canvas não criou anotação")
            page.keyboard.press("Escape")  # Escape já desliga o modo

            # 5. Texturas reais carregadas (não placeholder).
            textures_ok = page.evaluate(
                """async () => {
                    const ids = ['frades','pescadores','infante','arcebispo','cavaleiros','reliquia'];
                    const results = await Promise.all(ids.map(id =>
                        fetch(`./assets/images/panels/${id}.jpg`).then(r => r.ok)
                    ));
                    return results.every(Boolean);
                }"""
            )
            if not textures_ok:
                failures.append("textura de painel em falta (HTTP != 200)")

            # Screenshots para inspecção humana.
            page.screenshot(path=OUT / "visual-check-frontal.png")
            page.click("#view-superior")
            page.wait_for_timeout(500)
            page.screenshot(path=OUT / "visual-check-superior.png")
            page.click("#view-frontal")
            page.wait_for_timeout(300)
            # Vista de centro (olhar para dentro).
            page.click("#view-centro")
            page.wait_for_timeout(500)
            page.screenshot(path=OUT / "visual-check-centro.png")

            # 6. Disposições alternativas (T006): cada uma renderiza com
            #    variação real de pixels e sem erros de consola.
            for layout_id in ["plana", "angular", "u", "irregular"]:
                page.select_option("#config-select", layout_id)
                page.wait_for_timeout(700)
                page.locator("#scene").screenshot(path=str(OUT / f"visual-check-{layout_id}.png"))
                arr = np.asarray(
                    Image.open(OUT / f"visual-check-{layout_id}.png").convert("L"),
                    dtype=np.float32,
                )
                if arr.std() < 5.0:
                    failures.append(f"disposição {layout_id} parece vazia (std={arr.std():.1f})")

            # 7. Elementos de arquitetura (B004): porta na parede 1 gera
            #    conflito com o painel centrado; remoção limpa a lista.
            page.select_option("#config-select", "hexagono")
            page.wait_for_timeout(700)
            page.select_option(".element-form select >> nth=0", "porta")
            page.fill(".element-form input[type=number]", "0")
            page.click(".element-form button[type=submit]")
            page.wait_for_timeout(300)
            n_elements = page.locator(".element-list li").count()
            n_conflicts = page.locator(".conflict-list li").count()
            if n_elements != 1:
                failures.append(f"elemento não apareceu na lista (n={n_elements})")
            if n_conflicts < 1:
                failures.append("porta ao centro não gerou conflito com painel")
            page.screenshot(path=OUT / "visual-check-arquitetura.png")
            page.click(".element-list li button")
            page.wait_for_timeout(200)
            if page.locator(".element-list li").count() != 0:
                failures.append("remover elemento não limpou a lista")

            browser.close()

        real_errors = [e for e in console_errors if "favicon" not in e]
        if real_errors:
            failures.append(f"erros de consola: {real_errors[:3]}")
        if failed_requests:
            failures.append(f"pedidos falhados: {failed_requests[:5]}")
    finally:
        server.terminate()
        server.wait(timeout=5)

    if failures:
        print("FALHOU:")
        for f in failures:
            print(f"  - {f}")
        raise SystemExit(1)
    print("OK: cena renderiza, 6 camadas, traço cria anotação, texturas 200,")
    print("    5 disposições renderizam, conflitos porta×painel detectados.")
    print(f"screenshots em {OUT}/visual-check-*.png")


if __name__ == "__main__":
    main()
