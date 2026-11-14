#!/usr/bin/env python3
"""Read-only diagnostics for official Google Colab CLI SSH (never print secrets)."""
import json
import platform
import shutil
import subprocess
import sys
from pathlib import Path

def binary(args):
    if not shutil.which(args[0]):
        return {"installed":False}
    try:
        p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=8,check=False)
        return {"installed":True,"ok":p.returncode==0,"output":p.stdout.strip()[:900]}
    except (OSError,subprocess.TimeoutExpired) as e:
        return {"installed":True,"ok":False,"output":type(e).__name__}

def main():
    root="/content" if Path("/content").is_dir() else "/"
    info=shutil.disk_usage(root)
    result={
        "report":"ratanaba_colab_ssh_probe_v1",
        "system":platform.system(),
        "python":platform.python_version(),
        "python_64bit":sys.maxsize>2**32,
        "content_directory":Path("/content").is_dir(),
        "disk_free_gib":round(info.free/(1024**3),2),
        "gpu":binary(["nvidia-smi","--query-gpu=name,memory.total,driver_version","--format=csv,noheader"]),
        "blender":binary(["blender","--version"]),
        "git":binary(["git","--version"]),
        "ready_for_asset_smoke_test":False,
        "note":"Read-only runtime inspection. GLB export and Godot import not tested."
    }
    result["ready_for_asset_smoke_test"]=bool(result["content_directory"] and result["git"].get("ok") and result["blender"].get("ok"))
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=="__main__":
    main()
