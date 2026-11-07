# Assets 3D previstos — Guardiões da Mata v0.2.0

Esta pasta é o ponto de entrada **futuro** para os cinco personagens da nova etapa visual.
Nenhum modelo ou animação foi gerado, importado ou aprovado por este commit.

## Contrato de nomes

| Identificador | Caminho futuro |
|---|---|
| espirito_da_mata | assets/guardians/espirito_da_mata.glb |
| bruto_do_exilio | assets/guardians/bruto_do_exilio.glb |
| serpente_de_fogo | assets/guardians/serpente_de_fogo.glb |
| ceifador | assets/guardians/ceifador.glb |
| guardiao_reptil | assets/guardians/guardiao_reptil.glb |

As especificações e clips exigidos ficam em scripts/guardian_asset_catalog.gd.

## Antes de adicionar um GLB

- Confirmar autoria/licença e registrar a procedência das imagens usadas.
- Criar views isoladas e coerentes do mesmo personagem; não usar o pôster com cinco personagens como entrada única.
- Exportar malha com UV, materiais PBR, rig apropriado e escala em metros.
- Verificar orientação e raiz Node3D, Skeleton3D, AnimationPlayer, nomes de clips e colisão.
- Reduzir triângulos e texturas ao orçamento do catálogo; efeitos de fogo/fumaça ficam em partículas/VFX separados.
- Executar importação no Godot 4.6.3 e medir FPS, memória e estabilidade no Android físico.
- Só depois de validar, integrar spawn, IA e combate na cena principal.

O carregamento é opcional: arquivos ausentes não interrompem o jogo v0.1.0.
