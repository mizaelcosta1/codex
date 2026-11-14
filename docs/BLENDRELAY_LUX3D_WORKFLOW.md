# Ratanabá Guardians — Pipeline Lux3D + BlendRelay MCP

**Implementação preliminar, sem gasto de créditos.** Não foram produzidos GLBs pela Lux3D neste commit.

## Papéis

- **Lux3D** ([ComfyUI-Lux3D](https://github.com/manycore-research/ComfyUI-Lux3D), MIT): geração image-to-3D/text-to-3D via **API externa**, modelo `G1-Turbo`, até 300 mil faces solicitadas, opção PBR e saída GLB/ZIP.
- **BlendRelay** ([blendrelay-mcp](https://github.com/shefq/blendrelay-mcp), MIT/GPL-3.0-or-later): controla Blender 4.5+ por MCP para modelagem, materiais, animação, inspeções e render. Exige **Blender gráfico aberto e conectado**, Codex CLI ou outro agente e `uvx`.

**Atenção:** Lux3D não é geração local grátis ilimitada. Requer conta e chave própria. As 60 unidades de crédito anteriormente autorizadas eram somente para **Tripo H3.1**, não servem de autorização de gastos da Lux3D. Nenhum job pago foi enviado.

## Windows + Codex CLI (BlendRelay)

1. Instale Blender 4.5+ e execute-o uma vez.
2. Instale `uvx` e utilize seu Codex CLI autenticado.
3. No PowerShell, execute o script do projeto: `./tools/Setup-BlendRelay-Windows.ps1`. Ele instala o add-on e registra o MCP local.
4. Reinicie Blender, habilite **BlendRelay MCP**, pressione **N** no Viewport, abra **BlendRelay** e clique **Connect**.
5. Use `codex mcp list` e `uvx blendrelay-mcp doctor` para confirmar a conexão.

**Conexão:** esse MCP opera a sessão local do Blender, não a janela remota do Higgsfield 3D Jutsu, e não é acessível diretamente deste chat enquanto estiver desconectado. O Google Colab pode fazer requisições Lux3D, mas não substitui uma sessão Blender GUI com BlendRelay.

## Colab + Lux3D

Abra `notebooks/Ratanaba_Lux3D_Colab.ipynb` no Colab. O notebook consulta as especificações sem gerar. A API internacional usa `LUX3D_API_KEY_INTL`, armazenada em **Colab Secrets** (nunca salve credenciais no código/GitHub). Para começar, uma geração deve ser especificamente aprovada após conferência de cobrança. Escolha **Banido** primeiro.

## Especificação para os 6 personagens

`art_source/lux3d_characters.json` contém os seis prompts, opções comuns `G1-Turbo`, PBR, 200.000 faces na **fonte** e limites separados de malhas finais para Android.

## Prompt para o BlendRelay conectado

> Importe o novo GLB do Banido em uma coleção SOURCE_LOCKED. Nunca sobrescreva o asset jogável atual. Corrija escala e silhueta, refine pele, dreadlocks, couro, runas e clava. Inspecione erros de topologia; faça UV e bake de material PBR, forneça LOD0 com no máximo 45k triângulos, LOD1 ~20k e LOD2 ~7k. Gere renders frontal, perfil e costas. Não execute serviços pagos de rigging. Salve uma cópia .blend e um GLB candidato separados; inclua relatório de auditoria.

## Etapas de aceitação para Godot 4.6.3

1. Modelo candidato GLB baixado e licença revisada.
2. Requisitos de identidade: pés invertidos Curupira, chama azul Boitatá, Mula totalmente sem cabeça, etc.
3. PBR com mapas reais e UV; bake de normal e ORM para Android.
4. Retopologia, LOD e redução de draw calls; nunca usar malha high-poly diretamente no APK.
5. Rig/skeleton e seis animações confirmados por modelo; serpente e quadrúpede exigem rigs personalizados.
6. Importação, regressão, inspeção visual e benchmark em Android físico.

Os GLBs atuais continuam preservados. Não substituir `assets/guardians/*.glb` nem recompilar APK automaticamente antes dessas etapas.
