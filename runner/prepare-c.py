"""Bundle the pinned XCC compiler and its WASI shim for offline C execution."""
import argparse
from base64 import b64encode
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
from shutil import copyfile
from tarfile import open as tar_open
from urllib.request import urlopen
from zipfile import ZipFile

SOURCES = {
    "wccfiles.zip": ("https://tyfkda.github.io/xcc/wccfiles.zip",
                     "169bdd2f33662f2bb49ed8b8911cd48d91b00d3a06289a9eab93883527e56b1a"),
    "shim.tgz": ("https://registry.npmjs.org/@bjorn3/browser_wasi_shim/-/browser_wasi_shim-0.4.2.tgz",
                 "9c0281520d0e99f027ec7c1c79b4036c0f8168ed9bf98aba19db4737a1333782"),
    "xcc-license.txt": ("https://raw.githubusercontent.com/tyfkda/xcc/659a1773f20499864a8c3fdc7cd25cb506092bc1/LICENSE",
                        "2456a1ec205b4b13084576d2e1ce66da52b60ffdac45b512da328a09e0b99617"),
}


def pinned(name, cache, limit=2 * 1024 * 1024):
    url, expected = SOURCES[name]
    if cache is not None and (cache / name).is_file():
        data = (cache / name).read_bytes()
    else:
        with urlopen(url, timeout=30) as response:
            data = response.read(limit + 1)
    if sha256(data).hexdigest() != expected:
        raise RuntimeError(f"{name} does not match the pinned SHA-256")
    if cache is not None:
        cache.mkdir(parents=True, exist_ok=True)
        (cache / name).write_bytes(data)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    output = root / "modified/assets/www/python-runtime/xcc"
    output.mkdir(parents=True, exist_ok=True)
    shim = output / "shim"
    shim.mkdir(exist_ok=True)
    (output / "runtime.json").unlink(missing_ok=True)
    with ZipFile(BytesIO(pinned("wccfiles.zip", args.cache))) as package:
        (output / "cc.wasm").write_bytes(package.read("usr/bin/cc"))
        files = {f.filename: b64encode(package.read(f)).decode("ascii")
                 for f in package.infolist() if not f.is_dir()
                 and f.filename.startswith(("usr/include/", "usr/lib/"))}
        (output / "sysroot.json").write_text(json.dumps(files), encoding="utf-8")
    with tar_open(fileobj=BytesIO(pinned("shim.tgz", args.cache))) as package:
        for f in package.getmembers():
            path = PurePosixPath(f.name)
            if f.isfile() and path.parent == PurePosixPath("package/dist") and path.suffix == ".js":
                (shim / path.name).write_bytes(package.extractfile(f).read())
        for license_name in ("LICENSE-MIT", "LICENSE-APACHE"):
            (shim / license_name).write_bytes(package.extractfile("package/" + license_name).read())
    (output / "LICENSE").write_bytes(pinned("xcc-license.txt", args.cache))
    copyfile(root / "runner/c-worker.js", output / "runner.js")
    (output / "runtime.json").write_text('{"engine":"xcc","version":1}', encoding="ascii")
    print("Bundled the offline C compiler and WASI shim")


if __name__ == "__main__":
    main()
