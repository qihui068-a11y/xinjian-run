"""Bundle YoWASP Clang C++ for the offline console, using the C runner's WASI shim."""
import argparse
from io import BytesIO
from pathlib import Path, PurePosixPath
from runpy import run_path
from tarfile import open as tar_open


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path)
    args = parser.parse_args()
    tools = Path(__file__).resolve().parent
    common = run_path(str(tools / "prepare-c.py"))
    pinned = common["pinned"]
    common["SOURCES"].update({
        "clang.tgz": ("https://registry.npmjs.org/@yowasp/clang/-/clang-21.1.4-3.tgz",
                      "9c082ea5cac9489966adbe381529bf13bde18646126e98b8b089d83f57fe5e27"),
        "YOWASP-LICENSE.txt": ("https://raw.githubusercontent.com/YoWASP/clang/develop/LICENSE.txt",
                               "65c6633c2c9effa87f95bfe794d5da07bd3faab2814e4a0a15883e28ec4e543f"),
        "LLVM-LICENSE.txt": ("https://raw.githubusercontent.com/llvm/llvm-project/llvmorg-21.1.4/LICENSE.TXT",
                             "8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee"),
    })
    xcc = tools.parent / "modified/assets/www/python-runtime/xcc"
    if not (xcc / "runtime.json").is_file():
        raise SystemExit("Run python runner/prepare-c.py first")
    output = xcc.parent / "clang"
    output.mkdir(parents=True, exist_ok=True)
    (output / "runtime.json").unlink(missing_ok=True)
    with tar_open(fileobj=BytesIO(pinned("clang.tgz", args.cache, 32 * 1024 * 1024))) as package:
        for file in package.getmembers():
            name = PurePosixPath(file.name)
            if file.isfile() and name.parent == PurePosixPath("package/gen"):
                (output / name.name).write_bytes(package.extractfile(file).read())
    for license_name in ("LLVM-LICENSE.txt", "YOWASP-LICENSE.txt"):
        (output / license_name).write_bytes(pinned(license_name, args.cache))
    (output / "runtime.json").write_text('{"engine":"clang","version":1}', encoding="ascii")
    print("Bundled the offline C++ compiler")


if __name__ == "__main__":
    main()
