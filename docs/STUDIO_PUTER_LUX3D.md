# Estúdio integrado: Puter Blender Web + ComfyUI-Lux3D

Abra studio/index.html e mantenha studio/glb-inspector.js ao lado. A página é offline, sem API keys, sem upload e sem geração automática. No desktop também pode servir o repositório com python3 -m http.server 8765 e abrir http://localhost:8765/studio/.

## Integração
1. Puter Blender Web — editor Blender WASM/WebGPU em https://developer.puter.com/labs/blender-web/, usa GPU e memória do dispositivo, NÃO GPU remota.
2. ComfyUI-Lux3D — geração por API externa, G1-Turbo, PBR e saída GLB/ZIP, via notebook notebooks/Ratanaba_Lux3D_Colab.ipynb e prompts em art_source/lux3d_characters.json.
3. Blender completo + BlendRelay/Codex — refinamento high-poly, retopologia, UV, bake de mapas e rig.
4. GLB offline — use o seletor do Studio, obtenha análise estrutural e baixe JSON. Godot e Android ainda exigem testes separados.

## Testes e pendências
- Página Puter e código-fonte HeyPuter/blender-wasm verificados por web e GitHub.
- Fluxo de salvamento .blend observado em demo/src/main.js; teste gráfico da operação ainda PENDENTE.
- Exportação GLB no Puter: NÃO TESTADA no navegador do usuário.
- WebGPU no Android: NÃO TESTADO; a página detecta apenas o navegador local.
- Inspetor de GLB: testes automatizados Node com fixtures sintéticas. Não prova rig funcional ou FPS.
- Lux3D usa conta/chave própria e PODE COBRAR. O notebook tem APRROVE_PAID_LUX3D_REQUEST = False (a variável real chama APPROVE_PAID_LUX3D_REQUEST); nenhum job foi enviado aqui.
- Nenhum GLB de produção foi substituído. APK intacto.

## Teste manual
No Puter, abra Blender, crie e extrude um cubo, salve um arquivo .blend, reabra e tente File > Export > glTF 2.0 (.glb). Se não funcionar, use Blender completo para exportação. Abra o GLB no Studio, gere o relatório, verifique os materiais PBR, UV, rig, animações, LOD e teste importação no Godot 4.6.3 antes do commit de game assets.

Fontes: https://github.com/HeyPuter/blender-wasm; https://github.com/manycore-research/ComfyUI-Lux3D; https://github.com/shefq/blendrelay-mcp.

Os 60 créditos autorizados para Tripo NÃO autorizam cobrança Lux3D.