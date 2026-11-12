# Auditoria de gameplay v0.7.0 — evidências do vídeo Android

## Fonte visual
Vídeo enviado pelo usuário: gravação vertical de aproximadamente 226,6 s, 720x1612, 30,6 fps de captura. A gravação mostra o menu, três biomas, inimigos comuns, selos elementais, combate com Curupira, inventário e tela de encerramento da primeira vigília.

A taxa de 30,6 fps é a taxa do arquivo de captura; não comprova a taxa interna de renderização do jogo.

## Achados confirmados no código e ações aplicadas nesta branch

| Achado | Evidência no código | Correção |
|---|---|---|
| Banido fica translúcido no dash | O sprite principal recebia alpha 0.55 durante frames de invulnerabilidade; dash ativa invulnerabilidade | Sprite principal passa a renderizar opaco; afterimages continuam translúcidas |
| Baús afundam / ficam sobrepostos a altares | O atlas era desenhado em três pontos fixos, com âncora vertical constante e coordenadas próximas dos altares | Cinco baús reposicionados sobre plataformas e alinhados pelo bottom anchor do sprite |
| D-pad usa setas em vez de analógico | HUD usava quatro botões direcionais | Substituído por joystick virtual de 360°, com knob que acompanha o ponteiro, eixo horizontal proporcional, salto ao inclinar para cima e drop-through ao inclinar para baixo |
| Tutorial não ensina comandos | Só havia cutscene narrativa de abertura | Tutorial contextual de movimento, travessia, ataque, magia, defesa e parry após a abertura |
| Vitória não permitia continuar | Mapa terminava em x=5950 e não havia destino jogável após a tela de vitória | Portal interativo após derrotar Curupira; nova zona jogável Santuário Oculto, checkpoint, inimigos e entrada no minimapa |
| Bioma 4 não tinha linha de fundo | Spritesheet de ambientes tem três linhas | Santuário reutiliza a linha da floresta com camada cromática de corrupção, preservando os assets existentes |
| Simulação dependia do intervalo de requestAnimationFrame | update(dt) era chamado uma vez por callback com delta variável | Acumulador de simulação a 60 Hz, até cinco passos por frame e descarte controlado de backlog |

## Assets
Os spritesheets e imagens existentes foram preservados. Não houve substituição dos personagens, ambientes, HUD, efeitos ou animações originais. O atlas chest_rarities.svg já existente foi mantido e reposicionado.

## Testes adicionados / atualizados
- Regressão de baús: verifica âncora e coordenada do baú no mundo.
- Regressão de progressão: derrota do Curupira libera portal e entrada no Santuário Oculto.
- Testes HUD atualizados para joystick e tutorial.
- Testes browser atualizados para dispensar a sequência de tutorial na inicialização.

## Limitações ainda não verificadas
- Nenhum teste em aparelho Android físico nesta execução.
- FPS real em aparelho não pode ser inferido da taxa de quadros do vídeo de captura.
- A execução de browser tests, bundle Android e compilação APK depende do GitHub Actions desta branch.
- O Boss ainda requer teste de combate prolongado para validar equilíbrio e ausência de loops de colisão em todas as sequências.

