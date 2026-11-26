"""Exercise the bundled Python worker and app terminal in a Chromium browser."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re
import shutil
from threading import Thread
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / "modified/assets/www"


class AppHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        path = urlsplit(self.path).path
        if path == "/index.html" and "batch" not in self.path:
            self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        if path == "/index.html" or path == "/python-worker.js":
            self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        if path == "/python-worker.js":
            assets = f"http://127.0.0.1:{self.server.server_port}/python-runtime/"
            self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'wasm-unsafe-eval' "
                             + assets + "; connect-src " + assets + "; worker-src 'none'")
        super().end_headers()


def run(server, browser):
    root = f"http://127.0.0.1:{server.server_port}"
    page = browser.new_page(viewport={"width": 390, "height": 800})
    page.route("https://**/*", lambda route: route.abort())
    page.goto(root + "/index.html")
    assert page.evaluate("crossOriginIsolated")

    def editor():
        page.evaluate("""async () => {
            await Bridge.create('test.py', '');
            Nav.reset('editor', {name:'test.py', mode:'edit'});
        }""")
        page.locator("#ta").wait_for()

    editor()
    status = page.locator(".run-status")
    out = page.locator(".run-body pre")
    terminal = page.locator(".run-terminal")
    run_button = page.locator('[data-act="run"]')

    def start(source, stdin="", interactive=False, files=None):
        page.locator("#ta").fill(source)
        run_button.click()
        page.locator(".run-online textarea").fill(stdin)
        page.get_by_text("本地 Python（实验）", exact=True).click()
        if files:
            page.locator('.run-online input[type="file"]').set_input_files(files)
        page.get_by_role("button", name="交互运行" if interactive else "本地运行", exact=True).click()

    start('print(input()); print(int(input()) + 3)', '甲\n2\n')
    expect(status).to_have_text("运行完成", timeout=30000)
    expect(out).to_have_text("甲\n5")
    print("PASS local CPython preloaded stdin")

    start('first=input("第一个值："); second=input("第二个值："); print(first + second)', interactive=True)
    expect(terminal).to_be_visible(timeout=30000)
    terminal.get_by_role("textbox").fill("你")
    terminal.get_by_role("button", name="发送").click()
    expect(terminal).to_be_visible()
    terminal.get_by_role("textbox").fill("好")
    terminal.get_by_role("button", name="发送").click()
    expect(status).to_have_text("运行完成")
    expect(out).to_contain_text("你好")
    print("PASS interactive Python input() resumes twice with the same process state")

    start('input()', interactive=True)
    expect(terminal).to_be_visible(timeout=30000)
    terminal.get_by_role("button", name="结束输入").click()
    expect(status).to_have_text("运行出错")
    expect(out).to_contain_text("EOFError")
    start('input()', interactive=True)
    expect(terminal).to_be_visible(timeout=30000)
    page.locator('[data-act="stop"]').click()
    expect(status).to_have_text("已停止")
    expect(terminal).to_have_count(0)
    print("PASS EOF and stop while Python waits for input")

    start("""import js
print(hasattr(js, 'XinJianBridge'), hasattr(js, 'XinJianUpdate'), hasattr(js, 'fetch'))
print('x' * 90000)
""")
    expect(status).to_have_text("运行完成", timeout=30000)
    expect(out).to_contain_text("False False False")
    expect(out).to_contain_text("输出已截断")
    start("bytearray(400 * 1024 * 1024)")
    expect(status).to_have_text("运行出错", timeout=30000)
    expect(out).to_contain_text("MemoryError")
    start("while True: pass")
    expect(status).to_have_text("运行超时，已停止", timeout=30000)
    print("PASS worker cannot access Bridge/fetch and enforces output, memory and time limits")

    start("""import matplotlib.pyplot as plt
plt.plot([1, 3, 2])
plt.show()
""")
    expect(status).to_have_text("运行完成", timeout=60000)
    figure = page.locator(".run-artifact img")
    expect(figure).to_have_attribute("alt", "plot-1.png")
    assert figure.evaluate("img => img.decode().then(() => img.naturalWidth)") > 10

    start("""from PIL import Image
with open('/input/data.txt') as source:
    text = source.read()
print(text)
Image.new('RGB', (16, 12), 'red').save('sample.png')
with open('result.txt', 'w') as result:
    result.write(text.upper())
""", files=[{"name": "data.txt", "mimeType": "text/plain", "buffer": b"hello offline"}])
    expect(status).to_have_text("运行完成", timeout=30000)
    expect(out).to_have_text("hello offline")
    expect(figure).to_have_count(1)
    assert figure.evaluate("img => img.decode().then(() => img.naturalWidth)") == 16
    with page.expect_download() as downloaded:
        page.get_by_role("link", name="下载 result.txt").click()
    assert downloaded.value.path().read_text() == "HELLO OFFLINE"
    print("PASS Matplotlib previews, Pillow previews and selected input/downloaded output files")

    page.close()
    page = browser.new_page(viewport={"width": 390, "height": 800})
    page.goto(root + "/index.html?batch")
    assert not page.evaluate("crossOriginIsolated")
    editor()
    status = page.locator(".run-status")
    out = page.locator(".run-body pre")
    run_button = page.locator('[data-act="run"]')
    start("print(input())", "batch only")
    expect(status).to_have_text(re.compile("运行完成|运行出错"), timeout=30000)
    assert status.inner_text() == "运行完成", out.inner_text()
    expect(out).to_have_text("batch only")
    print("PASS preloaded Python stdin on a non-isolated page")


if __name__ == "__main__":
    if not (WWW / "python-runtime/runtime.json").is_file():
        raise SystemExit("Run python runner/prepare-python.py first")
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(AppHandler, directory=WWW)) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=os.environ.get("XJ_CHROMIUM") or shutil.which("chromium"))
            try:
                run(server, browser)
            finally:
                browser.close()
                server.shutdown()
