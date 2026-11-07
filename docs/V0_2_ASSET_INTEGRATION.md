# Guardioes da Mata v0.2 - integracao progressiva de personagens

A arte cinematografica fotorrealista da conversa e uma referencia visual, nao um modelo 3D ou textura. O pipeline atual gera cinco blockouts estilizados com Blender Python e seis animacoes por personagem.

## Producao
- Espirito da Mata: tools/build_guardian_spirit.py
- Bruto do Exilio, Ceifador, Guardiao Reptil e Serpente de Fogo: tools/build_guardian_roster.py
- GLBs gerados: assets/guardians/<id>.glb
- Validacao estrutural: tools/validate_guardian_spirit.py e tools/validate_guardian_roster.py
- A serpente possui rig segmentado; os outros personagens usam rig humanoide com extensao de cauda quando necessaria.

## Runtime
- scripts/guardian_asset_catalog.gd fornece caminhos e metadados.
- scripts/guardian_showcase.gd instancia somente os modelos GLB disponiveis e inicia Idle.
- scripts/game.gd posiciona a vitrine sem colisoes ou mudancas no combate e nos tres santuarios.
- tests/test_guardian_showcase.gd testa o carregamento opcional no Godot.

## Publicacao
O GitHub Actions gera e valida os cinco GLBs. Apos sucesso, publica os arquivos gerados somente na branch feature/guardians-v0.2-asset-pipeline usando commit com skip ci para evitar loop; main e o APK v0.1.0 permanecem intactos.

## Limites
A validacao da estrutura GLB nao garante a qualidade visual, deformacao, estabilidade, desempenho no Android ou jogo v0.2.0. Antes do lancamento e necessario importar no Godot 4.6.3, rodar todos os testes de gameplay e medir FPS e RAM em celular fisico.
