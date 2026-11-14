# Ratanabá Guardians 2D v0.8.1 — build restaurada 60 FPS

## Entregáveis desta versão
- APK Android assinado: [Google Drive](https://drive.google.com/file/d/1OA6V3RmUKSek6GK6R_ZMgd2hS8k5TWeO/view?usp=drivesdk)
- Código-fonte e assets restaurados (ZIP): [Google Drive](https://drive.google.com/file/d/1wzWbR4DV0BeGWSQkCe2slYM4YNSjQL83/view?usp=drivesdk)

## Conteúdo restaurado no pacote
- 15 salas originais (5 blocos × superior/principal/subterrâneo), mais 4 salas da expansão.
- Banido e Curupira em atlas HD 8×16, cutscenes e VFX.
- Kits de cenário, 3x5 fundos conectados, inimigos, totens, áudio, UI e itens.
- Expansão do Vale das Brasas, Boi-Tatá, Cães de Cinza e Fogos-Fátuos.
- Checkpoint inferior e migração de saves antigos.

## FPS
A simulação usa passo fixo de 1/60 s. A renderização Canvas acumula tempo e desenha no máximo uma vez por intervalo de 16,67 ms. Em telas de 90/120/144 Hz, os callbacks excedentes de requestAnimationFrame não geram quadros extras. O FPS medido é limitado a 60.

## Verificação local registrada
- 10 testes de integridade/progressão/renderização passaram.
- Teste de cadência simulada em tela de 120 Hz: passou (renderização ≤60 FPS).
- APK: 84.736.172 bytes; 198 entradas em assets/ratanaba; 19 salas; chefes Curupira e Boi-Tatá.
- SHA-256 APK: `87387961fa0b10be0f3e6ec3d155cfdd9278c3033254f6fd6b05914cc746cc58`.
- Assinatura JAR v1 SHA256withRSA verificada.
- Não houve teste de instalação em aparelho físico nem verificação de alinhamento zipalign com Android SDK nesta máquina.

## Observação de integração
Este branch registra o limitador de FPS, testes e metadados 0.8.1. O ZIP do Drive é a fonte completa restaurada usada no APK; os binários históricos de arte não foram todos reintroduzidos individualmente na árvore GitHub por este commit.
