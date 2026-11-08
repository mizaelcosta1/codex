#!/usr/bin/env python3
"""Build a self-contained, debug-signed Android APK without Gradle/Maven.
Requires official Android platform35 + build-tools35.0.1 and Java17+ compiler.
"""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, sys, zipfile

ROOT=Path(__file__).resolve().parents[1]

def run(args,**kwargs):
    result=subprocess.run([str(a) for a in args],text=True,capture_output=True,**kwargs)
    if result.stdout.strip():print(result.stdout.strip())
    if result.stderr.strip():print(result.stderr.strip(),file=sys.stderr)
    result.check_returncode()
    return result.stdout

def runtime_files():
    files=[]
    for name in ('index.html','game.js','menu.js','hud.js','animations.js','rpg.js','native-bridge.js','style.css','hud.css','rpg.css'):
        files.append(ROOT/'web'/name)
    for folder in ('pack','ui_v03','hud_v04','animations_v05','rpg_v05'):
        files += sorted((ROOT/'assets'/folder).glob('*.webp'))
    for folder,extension in (('pack/audio','*.wav'),('pack/items','*.svg'),('pack/ui','*.svg')):
        files += sorted((ROOT/'assets'/folder).glob(extension))
    return files

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--sdk',default=os.environ.get('ANDROID_SDK_ROOT') or os.environ.get('ANDROID_HOME'))
    parser.add_argument('--out',default=str(ROOT/'build/android/ratanaba-guardians-2d-v0.5.1-debug.apk'))
    parser.add_argument('--keystore',default=os.environ.get('RATANABA_DEBUG_KEYSTORE') or str(ROOT.parent/'.privateandroid/guardians2d-debug.jks'))
    args=parser.parse_args()
    if not args.sdk:parser.error('--sdk /path/to/android-sdk is required')
    sdk=Path(args.sdk).resolve();tools=sdk/'build-tools/35.0.1';android=sdk/'platforms/android-35/android.jar'
    for path in [android]+[tools/x for x in ('aapt2','aapt','d8','zipalign','apksigner')]:
        if not path.is_file():raise SystemExit('Missing SDK component: '+str(path))
    out=Path(args.out).resolve();build=out.parent;build.mkdir(parents=True,exist_ok=True)
    work=build/'work'
    if work.exists():shutil.rmtree(work)
    work.mkdir();asset_root=work/'assets';bundle=asset_root/'ratanaba';bundle.mkdir(parents=True)
    original_manifest={}
    for source in runtime_files():
        if not source.is_file():raise SystemExit('Missing runtime input: '+str(source))
        relative=source.relative_to(ROOT);target=bundle/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
        original_manifest[str(relative)]=hashlib.sha256(source.read_bytes()).hexdigest()
    index=bundle/'web/index.html';text=index.read_text()
    injected='native-bridge.js' not in text
    if injected:index.write_text(text.replace('</body>','<script src="native-bridge.js"></script></body>'))
    # Check literal HTML/CSS references against the bundle before compilation.
    for source in (bundle/'web/index.html',bundle/'web/style.css',bundle/'web/hud.css',bundle/'web/rpg.css'):
        contents=source.read_text()
        refs=re.findall(r'(?:src|href)="([^"]+)"',contents) if source.suffix=='.html' else re.findall(r'url\([\'\"]?([^\)\'\"]+)',contents)
        for reference in refs:
            if reference.startswith(('#','data:','http')):continue
            target=(source.parent/reference).resolve()
            if not target.is_relative_to(bundle.resolve()) or not target.is_file():raise SystemExit('Unresolved bundled reference: '+str(source)+' '+reference)
    manifest={str(f.relative_to(asset_root)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(bundle.rglob('*')) if f.is_file()}
    (asset_root/'bundle-manifest.json').write_text(json.dumps({'version':'0.5.1','files':manifest,'native_bridge_injected':injected},indent=2)+'\n')
    classes=work/'classes';classes.mkdir();generated=work/'generated';generated.mkdir()
    compiled=work/'resources.zip';native=ROOT/'android-native'
    run([tools/'aapt2','compile','--dir',native/'res','-o',compiled])
    resource_apk=work/'resources.ap_'
    run([tools/'aapt2','link','-o',resource_apk,'-I',android,'--manifest',native/'AndroidManifest.xml','--min-sdk-version','26','--target-sdk-version','35','--version-code','501','--version-name','0.5.1','--auto-add-overlay','-A',asset_root,'--java',generated,compiled])
    sources=sorted((native/'src').rglob('*.java'))+sorted(generated.rglob('*.java'))
    compiler=[shutil.which('javac')] if shutil.which('javac') else ['java','-m','jdk.compiler/com.sun.tools.javac.Main']
    run(compiler+['-encoding','UTF-8','-source','8','-target','8','-bootclasspath',str(android),'-d',str(classes)]+[str(f) for f in sources])
    class_jar=work/'classes.jar'
    with zipfile.ZipFile(class_jar,'w',zipfile.ZIP_DEFLATED) as z:
        for file in sorted(classes.rglob('*.class')):z.write(file,file.relative_to(classes))
    dex=work/'dex';dex.mkdir();run([tools/'d8','--lib',android,'--min-api','26','--output',dex,class_jar])
    unsigned=work/'unsigned.apk';shutil.copy2(resource_apk,unsigned)
    with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
    aligned=work/'aligned.apk';run([tools/'zipalign','-f','-p','4',unsigned,aligned])
    key=Path(args.keystore).resolve();key.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    if not key.exists():
        run(['keytool','-genkeypair','-noprompt','-keystore',key,'-storetype','JKS','-storepass','android','-keypass','android','-alias','androiddebugkey','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=Ratanaba Android Debug,O=Ratanaba Guardians,C=BR'])
    key.chmod(0o600)
    run([tools/'apksigner','sign','--ks',key,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--v1-signing-enabled','true','--v2-signing-enabled','true','--v3-signing-enabled','true','--v4-signing-enabled','false','--out',out,aligned])
    signature=run([tools/'apksigner','verify','--verbose','--print-certs',out]);(build/'signature.txt').write_text(signature)
    run([tools/'zipalign','-c','-v','4',out])
    badging=run([tools/'aapt','dump','badging',out]);(build/'badging.txt').write_text(badging)
    permissions=run([tools/'aapt','dump','permissions',out]);(build/'permissions.txt').write_text(permissions)
    assert "name='br.com.ratanaba.guardians2d'" in badging
    assert "versionCode='501'" in badging and "versionName='0.5.1'" in badging
    assert 'android.permission.INTERNET' not in permissions
    assert "sdkVersion:'26'" in badging and "targetSdkVersion:'35'" in badging
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        assert z.read('classes.dex').startswith(b'dex\n')
        for filename,digest in manifest.items():assert hashlib.sha256(z.read('assets/'+filename)).hexdigest()==digest,filename
        assert b'RatanabaRPG' in z.read('assets/ratanaba/web/rpg.js')
        assert b'RatanabaAnimations' in z.read('assets/ratanaba/web/animations.js')
    report={'package':'br.com.ratanaba.guardians2d','version_name':'0.5.1','version_code':501,'min_sdk':26,'target_sdk':35,'apk_bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'asset_count':len(manifest),'checks':{'dex_magic':True,'zip_integrity':True,'signature_verified':True,'zip_alignment':True,'runtime_asset_hashes':True,'manifest_package_version_sdk':True,'no_internet_permission':True,'literal_html_css_dependencies':True},'signing':'Development debug certificate, not Play Store production signing','device_test':'Not run: no connected Android device/emulator available','native_bridge_injected':injected}
    (build/'android_validation.json').write_text(json.dumps(report,indent=2)+'\n');(build/'SHA256SUMS.txt').write_text(report['sha256']+'  '+out.name+'\n')
    print(json.dumps(report,indent=2));print('APK='+str(out))

if __name__=='__main__':main()
