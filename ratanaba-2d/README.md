# Ratanabá Guardians — Crônicas do Exílio 2D

Cliente 2D RPG/metroidvania 0.5 com três áreas, oito inimigos comuns, Curupira, combate, quatro elementos, mochila, raridades, mana e evolução por aura. Este projeto está separado do protótipo Godot 3D na raiz do repositório.

## Expansão em desenvolvimento: Vale das Brasas

Após derrotar o Curupira e avançar para a direita, o Banido pode descer por plataformas até a quarta região, **Vale das Brasas**. O limite anterior de fim da primeira vigília foi removido. A nova arena contém Cães de Cinza e Fogos-Fátuos, além do Boi-Tatá, uma serpente colossal representada proceduralmente no fundo do cenário. O chefe alterna ataques sinalizados (presas, faixas de fogo, varredura e chuva de brasas); a cabeça fica vulnerável durante o intervalo de recuperação. O combate usa os controles já existentes. Há um altar no Vale para salvar o retorno.

A transição entre os fundos utiliza mistura gradual em torno de x=1900, x=3900 e x=6500, enquanto a câmera acompanha a descida vertical. O combate e a vitória do Boi-Tatá são persistidos na chave existente do save, preservando o progresso antigo do Curupira.

Validação determinística dedicada: `node web/tests/test_vale_das_brasas.cjs`. Esta expansão ainda requer avaliação visual e de desempenho em dispositivo Android real antes de ser considerada arte definitiva ou pronta para lançamento.

## Jogar no navegador

Abra `web/index.html` mantendo a pasta assets no lugar, ou rode `python3 -m http.server 8000` nesta pasta e acesse `/web/`. Sem dependências JavaScript externas em execução. B abre a mochila; N abre aura; U conjura magia; J/L atacam; K esquiva; Espaço pula.

## Android

O aplicativo Android offline empacota estes mesmos arquivos em uma WebView. Instruções em `android-native/README.md`. O APK de teste usa um pacote separado do protótipo 3D antigo.

## Verificação

Os testes de navegador estão em web/tests. Requerem Playwright/Chromium apenas no desenvolvimento; não são dependências do jogo. Os testes unitários podem ser executados com Node sem instalar pacotes:

```sh
node web/tests/preflight.cjs
node web/tests/test_rpg_unit.cjs
node web/tests/test_animation_unit.cjs
```

Execute os quatro testes Playwright para combate, HUD, menus e RPG. Os relatórios da revisão anterior estão em docs/validation; os novos relatórios Android discriminam o que foi executado nesta entrega.

## Arte e escopo

Os arquivos de arte WebP são os assets efetivamente usados no jogo, criados com image_gen a partir da direção do projeto e referências fornecidas pelo usuário. A procedência e os prompts estão documentados em docs. O pack de produção separado preserva originais e PNGs individuais; não é necessário para jogar nem compilar o aplicativo. A animação ainda usa poses geradas de protótipo, com seis quadros por ação. Não há reivindicação de arte CC0 ou de licença de terceiros não verificada.
