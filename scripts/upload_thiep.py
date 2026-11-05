#!/usr/bin/env python3
"""Upload thiep-cuoi-online project files to Vercel (dedup by SHA1) and write
/tmp/thiep_manifest.json for create_deployment.

Re-created 2026-11-05 after /tmp was wiped (the old /tmp/upload_thiep.py was
lost). Kept in the repo so it survives VM/tmp cleanups.
Usage: python3 scripts/upload_thiep.py
"""
import base64
import hashlib
import json
import os
import subprocess
import sys

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERCEL_BIN = "/opt/hatch/bin/vercel"
MANIFEST_PATH = "/tmp/thiep_manifest.json"

EXCLUDE_DIRS = {".git", ".next", "node_modules"}
EXCLUDE_FILES = {"package-lock.json", ".gitignore"}


def collect_files():
    out = []
    for root, dirs, files in os.walk(PROJECT):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDE_DIRS)
        for name in sorted(files):
            if name in EXCLUDE_FILES:
                continue
            full = os.path.join(root, name)
            rel = os.path.relpath(full, PROJECT)
            out.append((rel, full))
    return out


def upload(rel, data):
    sha1 = hashlib.sha1(data).hexdigest()
    args = {
        "requestBody": base64.b64encode(data).decode(),
        "contentLength": len(data),
        "xVercelDigest": sha1,
    }
    proc = subprocess.run(
        [VERCEL_BIN, "call-tool", "--name", "upload_file",
         "--arguments-json", json.dumps(args)],
        capture_output=True, text=True, timeout=120,
    )
    if proc.returncode != 0:
        print(f"FAIL {rel}: {proc.stdout[:300]}{proc.stderr[:300]}", file=sys.stderr)
        raise SystemExit(1)
    print(f"ok {rel} {len(data)}")
    return {"file": rel, "sha": sha1, "size": len(data)}


def main():
    manifest = []
    for rel, full in collect_files():
        with open(full, "rb") as f:
            manifest.append(upload(rel, f.read()))
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f)
    print(f"manifest: {len(manifest)}")


if __name__ == "__main__":
    main()
