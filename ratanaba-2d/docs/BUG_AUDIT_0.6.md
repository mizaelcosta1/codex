# Revisão de bugs 0.6 — 8 de novembro de 2026

Base analisada: `5c1ba6cd4a7b9349a808210f81efd1cb211b8088`, pasta `ratanaba-2d`.

## Bugs reproduzidos e correções

| Problema | Evidência e correção |
| --- | --- |
| Magia intercepta a cura no HUD | Workflow Android `42498353392`, job `128785494841`, falha de hit testing em `.orb-heal`. A regra adicionada na 0.6 trocava `.action-pad` de absoluto para relativo. Restaurado posicionamento e separado o botão de defesa dos demais. |
| Morte nas raízes pode interromper o jogo | Três hazards vencidos no mesmo frame: o primeiro dano letal limpa a lista, mas a iteração acessava `undefined.t`. A iteração termina quando a morte substitui a lista. |
| Saques sobrevivem ao respawn | Matar monstro e morrer deixava `state.drops` na vida seguinte. Agora os saques soltos são limpos junto aos demais objetos transitórios. |
| Selo parcial perde progresso | Ativar só um selo não gravava o save. Cada ativação agora persiste a progressão imediatamente. |
| Baús não acompanham a câmera | O terceiro baú era desenhado em x=4708 com câmera=4250. Corrigido para x=458, na mesma transformação usada pelos objetos do mundo. |
| Pacote Android omite dependências | A lista de runtime não incluía `web/elemental.js` nem `assets/chest_rarities.svg`. Incluídos e cobertos por validação de pacote sem depender do SDK. |
| APK anuncia versão anterior | Nome, metadados e validação ainda usavam 0.5.1/501 apesar do workflow 0.6. Agora usam 0.6.0/600 e teste de consistência com o manifesto nativo. |

## Verificação

Os quatro testes novos do motor falharam na base original e passaram após as correções. Os testes unitários existentes de elementos, RPG, animações, bridge nativa e o preflight também passaram localmente. Três verificações de empacotamento passaram usando o runtime real copiado para uma pasta temporária.

O teste de HUD agora verifica os alvos reais de toque em 1280×720, 844×390 e 390×844, incluindo sobreposição entre defesa e ações. O workflow passa a executar também em pull requests e inclui os novos testes.

O Chromium local não iniciou por restrição de sockets Unix; os resultados de navegador e compilação devem ser confirmados no workflow da branch de correção. Não foi realizado teste em aparelho Android físico.
