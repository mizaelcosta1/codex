# APK Android 0.2.0 Preview

A pipeline gratuita .github/workflows/android-preview-apk.yml exporta um APK de depuracao usando Godot 4.6.3, Java 17, Android SDK e templates oficiais no GitHub Actions.

- Version code 2, version name 0.2.0-preview.
- Identificador Android br.com.guardioesdamata.preview (separado da v0.1.0).
- Chave de depuracao temporaria gerada a cada build, **nunca** commitada.
- A preview pode ser instalada ao lado da v0.1.0, mas novas previews podem exigir desinstalacao da preview anterior por alteracao da assinatura.
- Integracao de cinco GLBs com seis animacoes por personagem, em uma vitrine opcional. Esses modelos sao blockouts 3D, nao fotorrealistas.
- Testes Godot de catalogo, vitrine e campanha + verificacoes APK (ZIP, alinhamento, apksigner, aapt, SHA256).
- Download em downloads/guardioes-da-mata-v0.2.0-preview.apk na branch feature/guardians-v0.2-asset-pipeline, quando build e publicacao passarem; alternativa pelo artifact de Actions por 30 dias.
- A compilacao no GitHub nao garante desempenho ou estabilidade no Android fisico. APK debug nao serve para publicacao em loja.
