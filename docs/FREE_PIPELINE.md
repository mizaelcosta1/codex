# Pipeline 3D gratuita de Guardiões da Mata

**Estado:** protótipo procedural, não APK v0.2.0. A v0.1.0 permanece jogável e não foi substituída.

## Execução sem créditos de IA

O workflow `.github/workflows/free-asset-pipeline.yml` usa somente Blender open-source e GitHub Actions em repositório público. Não faz chamadas pagas a Tripo, Meshy ou NVIDIA.

1. Instala Blender 4.3.2 em um runner Linux de GitHub Actions.
2. Reconstrói os 12 GLBs originais com `tools/build_assets.py`.
3. Roda `tools/validate_assets.py`.
4. Gera o Espírito da Mata a partir de geometria original de Blender Python.
5. Confere o GLB: geometria, UV, pesos, esqueleto e seis animações.
6. Gera áudio original e disponibiliza os modelos em **Actions → Artifacts → folklore-and-guardian-assets**.

O arquivo `assets/guardians/espirito_da_mata.glb` produzido pela CI fica no artifact do job; **não é automaticamente incluído em um commit**. Os quatro personagens restantes continuam sem modelos na branch.

## Primeiro vertical slice: Espírito da Mata

- Fonte autoral: `tools/build_guardian_spirit.py`, sem imagens ou modelos externos.
- Aparência: tronco com casca e musgo, núcleo incandescente, galhos, olhos brilhantes, braços e pernas de raiz.
- Rig: 11 ossos; deformação rígida por peça.
- Clips NLA previstos: Idle, Walk, Run, Attack, Hurt, Death.
- Orçamento máximo: 18.000 triângulos.
- Tipo de entrega: **blockout estilizado**, ainda não fotorealista, não revisado em Godot.

## Como executar quando houver Blender

    blender --background --factory-startup --python tools/build_guardian_spirit.py
    python3 tools/validate_guardian_spirit.py

## Critérios antes da próxima versão Android

Verificar os logs da CI, baixar o artifact, inspecionar o modelo em Blender, validar importação e animação no Godot 4.6.3, corrigir pesos e materiais, medir desempenho no Android físico e só então integrar gameplay e exportar APK.

O Bruto do Exílio, Serpente de Fogo, Ceifador e Guardião Réptil devem ser produzidos em entregas posteriores. A serpente requer rig e movimentos segmentados próprios.
