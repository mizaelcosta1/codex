# Guardiões da Mata — início da produção de personagens v0.2.0

**Estado:** preparação técnica, sem APK v0.2.0 gerado. A v0.1.0 permanece a versão jogável.

## Proposta de cinco personagens

| ID | Direção de arte | Rig esperado | Animações mínimas |
|---|---|---|---|
| espirito_da_mata | Corpo de casca, raízes e folhas, rachaduras com brasas | Humanoide + VFX de fogo | Idle, Walk, Run, Attack, Hurt, Death |
| bruto_do_exilio | Guerreiro corpulento, pele marcada, adereços de couro e cachimbo | Humanoide | Idle, Walk, Run, Attack, Hurt, Death |
| serpente_de_fogo | Serpente negra vulcânica, fissuras incandescentes e olhos âmbar | Cadeia segmentada, **não** rig humanoide | Idle, Move, Bite, Fire, Hurt, Death |
| ceifador | Figura encapuzada, vestes pretas, mãos alongadas, sombras | Humanoide + VFX de tecido | Idle, Walk, Attack, Cast, Hurt, Death |
| guardiao_reptil | Sentinela reptiliana com armadura ancestral e cauda | Humanoide com ossos extras na cauda | Idle, Walk, Run, Attack, Hurt, Death |

## Contrato de produção Android

- Godot 4.6.3, renderizador GL Compatibility; manter compatibilidade com OpenGL ES 3.
- Os cinco nomes de arquivos GLB são definidos em assets/guardians/README.md.
- Orçamento inicial por personagem: 16–20 mil triângulos, textura PBR até 2048 px, conforme catálogo em GDScript.
- Planejar LODs para personagens distantes, compressão adequada para Android e VFX separados da malha.
- Para animações, testar deformação real de malha, pesos de pele, transições e root motion; não inferir animações de imagens estáticas.
- A serpente requer esqueleto corporal segmentado e animações próprias; movimentos humanoides não são equivalentes.
- Não substituir Curupira, Cuca ou outros modelos atuais sem uma etapa explícita de aprovação de gameplay.

## Fluxo de produção e critérios de aceite

1. Gerar pranchas individuais neutras e múltiplos ângulos a partir das referências fornecidas.
2. Aprovar separadamente custos de créditos de modelos 3D/rigging antes de enviar jobs pagos.
3. Criar GLBs e baixar os resultados de cada provider; registrar origem, preço, licença e IDs de job.
4. Conferir geometria, PBR, rig, clips e escala; corrigir com Blender se necessário.
5. Incorporar somente GLBs reais e validados em assets/guardians/.
6. Ligar spawn, IA, combate e visual aos personagens; criar testes funcionais da nova versão.
7. Testar importação pelo Godot, exportação APK, performance no emulador e no Android físico.

## Estado verificado ao preparar o commit

- Repositório main utiliza Godot 4.6.3; a v0.1.0 inclui 12 modelos GLB existentes.
- Higgsfield oferece geradores Tripo/Meshy e rigging; a consulta não executou geração.
- Prévia de preço obtida do Higgsfield: Meshy text-to-3D, 25 créditos por job; rigging com uma animação, 8 créditos por job. Valores são apenas cotações de consulta.
- Este ambiente não dispõe do executável game-dev, Godot nem Blender.
- **Os cinco novos GLBs permanecem ausentes**, e não houve teste de engine, build Android ou medição de desempenho para esta etapa.

## Teste do catálogo

Com o projeto importado no Godot 4.6.3:

    godot --headless --path . --script res://tests/test_guardian_asset_catalog.gd

A classe scripts/guardian_asset_catalog.gd disponibiliza ids(), spec(), path_for(), missing_ids() e load_available(). O script principal apenas carrega recursos presentes para game.guardian_models, mantendo intacto o conjunto de 12 modelos e a lógica de gameplay da v0.1.0.
