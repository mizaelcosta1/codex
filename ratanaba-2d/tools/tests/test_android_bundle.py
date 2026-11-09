"""Catch missing offline dependencies before installing the Android SDK."""
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location('build_android', Path(__file__).parents[1] / 'build_android.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class AndroidBundleTests(unittest.TestCase):
    def test_staged_runtime_contains_html_css_and_script_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest, injected = build.prepare_bundle(root)
            self.assertFalse(injected)
            for name in ['web/elemental.js', 'web/world.js', 'assets/chest_rarities.svg']:
                self.assertIn('ratanaba/' + name, manifest)
            for source in (root / 'ratanaba/web').glob('*.js'):
                # Static image/audio paths are not included in the HTML/CSS scan.
                for reference in re.findall(r"['\"](\.\./assets/[^'\"]+\.(?:webp|svg|wav))['\"]", source.read_text()):
                    self.assertTrue((source.parent / reference).is_file(), f'{source.name}: {reference}')
            self.assertEqual(json.loads((root / 'bundle-manifest.json').read_text())['version'], build.VERSION_NAME)

    def test_missing_runtime_input_fails_before_compilation(self):
        original = build.runtime_files
        try:
            build.runtime_files = lambda: original() + [build.ROOT / 'web/missing.js']
            with tempfile.TemporaryDirectory() as directory:
                with self.assertRaisesRegex(SystemExit, 'Missing runtime input'):
                    build.prepare_bundle(Path(directory))
        finally:
            build.runtime_files = original

    def test_version_agrees_with_native_manifest(self):
        manifest = ET.parse(build.ROOT / 'android-native/AndroidManifest.xml').getroot()
        ns = '{http://schemas.android.com/apk/res/android}'
        self.assertEqual(manifest.get(ns + 'versionName'), build.VERSION_NAME)
        self.assertEqual(int(manifest.get(ns + 'versionCode')), build.VERSION_CODE)


if __name__ == '__main__':
    unittest.main()
