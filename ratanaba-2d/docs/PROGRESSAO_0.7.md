# 0.7 — Rastro do Curupira e Vale das Cinzas

A vitória contra Curupira abre a passagem à direita (x ≥ 5750) para o nível inferior; não conclui mais a vigília. O próximo Guardião é Boitatá, respeitando a sequência da campanha. A rota usa coordenadas contínuas do mundo, sem teletransporte ou tela de carregamento.

## Percurso jogável

Arena do Curupira (y=620) → plataformas nas raízes (y=760–1460) → altar inferior (5480,1580) → plataformas de cinzas (y=1720–2140) → arena de Boitatá (y=2220). Após a vitória, o arco à esquerda recupera a memória das cinzas. As plataformas permitem voltar à superfície; cada degrau tem no máximo 140 px, abaixo da altura do salto existente (~168 px).

A passagem permanece sólida enquanto Curupira vive. Os avisos na borda da arena, as marcas nas plataformas, o objetivo e o minimapa indicam a descida. ↓/S + PULO atravessa plataformas finas. No celular, segure o direcional inferior e toque PULO; esse mesmo direcional continua interagindo com altares. Pular normalmente permite subir. O piso sólido das arenas não pode ser atravessado.

## Apresentação

`world.js` concentra geometria, altares, câmera vertical e mistura dos fundos. As áreas de superfície têm faixas de transição de 520 px com smoothstep. A descida mistura floresta e cinzas pela altura; um filtro exponencial limita a alteração por frame, inclusive ao inverter a direção. A câmera vertical acompanha suavemente o jogador. A mistura visual permanece ativa com a opção de movimento reduzido.

O Vale das Cinzas e a serpente de Boitatá são desenhados em Canvas com código original, usando pilares, brasas e curvas; não são novos atlas nem modelos 3D. Os assets existentes permanecem no projeto. Boitatá tem antecipação, investida, brasas no chão e recuperação, acelera abaixo de meia vida e usa as regras elementais e de defesa existentes.

## Progresso e persistência

A chave `ratanaba_web_v02` é preservada. Saves com Curupira morto já abrem a descida; nível, essência, inventário, atributos e relíquia são mantidos. O novo altar grava x e y; morrer ou continuar restaura esse ponto com a câmera na altura correta. Manchas e saques preservam a altura no subsolo. Boitatá tem vitória e recompensa independentes: 30 aura, 50 essência e Escama da Memória Ardente (+5 dano, uma única vez). Ambas as relíquias podem aguardar no save se a mochila estiver cheia.

## Verificação

`node web/tests/test_progression.cjs` verifica migração, passagem fechada antes do boss, percurso com física real, altar inferior, duas fases de Boitatá, morte/respawn, subida até a superfície, mistura normalizada de fundos, recompensas independentes e alturas no save. O percurso de subida usa entradas de movimento e salto, sem warps entre plataformas.

`test_progression_browser.cjs` exercita teclado e ponteiro no Chromium, mudanças de fundo, descida, altar, continuar, HUD de Boitatá e sua derrota por combate, com capturas e relatório JSON em `web/tests/evidence`. O workflow executa essa suíte junto às quatro anteriores e compila o APK 0.7.0/700. A execução local de Chromium está bloqueada por sockets Unix; os resultados completos devem ser consultados no Actions da PR. Não foi realizado teste em Android físico.
