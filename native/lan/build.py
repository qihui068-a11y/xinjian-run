"""Compile a native Java module into the smali used by the Apktool build."""

import argparse
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
from zipfile import ZipFile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("android_jar", type=Path)
    parser.add_argument("r8_jar", type=Path)
    parser.add_argument("apktool_jar", type=Path)
    parser.add_argument("--java-bin", type=Path, help="JDK bin directory")
    components = {
        "lan": ("LanBridge", "LanTransport"),
        "keyboard": ("KeyboardViewport",),
        "python": ("PythonTerminal",),
        "update": ("UpdateBridge", "UpdateRelease", "UpdateApkProvider"),
    }
    parser.add_argument("--component", choices=components, default="lan")
    args = parser.parse_args()
    native = Path(__file__).resolve().parents[1]
    source = native / args.component
    package = Path("tt/xinjian/cn")
    dest = native.parent / "modified/smali" / package
    classes_to_compile = components[args.component]
    names_pattern = "|".join(map(re.escape, classes_to_compile))
    owned = re.compile(rf"(?:{names_pattern})(?:\$[\w$-]+)?\.smali")

    def jdk(program):
        if not args.java_bin:
            return program
        return str(args.java_bin / program)

    def run(*command):
        subprocess.run([str(part) for part in command], check=True)

    with TemporaryDirectory(prefix=f"xinjian-{args.component}-") as path:
        work = Path(path)
        classes = work / "classes"
        dex = work / "dex"
        smali = work / "smali"
        jar = work / "module.jar"
        archive = work / "module.apk"
        classes.mkdir()
        dex.mkdir()
        run(jdk("javac"), "--release", "8", "-Xlint:-options", "-encoding", "UTF-8", "-classpath", args.android_jar, "-d", classes,
            *(source / package / f"{name}.java" for name in classes_to_compile))
        run(jdk("jar"), "cf", jar, "-C", classes, ".")
        run(jdk("java"), "-cp", args.r8_jar, "com.android.tools.r8.D8", "--min-api", "21",
            "--lib", args.android_jar, "--output", dex, jar)
        with ZipFile(archive, "w") as bundle:
            bundle.write(dex / "classes.dex", "classes.dex")
        run(jdk("java"), "-Dfile.encoding=UTF-8", "-jar", args.apktool_jar,
            "d", "-r", "-o", smali, archive)

        generated = list((smali / "smali" / package).glob("*.smali"))
        if not generated or any(not owned.fullmatch(file.name) for file in generated):
            raise RuntimeError(f"Unexpected classes produced by the {args.component} build")
        names = {file.name for file in generated}
        for file in generated:
            (dest / file.name).write_bytes(file.read_bytes().replace(b"\r\n", b"\n"))
        for file in dest.glob("*.smali"):
            if owned.fullmatch(file.name) and file.name not in names:
                file.unlink()
        print(f"Updated {len(generated)} {args.component} smali classes in {dest}")


if __name__ == "__main__":
    main()
