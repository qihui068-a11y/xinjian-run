"""Test the Piston WebSocket contract with allowlisted, genuinely compiled Java and C# fixtures."""
from functools import partial
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
import runpy
import shutil
import subprocess
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from websockets.exceptions import ConnectionClosed
from websockets.sync.server import serve


shared_tests = runpy.run_path(str(Path(__file__).with_name("run-python.py")))
APP_HANDLER, WWW = shared_tests["AppHandler"], shared_tests["WWW"]
JAVA = """import java.util.Scanner;
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.print("first: "); System.out.flush();
        int a = in.nextInt();
        System.out.print("second: "); System.out.flush();
        int b = in.nextInt();
        System.out.println("sum = " + (a + b));
    }
}"""
CSHARP = """using System;
class Program {
    static void Main() {
        Console.Write("first: "); Console.Out.Flush();
        int a = int.Parse(Console.ReadLine());
        Console.Write("second: "); Console.Out.Flush();
        int b = int.Parse(Console.ReadLine());
        Console.WriteLine("sum = " + (a + b));
    }
}"""


def compile_fixtures(path):
    java, csharp = path / "Main.java", path / "Program.cs"
    java.write_text(JAVA, encoding="utf-8")
    csharp.write_text(CSHARP, encoding="utf-8")
    subprocess.run(["javac", "-encoding", "UTF-8", str(java)], check=True, timeout=15)
    exe = path / "Program.exe"
    if os.name == "nt":
        csc = shutil.which("csc") or str(
            Path(os.environ["WINDIR"]) / "Microsoft.NET/Framework64/v4.0.30319/csc.exe")
        subprocess.run([csc, "/nologo", "/out:" + str(exe), str(csharp)], check=True, timeout=15)
        cs_command = [str(exe)]
    else:
        subprocess.run(["mcs", "-out:" + str(exe), str(csharp)], check=True, timeout=15)
        cs_command = ["mono", str(exe)]
    return {
        "java": (JAVA, "Main", ["java", "-cp", str(path), "Main"]),
        "csharp": (CSHARP, "Program.cs", cs_command)
    }


def session(socket, fixtures):
    def send(**message):
        socket.send(json.dumps(message))

    request = json.loads(socket.recv(timeout=5))
    fixture = fixtures.get(request.get("language"))
    # Never compile or execute arbitrary received source on the test host.
    if request.get("type") != "init" or not fixture or request.get("files") != [
            {"name": fixture[1], "content": fixture[0]}]:
        send(type="error", message="Unexpected test fixture")
        return
    send(type="stage", stage="compile")
    send(type="exit", stage="compile", code=0)
    child = subprocess.Popen(fixture[2], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, bufsize=0)

    def output():
        try:
            while data := child.stdout.read(1024):
                send(type="data", stream="stdout", data=data.decode("ascii"))
            send(type="exit", stage="run", code=child.wait(timeout=4))
            socket.close(code=4999)
        except ConnectionClosed:
            pass

    send(type="stage", stage="run")
    worker = Thread(target=output, daemon=True)
    worker.start()
    try:
        while True:
            command = json.loads(socket.recv(timeout=10))
            assert command.get("type") == "data" and command.get("stream") == "stdin"
            child.stdin.write(command["data"].encode("ascii"))
    except (ConnectionClosed, BrokenPipeError):
        pass
    finally:
        if child.poll() is None:
            child.kill()
        child.wait(timeout=4)
        worker.join(timeout=4)


def test(page, app, service, ext, source):
    page.goto(app + "/index.html")
    page.evaluate("""async ext => {
        const name = 'test.' + ext;
        await Bridge.create(name, '');
        Nav.reset('editor', {name, mode:'edit'});
    }""", ext)
    page.locator("#ta").fill(source)
    page.locator('[data-act="run"]').click()
    page.get_by_text("在线交互", exact=True).click()
    page.get_by_role("textbox", name="Piston 服务地址").fill(service)
    page.get_by_role("button", name="连接并运行", exact=True).click()
    out = page.locator(".run-body pre")
    status = page.locator(".run-status")
    field = page.get_by_role("textbox", name="终端输入")
    expect(status).to_have_text("运行中，可输入")
    expect(out).to_contain_text("first:")
    field.fill("19")
    page.get_by_role("button", name="发送", exact=True).click()
    expect(out).to_contain_text("second:")
    field.fill("23")
    field.press("Enter")
    expect(out).to_contain_text("sum = 42")
    expect(status).to_have_text("运行完成")
    expect(field).to_have_count(0)
    page.get_by_role("button", name="重新运行", exact=True).click()
    expect(out).to_contain_text("first:")
    page.locator('[data-act="stop"]').click()
    expect(status).to_have_text("已取消等待")
    expect(field).to_have_count(0)
    print(f"PASS {ext} real runtime reads two lines, completes, reruns and disconnects via the WebSocket adapter")


if __name__ == "__main__":
    with TemporaryDirectory() as directory:
        fixtures = compile_fixtures(Path(directory))
        with serve(partial(session, fixtures=fixtures), "127.0.0.1", 0) as service:
            with ThreadingHTTPServer(("127.0.0.1", 0), partial(APP_HANDLER, directory=WWW)) as app:
                Thread(target=app.serve_forever, daemon=True).start()
                Thread(target=service.serve_forever, daemon=True).start()
                with sync_playwright() as playwright:
                    browser = playwright.chromium.launch(executable_path=os.environ.get("XJ_CHROMIUM") or shutil.which("chromium"))
                    try:
                        for ext, source in (("java", JAVA), ("cs", CSHARP)):
                            page = browser.new_page(viewport={"width": 390, "height": 800})
                            page.route("https://**/*", lambda route: route.abort())
                            test(page, f"http://127.0.0.1:{app.server_port}",
                                 f"ws://127.0.0.1:{service.socket.getsockname()[1]}/api/v2/connect", ext, source)
                            page.close()
                    finally:
                        browser.close()
                        app.shutdown()
