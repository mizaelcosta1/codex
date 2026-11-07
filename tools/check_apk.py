"""Audit the packaged APK, architectures, secret exclusions and its digest."""
from pathlib import Path
import zipfile,hashlib,json,subprocess,shutil
root=Path(__file__).resolve().parents[1];apk=root/'build/guardioes-da-mata-debug.apk'
with zipfile.ZipFile(apk) as z:
 names=z.namelist()
 assert z.testzip() is None
 assert all(not any(x in n for x in ['.blend','/tests/','/.agents/','keystore','/.git/']) for n in names)
 abis=sorted({n.split('/')[1] for n in names if n.startswith('lib/')})
 assert abis==['arm64-v8a','x86_64']
print(json.dumps({'bytes':apk.stat().st_size,'sha256':hashlib.file_digest(apk.open('rb'),'sha256').hexdigest(),'architectures':abis,'zip_integrity':'passed'},indent=2))
