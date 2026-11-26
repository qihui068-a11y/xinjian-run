"""Exercise the bundled Python worker and app terminal in a Chromium browser."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re
import shutil
import struct
from threading import Thread
from urllib.parse import urlsplit
import zlib

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / "modified/assets/www"


def red_pixel_png():
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"\0\xff\0\0")) + chunk(b"IEND", b""))


class AppHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path == "/python-worker.js" and getattr(self.server, "legacy_stdin", False):
            worker, count = re.subn(rb"^const promiseInput = .+;$", b"const promiseInput = false;",
                                    (WWW / "python-worker.js").read_bytes(), flags=re.MULTILINE)
            assert count == 1
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript")
            self.send_header("Content-Length", str(len(worker)))
            self.end_headers()
            self.wfile.write(worker)
        else:
            super().do_GET()

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
    page = browser.new_page(viewport={"width": 390, "height": 800},
                            permissions=["clipboard-read", "clipboard-write"])
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

    def start(source, stdin="", interactive=True, files=None):
        page.locator("#ta").fill(source)
        run_button.click()
        page.locator(".run-online textarea").fill(stdin)
        page.get_by_text("本地 Python（实验）", exact=True).click()
        if files:
            page.locator('.run-online input[type="file"]').set_input_files(files)
        page.get_by_role("button", name="本地运行" if interactive else "预填运行", exact=True).click()

    start('print(input()); print(int(input()) + 3); print(repr(input()))', '甲\n2\n\n', interactive=False)
    expect(status).to_have_text("运行完成", timeout=30000)
    expect(out).to_have_text("甲\n5\n''")
    print("PASS local CPython preloaded stdin")

    panel = page.locator(".run-panel")

    def answer(prompt, value, enter=False):
        expect(terminal.locator("label")).to_have_text(prompt, timeout=30000)
        box = terminal.get_by_role("textbox")
        box.fill(value)
        if enter:
            box.press("Enter")
        else:
            terminal.get_by_role("button", name="发送", exact=True).click()

    def check_interactive(mode):
        if mode == "shared":
            page.clock.install()
        start("""name = input("请输入姓名：")
age = int(input("请输入年龄："))
print("姓名：", name)
print("年龄：", age)

for i in range(3):
    value = input("请输入内容：")
    print(value)
""")
        expect(terminal.locator("label")).to_have_text("请输入姓名：", timeout=30000)
        expect(panel).to_have_attribute("data-stdin-mode", mode)
        expect(out).to_contain_text("请输入姓名：")
        if mode == "shared":
            page.clock.fast_forward(95000)
            expect(status).to_have_text("等待输入")
            page.get_by_role("button", name="清空终端", exact=True).click()
            expect(out).to_be_empty()
        answer("请输入姓名：", "小明", enter=True)
        answer("请输入年龄：", "20")
        answer("请输入内容：", "中文")
        answer("请输入内容：", "", enter=True)
        answer("请输入内容：", "第三次")
        expect(status).to_have_text("运行完成")
        expect(out).to_contain_text("姓名： 小明")
        expect(out).to_contain_text("年龄： 20")
        assert re.search("请输入内容：中文\n请输入内容：\n请输入内容：第三次", out.inner_text())

        page.get_by_role("button", name="复制结果", exact=True).click()
        expect(page.get_by_text("已复制结果", exact=True)).to_be_visible()
        assert page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n") == out.text_content()

        start("print(repr(input('空行：'))); input('结束：')")
        answer("空行：", "", enter=True)
        expect(terminal.locator("label")).to_have_text("结束：")
        expect(out).to_contain_text("空行：''")
        terminal.get_by_role("button", name="结束输入", exact=True).click()
        expect(status).to_have_text("运行出错")
        expect(out).to_contain_text("EOFError: EOF when reading a line")

        start("print(input('再次输入：'))")
        expect(terminal.locator("label")).to_have_text("再次输入：", timeout=30000)
        terminal.get_by_role("button", name="取消输入", exact=True).click()
        expect(status).to_have_text("已取消输入")
        expect(terminal).to_have_count(0)
        page.get_by_role("button", name="重新运行", exact=True).click()
        expect(terminal.locator("label")).to_have_text("再次输入：", timeout=30000)
        page.locator('[data-act="stop"]').click()
        expect(status).to_have_text("已停止")
        expect(terminal).to_have_count(0)
        page.get_by_role("button", name="重新运行", exact=True).click()
        answer("再次输入：", "运行成功")
        expect(status).to_have_text("运行完成")
        expect(out).to_contain_text("运行成功")
        print(f"PASS {mode} input prompts, multiple lines, loop, CJK, blank, EOF, cancel, stop, rerun and copy")

    check_interactive("shared")

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
image = Image.open('/input/pixel.png')
assert image.getpixel((0, 0)) == (255, 0, 0)
print(text)
image.resize((16, 12)).save('sample.png')
with open('result.txt', 'w') as result:
    result.write(text.upper())
""", files=[{"name": "data.txt", "mimeType": "text/plain", "buffer": b"hello offline"},
             {"name": "pixel.png", "mimeType": "image/png", "buffer": red_pixel_png()}])
    expect(status).to_have_text("运行完成", timeout=30000)
    expect(out).to_have_text("hello offline")
    expect(figure).to_have_count(1)
    assert figure.evaluate("img => img.decode().then(() => img.naturalWidth)") == 16
    with page.expect_download() as downloaded:
        page.get_by_role("link", name="下载 result.txt").click()
    assert downloaded.value.path().read_text() == "HELLO OFFLINE"
    print("PASS Matplotlib previews, Pillow previews and selected input/downloaded output files")

    page.close()
    page = browser.new_page(viewport={"width": 390, "height": 800},
                            permissions=["clipboard-read", "clipboard-write"])
    page.goto(root + "/index.html?batch")
    assert not page.evaluate("crossOriginIsolated")
    editor()
    status = page.locator(".run-status")
    out = page.locator(".run-body pre")
    run_button = page.locator('[data-act="run"]')
    terminal = page.locator(".run-terminal")
    panel = page.locator(".run-panel")
    if page.evaluate("typeof WebAssembly.Suspending === 'function' && typeof WebAssembly.promising === 'function'"):
        check_interactive("jspi")
    else:
        print("SKIP JSPI because this Chromium has no stack switching")

    page.close()
    server.legacy_stdin = True
    page = browser.new_page(viewport={"width": 390, "height": 800})
    page.goto(root + "/index.html?batch")
    assert not page.evaluate("crossOriginIsolated")
    editor()
    status = page.locator(".run-status")
    out = page.locator(".run-body pre")
    run_button = page.locator('[data-act="run"]')
    terminal = page.locator(".run-terminal")
    panel = page.locator(".run-panel")
    start("print(input()); print(repr(input()))", "兼容输入\n\n")
    expect(status).to_have_text("运行完成", timeout=30000)
    expect(panel).to_have_attribute("data-stdin-mode", "preloaded")
    expect(out).to_have_text("兼容输入\n''")
    start("input('缺少输入：')")
    expect(status).to_have_text("运行出错", timeout=30000)
    expect(out).to_contain_text("需要预填输入")
    expect(out).to_contain_text("EOFError")
    print("PASS preloaded Python stdin and exhausted-input message with both interactive transports disabled")

    start("""from xinjian_terminal import readline
first = await readline('异步输入一')
second = await readline('异步输入二')
print(first + second)
""", interactive=True)
    expect(terminal.locator('label')).to_have_text("异步输入一", timeout=30000)
    terminal.get_by_role("textbox").fill("真")
    terminal.get_by_role("button", name="发送").click()
    expect(terminal.locator('label')).to_have_text("异步输入二")
    terminal.get_by_role("textbox").fill("交互")
    terminal.get_by_role("button", name="发送").click()
    expect(status).to_have_text("运行完成")
    expect(out).to_have_text("真交互")
    start("from xinjian_terminal import readline; print(await readline('EOF') is None)")
    expect(terminal.locator("label")).to_have_text("EOF", timeout=30000)
    terminal.get_by_role("button", name="结束输入", exact=True).click()
    expect(status).to_have_text("运行完成")
    expect(out).to_have_text("True")
    print("PASS Python async input on a non-isolated page")


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
