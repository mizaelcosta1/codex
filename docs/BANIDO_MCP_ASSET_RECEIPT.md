# O Banido — modelo 3D gratuito via Higgsfield 3D Jutsu

**Status:** geração procedural gratuita concluída no MCP, arquivo GLB exportado no projeto Higgsfield. O GLB **ainda não está incluído nos arquivos do repositório**; não substitui o jogador atual da v0.2.0. Sem créditos de Tripo, sem rigging pago.

- Projeto persistente: https://higgsfield.ai/3d-jutsu/318b9b01-24e7-49e4-ac06-6ee5748413a7
- Project ID: `318b9b01-24e7-49e4-ac06-6ee5748413a7`
- Revisão exportada: **3**
- Receita de edição: forma e materiais em `build-banido-shape-and-look-01`; rig e animações em `rig-banido-and-six-nla-clips-01`; otimização em `optimize-banido-mesh-drawcalls-01`.
- Receita de inspeção: `audit-banido-final-r3`
- GLB reportado pelo MCP: **748.036 bytes**, etag `f35e0322b0bdd32b9fba4ad0e6e64bc2`.
- Escala do personagem: **2,38 m**; malha única, 15.076 triângulos, 12 slots de materiais, 17 ossos e vertex groups.
- Animações NLA no arquivo de origem: `banido_Idle`, `banido_Walk`, `banido_Run`, `banido_Attack`, `banido_Hurt`, `banido_Death`.
- Desenho: dreadlocks, torso musculoso, calça escura, arreios de couro e metal, clava de madeira, marcas turquesa luminosas.
- Referência original: `1794033762426.png`, imagem fornecida no projeto; sem incluir a imagem externa no .blend do MCP.
- Materiais: valores PBR procedurais e cores, não mapas de textura fotorrealistas.
- Qualidade real: **blockout estilizado**, sem avaliação visual final e sem teste de importação Godot desta exportação.

## Próxima etapa de integração

1. Exportar o `preview.glb` da revisão 3 dentro do projeto Higgsfield (links de download assinados têm validade curta).
2. Guardar o arquivo como `assets/guardians/banido.glb` em uma branch de integração **sem sobrescrever** os cinco guardiões.
3. Validar estrutura glTF, esqueleto, pesos e seis clips importados pelo Godot. A cena fonte contém câmera e três luzes de render: separar a geometria para exportação de gameplay quando for necessário.
4. Ligar `banido.glb` ao protagonista somente em uma alteração explícita de `scripts/player.gd`; manter o Curupira como fallback.
5. Rodar regressão da campanha e medir desempenho em Android real antes de gerar novo APK.

Esta documentação registra o asset hospedado, não constitui um commit do GLB.
