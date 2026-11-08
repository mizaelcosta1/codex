# Versão web 0.5 — RPG, mochila, aura e animações

Abra **web/index.html** após extrair a pasta inteira. **B** abre a mochila; **N** abre a evolução de aura nos altares. Manual e probabilidades em `docs/CHANGELOG_0.5.md`.

# Atualização 0.4: HUD de referência e cut-scenes

Veja `docs/CHANGELOG_0.4.md` para os novos controles e diálogos. Enter/Espaço/E revelam e avançam falas; Pular Cena retoma o jogo. Na clava por toque: toque curto para golpe leve; segure para pesado.

# Ratanabá — primeira vigília, cliente jogável web 0.3

Abra `web/index.html` em um navegador atual, mantendo a pastas `assets/pack` e `assets/ui_v03` no nível superior. Para testar via HTTP, execute na raiz do projeto `python3 -m http.server 8000` e abra `http://localhost:8000/web/`. Não há dependências JavaScript, CDN, rastreamento ou publicação automática.

Este cliente Canvas/HTML usa os mesmos quatro atlas originais do projeto Godot e pode ser jogado no navegador. É uma implementação independente dos sistemas para facilitar demonstração e capturas; não é uma exportação automática do Godot. Os arquivos editáveis Godot continuam no projeto principal.

## Controles e combos

- A/D, setas: mover. Espaço/W: salto de altura variável.
- J, J, J: três golpes leves com buffer entre os golpes. O terceiro finaliza com dano maior.
- L: pesado, mais alcance/dano, antecipação e recuperação maiores.
- K/Shift e J: esquiva seguida de golpe de avanço.
- Espaço e J no ar: golpe descendente.
- U: lançar magia do elemento equipado (32 vigor, recarga 1,1 s).
- 1–4 ou Q: fogo, eletricidade, água e veneno.
- E: repousar/aprimorar no altar ou recolher relicário.
- H: consumir uma cura. Tab: mostrar mapa.
- Esc ou botão Ⅱ: pausar. G: reduzir sangue. M: silenciar sinais e ambiente.
- Controles touch podem ser ativados no menu; em dispositivo com ponteiro coarse eles aparecem por padrão.

## Rota jogável

1. Cripta do Nome Apagado: penitentes, plataformas, altar e relicário no alto.
2. Claustro das Águas Mortas: bestas de raízes, abismo e quatro selos. Golpeie cada selo com seu elemento; eles abrem o portão da floresta.
3. Floresta Invertida: sentinelas, altar anterior à arena e Curupira. Ao iniciar a luta, uma barreira impede recuar ao altar. Observe antecipação da investida, raízes e eco da posição. Abaixo de meia vida ele acelera. Sua derrota concede esquiva aérea. O arco final conclui a vigília; voltar à Cripta permite abrir o relicário.

Essência e reagentes vêm de monstros. Aprimorar no altar exige 12 essências e dois reagentes do elemento equipado. Repousar restaura vida/curas e repovoa monstros comuns. Uma morte deixa um rastro com a essência; uma segunda morte o substitui. A progressão é persistida em localStorage na chave `ratanaba_web_v02`; este save é separado do Godot.

## Limites desta versão

Atlas gerados têm quatro quadros por sequência, e partes da animação ainda exigem ajuste manual para continuidade, pivôs e leitura de impacto. As três áreas são conectadas em uma faixa horizontal, com plataformas e segredos; ainda não constituem um mapa metroidvania completo com dezenas de salas. O gore é composto por partículas e efeitos, sem desmembramento. Balanceamento é inicial. Touch/áudio requerem verificação em aparelho real.

## Verificação e prints reais

`tests/test_game.cjs` roda Playwright com Chromium, aciona teclado, verifica mecânicas e gera capturas do Canvas/DOM reais. Requer Playwright instalado e seu Chromium. Opcionalmente defina `CHROMIUM_EXECUTABLE` para um navegador compatível. Capturas utilizam warps internos de QA e congelamento para enquadrar áreas; essas ações não existem no fluxo normal de jogo. Não são montagens feitas a partir dos assets.

`window.Ratanaba` expõe estado e funções de QA para testes. Não existe rede, placar competitivo ou servidor. Ao distribuir uma versão de produção, esta interface de debug pode ser removida.
