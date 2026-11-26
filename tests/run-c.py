"""Verify the offline C compiler and stdin terminal in Chromium."""
from functools import partial
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
from queue import Empty, Queue
import runpy
import shutil
from threading import Thread

from playwright.sync_api import expect, sync_playwright

shared_tests = runpy.run_path(str(Path(__file__).with_name("run-python.py")))
APP_HANDLER, WWW = shared_tests["AppHandler"], shared_tests["WWW"]


TEST_SESSION = "00000000-0000-4000-8000-000000000001"


class TestHandler(APP_HANDLER):
    BOUNDARY = f"/python-runtime/terminal/{TEST_SESSION}/"

    def do_GET(self):
        if not self.path.startswith(self.BOUNDARY):
            return super().do_GET()
        number = int(self.path.removeprefix(self.BOUNDARY))
        if number == 0:
            status, body = 204, b""
        else:
            try:
                received, line = self.server.terminal_lines.get(timeout=8)
                assert received == number
                status, body = (204, b"") if line is None else (200, line.encode("utf-8"))
            except Empty:
                status, body = 410, b""
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        assert self.path == "/test-terminal"
        size = int(self.headers["Content-Length"])
        self.server.terminal_lines.put(json.loads(self.rfile.read(size)))
        self.send_response(204)
        self.end_headers()


def check_android_transport(page, root):
    page.add_init_script("""((token) => {
        window.XinJianPythonTerminal = {
            open() { return token; },
            send(session, number, text, eof) {
                if (session !== token) return false;
                fetch('/test-terminal', {method:'POST', body:JSON.stringify([number, eof ? null : text])});
                return true;
            },
            close() {}
        };
    })(""" + json.dumps(TEST_SESSION) + """);""")
    page.route("https://**/*", lambda route: route.abort())
    page.goto(root + "/index.html?batch")
    assert page.evaluate("!crossOriginIsolated")
    page.evaluate("""async () => {
        await Bridge.create('test.c', '');
        Nav.reset('editor', {name:'test.c', mode:'edit'});
    }""")
    page.locator("#ta").fill(r"""#include <stdio.h>
int main(void) {
  int n;
  if (scanf("%d", &n) != 1) return 2;
  printf("native:%d\n", n);
  return 0;
}""")
    page.locator('[data-act="run"]').click()
    page.get_by_role("button", name="本地运行 C", exact=True).click()
    expect(page.locator(".run-status")).to_have_text("等待输入")
    expect(page.locator(".run-panel")).to_have_attribute("data-stdin-mode", "native")
    page.get_by_role("textbox", name="终端输入").fill("42")
    page.get_by_role("button", name="发送", exact=True).click()
    expect(page.locator(".run-status")).to_have_text("运行完成")
    expect(page.locator(".run-body pre")).to_have_text("native:42")
    print("PASS C with a browser simulation of the Android stdin transport")


def check(page, root):
    page.route("https://**/*", lambda route: route.abort())
    page.goto(root + "/index.html")
    assert page.evaluate("crossOriginIsolated")
    page.evaluate("""async () => {
        await Bridge.create('test.c', '');
        Nav.reset('editor', {name:'test.c', mode:'edit'});
    }""")
    status = page.locator(".run-status")
    terminal = page.locator(".run-terminal")
    output = page.locator(".run-body pre")

    def start(source):
        page.locator("#ta").fill(source)
        page.locator('[data-act="run"]').click()
        page.get_by_role("button", name="本地运行 C", exact=True).click()

    def send(line, enter=False):
        expect(status).to_have_text("等待输入")
        field = terminal.get_by_role("textbox")
        field.fill(line)
        if enter:
            field.press("Enter")
        else:
            terminal.get_by_role("button", name="发送", exact=True).click()

    start(r"""#include <stdio.h>
int main(void) {
  int left, right;
  printf("第一个数："); fflush(stdout);
  if (scanf("%d", &left) != 1) return 2;
  printf("第二个数："); fflush(stdout);
  if (scanf("%d", &right) != 1) return 3;
  printf("结果：%d\n", left + right);
  return 0;
}""")
    expect(status).to_have_text("等待输入")
    expect(output).to_contain_text("第一个数：")
    page.clock.fast_forward(9000)
    expect(status).to_have_text("等待输入")
    send("19")
    expect(output).to_contain_text("第二个数：")
    send("23", enter=True)
    expect(status).to_have_text("运行完成")
    expect(output).to_contain_text("结果：42")
    print("PASS offline C scanf waits beyond the execution limit, resumes twice, and shows prompts")

    start(r"""#include <stdio.h>
#include <string.h>
int main(void) {
  char text[80];
  if (!fgets(text, sizeof(text), stdin) || strcmp(text, "\n") != 0) return 2;
  if (!fgets(text, sizeof(text), stdin)) return 3;
  printf("%s", text);
  if (fgets(text, sizeof(text), stdin)) return 4;
  puts("EOF OK");
  return 0;
}""")
    send("")
    send("中文")
    expect(status).to_have_text("等待输入")
    terminal.get_by_role("button", name="结束输入", exact=True).click()
    expect(status).to_have_text("运行完成")
    expect(output).to_have_text("中文\nEOF OK")
    print("PASS offline C distinguishes empty lines, UTF-8, and EOF")

    start(r"""#include <stdio.h>
int main(void) {
  FILE *file = fopen("/usr/include/stdio.h", "r");
  if (file) return 3;
  int ch = getchar();
  printf("got %c\n", ch);
  return 0;
}""")
    expect(status).to_have_text("等待输入")
    terminal.get_by_role("button", name="取消输入", exact=True).click()
    expect(status).to_have_text("已取消输入")
    page.get_by_role("button", name="重新运行", exact=True).click()
    send("Y")
    expect(status).to_have_text("运行完成")
    expect(output).to_have_text("got Y")
    print("PASS offline C cancels cleanly, reruns, and cannot open compiler files")

    start("""#include <stdio.h>
int main(void) {
  int previous = (int)__builtin_wasm_memory_grow(0, 1100);
  puts(previous == -1 ? "memory limited" : "memory grew");
  return 0;
}""")
    expect(status).to_have_text("运行完成")
    expect(output).to_have_text("memory limited")
    print("PASS offline C enforces the WebAssembly memory limit")

    start("int main( {")
    expect(status).to_have_text("运行出错")
    expect(output).to_contain_text("main.c")
    print("PASS offline C displays compiler diagnostics")
    start("int main(void) { while (1) {} }")
    expect(status).to_have_text("运行中…")
    expect(page.locator(".run-panel")).to_have_attribute("data-stdin-mode", "shared")
    page.clock.fast_forward(8000)
    expect(status).to_have_text("运行超时，已停止")
    print("PASS offline C execution timeout")


def check_cpp(page, root):
    page.route("https://**/*", lambda route: route.abort())
    page.goto(root + "/index.html")
    page.evaluate("""async () => {
        await Bridge.create('test.cpp', '');
        Nav.reset('editor', {name:'test.cpp', mode:'edit'});
    }""")
    page.locator("#ta").fill(r"""#include <iostream>
#include <string>
int main() {
  int a, b;
  std::cout << "first: " << std::flush;
  if (!(std::cin >> a)) return 2;
  std::cout << "second: " << std::flush;
  if (!(std::cin >> b)) return 3;
  std::cout << "sum = " << a + b << '\n';
  return 0;
}""")
    page.locator('[data-act="run"]').click()
    page.get_by_role("button", name="本地运行 C++", exact=True).click()
    status = page.locator(".run-status")
    output = page.locator(".run-body pre")
    for prompt, line in (("first:", "19"), ("second:", "23")):
        expect(status).to_have_text("等待输入", timeout=45000)
        expect(output).to_contain_text(prompt)
        page.get_by_role("textbox", name="终端输入").fill(line)
        page.get_by_role("textbox", name="终端输入").press("Enter")
    expect(status).to_have_text("运行完成")
    expect(output).to_contain_text("sum = 42")
    print("PASS offline C++ compiles iostream and resumes twice through std::cin")


if __name__ == "__main__":
    if not (WWW / "python-runtime/xcc/runtime.json").is_file():
        raise SystemExit("Run python runner/prepare-c.py first")
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(TestHandler, directory=WWW)) as server:
        server.terminal_lines = Queue()
        Thread(target=server.serve_forever, daemon=True).start()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=os.environ.get("XJ_CHROMIUM") or shutil.which("chromium"))
            try:
                page = browser.new_page(viewport={"width": 390, "height": 800})
                page.clock.install()
                root = f"http://127.0.0.1:{server.server_port}"
                check(page, root)
                page.close()
                check_android_transport(browser.new_page(viewport={"width": 390, "height": 800}), root)
                if (WWW / "python-runtime/clang/runtime.json").is_file():
                    check_cpp(browser.new_page(viewport={"width": 390, "height": 800}), root)
            finally:
                browser.close()
                server.shutdown()
