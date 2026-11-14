# Ratanabá Guardians — Produção High-Poly v0.1

**Estado em 2026-11-07:** início de escultura procedural gratuita no Higgsfield 3D Jutsu (Blender 5.2 remoto). Os projetos são fontes editáveis, **não** substituições game-ready de assets do Android. Nenhum crédito Tripo foi utilizado para estes dois modelos.

## 1. Banido — fonte high-poly
- Projeto: https://higgsfield.ai/3d-jutsu/318b9b01-24e7-49e4-ac06-6ee5748413a7
- Revisão 6 (HP): `SCL_Banido_HP`, cópia independente da malha low-poly protegida `HERO_Banido_Skinned`.
- 247.392 triângulos avaliados no viewport com Catmull-Clark em nível 2; no render, nível 3 (densidade maior, valor exato ainda não medido).
- 124.056 vértices avaliados no viewport; 12 materiais com microdetalhe procedural via Noise/Bump e relevo localizado na pele.
- Fonte Blender .blend armazenada no 3D Jutsu; GLB de prévia reportado em 7.215.928 bytes. O glTF pode não preservar todos os nós procedurais.
- Revisão do enquadramento publicada: `hp-banido-render-review-v1` (330 × 440 px).
- Situação: HP procedural inicial; anatomia, qualidade de superfície, topologia e apresentação ainda precisam de revisão artística humana.

## 2. Curupira — fonte high-poly
- Projeto: https://higgsfield.ai/3d-jutsu/73f7d041-80b1-4444-85c0-55567356e6b7
- Revisão 1 (HP): 452.640 triângulos avaliados no viewport, subdivisão não destrutiva nível 2.
- 236 objetos de geometria, 13 materiais procedurais (pele, pigmentos, cabelo vermelho, folhagem, madeira, cipós, metal e olhos emissivos).
- Pés criados com dedos direcionados para trás, 38 grupos de cabelo vermelho; alto contraste, materiais físicos e luz de estúdio.
- GLB de visualização reportado em 9.814.924 bytes; exportado pelo serviço. Arquivo .blend editável permanece no projeto.
- Render de inspeção: `curupira-hp-render-review-v1` (231 × 330 px).
- Situação: HP procedural inicial. A malha de escultura possui múltiplas peças e **não tem rig de produção**.

## Próximos personagens
- Boitatá: serpente colossal de obsidiana, fogo psíquico **azul**, material cristalino e anatomia serpentina.
- Mula sem Cabeça: equino blindado sem cabeça, chama azul saindo do pescoço, rig quadrúpede.
- Boto: humanoide do rio, duas formas (humana e leviatã), com tecido, couro e água emissiva.
- Matinta Pereira: anciã espectral, penas escuras, cabelo branco e assobio de ataque.

## Definition of Done para cada personagem
1. Referência de arte e ortográficas: frente, perfil, costas, detalhe de materiais e proporções.
2. Malha high-poly fonte (.blend), sem componentes flutuantes, com detalhe visível e materiais por função.
3. UV e bake PBR para baixo-polígono: Base Color, Normal, ORM e Emissive; máx 1–2K no Android.
4. Retopologia game-ready (alvo inicial 20–50 mil triângulos por protagonista/chefe), LOD0/1/2 e draw calls controlados.
5. Rig, skinning e animações auditados individualmente; o rig é diferente para serpente e equino.
6. Importação de GLB no Godot 4.6.3, testes, inspeção visual e FPS no Android real.
7. Substituição dos GLBs atuais **somente após** validação integral; preservar modelos antigos na história Git.

**Importante:** Catmull-Clark e materiais procedurais elevam a densidade e o detalhe de uma base de modelagem; não garantem fotorrealismo nem um sculpt AAA. A fase high-poly ainda requer refinamento anatômico/artístico, bake e otimização.
