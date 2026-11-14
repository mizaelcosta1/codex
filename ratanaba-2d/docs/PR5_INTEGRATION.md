# Resolução dos conflitos de integração do PR #5

A versão principal utilizada como base foi o commit `9ff2c594b00687ad00c8620cd5e99fc218ece331`. As mudanças originais do PR #5 tinham como head `1f864cec14ae5aa2d654d54d723fe33bc2f73383`.

O merge foi montado com a árvore de `main` como base e manteve toda a progressão pós-Curupira do PR #6: Vale das Brasas, câmera vertical, Cães de Cinza, Fogos-Fátuos, altar inferior, Boi-Tatá, e o save de suas duas vitórias.

Do PR #5 foram integrados: analógico virtual proporcional, tutorial após a abertura, cinco baús com alinhamento visual, opacidade do sprite durante a esquiva, minimapa de quatro áreas, loop de simulação com passo fixo de 60 Hz, testes adaptados e versão Android 0.7.0/700.

O antigo portal para o Santuário Oculto foi deliberadamente descartado por conflitar com o Vale das Brasas, que já é a região pós-Curupira. A descida via tecla ↓/S + PULO foi portada para as plataformas finas, sem permitir atravessar pisos sólidos.

Verificação necessária para esta árvore: testes determinísticos, regressão do Vale, testes de navegador e APK Android do workflow `.github/workflows/ratanaba-2d-android.yml`. Nenhum teste em aparelho real foi inferido.
