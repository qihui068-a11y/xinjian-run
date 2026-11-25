"""Compile the LAN Java sources into the smali used by the Apktool build."""

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
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    package = Path("tt/xinjian/cn")
    dest = source.parents[1] / "modified/smali" / package
    owned = re.compile(r"Lan(?:Bridge|Transport)(?:\$[\w$-]+)?\.smali")

    def jdk(program):
        if not args.java_bin:
            return program
        return str(args.java_bin / program)

    def run(*command):
        subprocess.run([str(part) for part in command], check=True)

    with TemporaryDirectory(prefix="xinjian-lan-") as path:
        work = Path(path)
        classes = work / "classes"
        dex = work / "dex"
        smali = work / "smali"
        jar = work / "lan.jar"
        archive = work / "lan.apk"
        classes.mkdir()
        dex.mkdir()
        run(jdk("javac"), "--release", "8", "-Xlint:-options", "-encoding", "UTF-8", "-classpath", args.android_jar, "-d", classes,
            source / package / "LanBridge.java", source / package / "LanTransport.java")
        run(jdk("jar"), "cf", jar, "-C", classes, ".")
        run(jdk("java"), "-cp", args.r8_jar, "com.android.tools.r8.D8", "--min-api", "21",
            "--lib", args.android_jar, "--output", dex, jar)
        with ZipFile(archive, "w") as bundle:
            bundle.write(dex / "classes.dex", "classes.dex")
        run(jdk("java"), "-Dfile.encoding=UTF-8", "-jar", args.apktool_jar,
            "d", "-r", "-o", smali, archive)

        generated = list((smali / "smali" / package).glob("*.smali"))
        if not generated or any(not owned.fullmatch(file.name) for file in generated):
            raise RuntimeError("Unexpected classes produced by the LAN build")
        names = {file.name for file in generated}
        for file in generated:
            (dest / file.name).write_bytes(file.read_bytes().replace(b"\r\n", b"\n"))
        for file in dest.glob("Lan*.smali"):
            if owned.fullmatch(file.name) and file.name not in names:
                file.unlink()
        print(f"Updated {len(generated)} LAN smali classes in {dest}")


if __name__ == "__main__":
    main()
