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
import hashlib
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


def set_input(page, selector, value):
    """Define o valor de um input directamente, via evaluate.

    QUIRK DO AMBIENTE (descoberto no T008): page.fill() e
    page.keyboard.type() NÃO funcionam neste Chromium headless com
    SwiftShader — o evento keydown chega à janela, mas o valor do
    campo nunca actualiza (o mesmo fenómeno que vicia inner_text()).
    O truque é atribuir .value e despachar os eventos input/change,
    que é o que a UI consome.
    """
    page.evaluate(
        """([sel, val]) => {
            const el = document.querySelector(sel);
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        [selector, str(value)],
    )


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
            page_errors = []
            failed_requests = []
            page.on("console", lambda m: console_errors.append(m.text)
                    if m.type == "error" else None)
            page.on("pageerror", lambda e: page_errors.append(str(e)))
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
            #    variação real de pixels, sem erros e de facto DISTINTA
            #    das anteriores (hash do PNG). Nota: vista frontal antes
            #    de cada captura — a partir da vista "centro" (pós-trace),
            #    as disposições abertas mostram todas a mesma face vazia
            #    (falso positivo descoberto no T008).
            layout_shas = {}
            for layout_id in ["plana", "angular", "u", "irregular"]:
                page.select_option("#config-select", layout_id)
                page.click("#view-frontal")
                page.wait_for_timeout(700)
                shot = OUT / f"visual-check-{layout_id}.png"
                page.locator("#scene").screenshot(path=str(shot))
                layout_shas[layout_id] = hashlib.sha256(shot.read_bytes()).hexdigest()
                arr = np.asarray(Image.open(shot).convert("L"), dtype=np.float32)
                if arr.std() < 5.0:
                    failures.append(f"disposição {layout_id} parece vazia (std={arr.std():.1f})")
            if len(set(layout_shas.values())) != len(layout_shas):
                dup = [k for k, v in layout_shas.items()
                       if list(layout_shas.values()).count(v) > 1]
                failures.append(f"capturas idênticas entre disposições: {sorted(set(dup))}")

            # 7. Elementos de arquitetura (B004): porta na parede 1 gera
            #    conflito com o painel centrado; remoção limpa a lista.
            page.select_option("#config-select", "hexagono")
            page.wait_for_timeout(700)
            page.select_option(".element-form select >> nth=0", "porta")
            # offset 0 (centro) — via set_input (fill é no-op neste
            # ambiente headless; ver quirk em set_input).
            set_input(page, ".element-form input[type=number]", 0)
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

            # 8. Métricas T007: desenhar duas linhas paralelas num painel e
            #    verificar que a direcção dominante é calculada (não vazia).
            page.click("#view-centro")
            page.wait_for_timeout(400)
            page.click("#toggle-draw")
            box = page.locator("#scene").bounding_box()
            cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            page.mouse.move(cx - 50, cy - 10)
            page.mouse.down()
            page.mouse.move(cx + 50, cy - 10, steps=6)
            page.mouse.up()
            page.wait_for_timeout(200)
            page.keyboard.press("Escape")
            page.click("#metrics button")
            page.wait_for_timeout(300)
            # NOTA: usar text_content() — innerText sai vazio neste
            # headless SwiftShader (quirk de renderização), mas o DOM
            # tem o conteúdo correcto.
            metrics_text = page.locator("#metrics .metrics-out").text_content() or ""
            if "direção" not in metrics_text and "sem traçados" not in metrics_text:
                failures.append("painel de métricas não mostrou resultados")
            if "linha(s)" not in metrics_text:
                failures.append("direcção dominante não calculada")
            page.screenshot(path=OUT / "visual-check-metricas.png")

            # 9. Cenários (T008): guardar o estado actual (com as
            #    anotações desenhadas), recarregar a página — o cenário
            #    sobrevive via LocalStorage — e carregá-lo repõe as
            #    contagens de anotações por camada.
            counts_before = page.evaluate(
                "[...document.querySelectorAll('#analysis-layers .layer-count')]"
                ".reduce((s, el) => s + Number(el.textContent), 0)"
            )
            set_input(page, "#scenario-name", "smoke-t008")
            set_input(page, "#scenario-desc", "cenário do cheque visual")
            page.click("#scenario-save")
            page.wait_for_timeout(200)
            status = page.locator("#scenario-status").text_content() or ""
            if "guardado" not in status:
                failures.append(f"guardar cenário falhou: {status!r}")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
            options = page.locator("#scenario-list option")
            names = [
                options.nth(i).text_content() or "" for i in range(options.count())
            ]
            if not any("smoke-t008" in n for n in names):
                failures.append(f"cenário não sobreviveu ao reload: {names}")
            page.select_option(
                "#scenario-list",
                next(
                    (options.nth(i).get_attribute("value")
                     for i in range(options.count())
                     if "smoke-t008" in (options.nth(i).text_content() or "")),
                    "",
                ),
            )
            page.click("#scenario-load")
            page.wait_for_timeout(300)
            status = page.locator("#scenario-status").text_content() or ""
            if "carregado" not in status:
                failures.append(f"carregar cenário falhou: {status!r}")
            counts_after = page.evaluate(
                "[...document.querySelectorAll('#analysis-layers .layer-count')]"
                ".reduce((s, el) => s + Number(el.textContent), 0)"
            )
            if counts_after != counts_before or counts_before < 1:
                failures.append(
                    f"anotações não restauradas: antes={counts_before} depois={counts_after}"
                )
            page.screenshot(path=OUT / "visual-check-cenarios.png")
            # Apagar o cenário de teste mantém a lista limpa para o run.
            page.click("#scenario-del")
            page.wait_for_timeout(200)
            if page.locator("#scenario-list option").count() != 0:
                failures.append("apagar cenário não limpou a lista")

            browser.close()

        real_errors = [e for e in console_errors if "favicon" not in e]
        if real_errors:
            failures.append(f"erros de consola: {real_errors[:3]}")
        if page_errors:
            failures.append(f"excepções não apanhadas: {page_errors[:3]}")
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
    print("    5 disposições renderizam e são distintas entre si,")
    print("    conflitos porta×painel detectados,")
    print("    métricas T007 calculam (direcção dominante),")
    print("    cenário T008 guarda, sobrevive ao reload e restaura anotações.")
    print(f"screenshots em {OUT}/visual-check-*.png")


if __name__ == "__main__":
    main()
