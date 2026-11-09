# Ratanabá Guardians — Crônicas do Exílio 2D

Cliente 2D RPG/metroidvania 0.5 com três áreas, oito inimigos comuns, Curupira, combate, quatro elementos, mochila, raridades, mana e evolução por aura. Este projeto está separado do protótipo Godot 3D na raiz do repositório.

## Jogar no navegador

Abra `web/index.html` mantendo a pasta assets no lugar, ou rode `python3 -m http.server 8000` nesta pasta e acesse `/web/`. Sem dependências JavaScript externas em execução. B abre a mochila; N abre aura; U conjura magia; J/L atacam; K esquiva; Espaço pula.

## Android

O aplicativo Android offline empacota estes mesmos arquivos em uma WebView. Instruções em `android-native/README.md`. O APK de teste usa um pacote separado do protótipo 3D antigo.

## Verificação

Os testes de navegador estão em web/tests. Requerem Playwright/Chromium apenas no desenvolvimento; não são dependências do jogo. Os testes unitários podem ser executados com Node sem instalar pacotes:

```sh
node web/tests/test_engine_regressions.cjs\nnode web/tests/preflight.cjs
node web/tests/test_rpg_unit.cjs
node web/tests/test_animation_unit.cjs
```

Execute os quatro testes Playwright para combate, HUD, menus e RPG. Os relatórios da revisão anterior estão em docs/validation; os novos relatórios Android discriminam o que foi executado nesta entrega.

## Arte e escopo

Os arquivos de arte WebP são os assets efetivamente usados no jogo, criados com image_gen a partir da direção do projeto e referências fornecidas pelo usuário. A procedência e os prompts estão documentados em docs. O pack de produção separado preserva originais e PNGs individuais; não é necessário para jogar nem compilar o aplicativo. A animação ainda usa poses geradas de protótipo, com seis quadros por ação. Não há reivindicação de arte CC0 ou de licença de terceiros não verificada.
