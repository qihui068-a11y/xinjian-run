"""Prepare the pinned offline Python assets for a development build."""

from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
from pathlib import Path
import re
from tempfile import NamedTemporaryFile
from urllib.request import urlopen

VERSION = "0.29.3"
MEMORY_MB = 256
BASE = f"https://cdn.jsdelivr.net/pyodide/v{VERSION}/full/"
LICENSE_URL = f"https://raw.githubusercontent.com/pyodide/pyodide/{VERSION}/LICENSE"
CORE = {
    "pyodide.js": "718d40f1c015dd25ec724cc8fc4e2325d6a45a92ae225121ff6953f224a16f72",
    "pyodide.asm.js": "1263f02b5b26099b96112378156f242dd98b39a8201ba7765e5fe3d455c5ce91",
    "pyodide.asm.wasm": "e2f4ee75b325e35eb31bfb8c613d4dd5098f5502c156a97847686875b5025480",
    "python_stdlib.zip": "4298b6ee445cb724c3973437da47789752b9e6ff4e26619026b283ec801fc46b",
    "pyodide-lock.json": "3256ffc76388de0e37f4b34d42ab484268d1afc675179ff97b2a5bb14f84ccac",
    "LICENSE-Pyodide.txt": "1f256ecad192880510e84ad60474eab7589218784b9a50bc7ceee34c2b91f1d5",
}
OUT = Path(__file__).resolve().parents[1] / "modified/assets/www/python-runtime"


def download(name, digest):
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", name) or name in {".", ".."}:
        raise ValueError(f"Invalid asset name {name!r}")
    url = LICENSE_URL if name == "LICENSE-Pyodide.txt" else BASE + name
    with urlopen(url, timeout=45) as response:
        content = response.read(32 * 1024 * 1024 + 1)
    if len(content) > 32 * 1024 * 1024 or sha256(content).hexdigest() != digest:
        raise ValueError(f"Integrity check failed for {name}")
    return content


def save(name, contents):
    with NamedTemporaryFile(dir=OUT, delete=False) as f:
        path = Path(f.name)
        f.write(contents)
    try:
        path.replace(OUT / name)
    finally:
        path.unlink(missing_ok=True)


def prepare(entry):
    name, digest = entry
    path = OUT / name
    if name != "pyodide.asm.js" and path.is_file() and sha256(path.read_bytes()).hexdigest() == digest:
        return
    contents = download(name, digest)
    if name == "pyodide.asm.js":
        original = b"{initial:INITIAL_MEMORY/65536,maximum:65536}"
        limit = f"{{initial:INITIAL_MEMORY/65536,maximum:{MEMORY_MB * 16}}}".encode()
        if contents.count(original) != 1:
            raise ValueError("Cannot limit the pinned Python WASM heap")
        contents = contents.replace(original, limit)
    save(name, contents)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    marker = OUT / "runtime.json"
    marker.unlink(missing_ok=True)
    prepare(("pyodide-lock.json", CORE["pyodide-lock.json"]))
    packages = json.loads((OUT / "pyodide-lock.json").read_bytes())["packages"]
    files = dict(CORE)
    keys = ["matplotlib", "pillow"]
    while keys:
        package = packages[keys.pop().lower().replace("_", "-")]
        name = package["file_name"]
        if name in files:
            continue
        files[name] = package["sha256"]
        keys.extend(package["depends"])
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(prepare, files.items()))
    save("runtime.json", json.dumps({"version": VERSION, "memoryMB": MEMORY_MB}).encode())
    print(f"Prepared {len(files)} assets for Pyodide {VERSION} (WASM heap {MEMORY_MB} MiB)")


if __name__ == "__main__":
    main()
