# Arquitetura

A cena de entrada carrega `game.gd`, cria o ambiente e instancia os GLBs, corpos
de física, jogador, NPCs, inimigos e HUD. A geração do cenário usa seed fixa 7442,
com caminhos desobstruídos e exclusão de árvores próximas aos objetivos.

Os estados são `menu`, `playing`, `paused`, `won` e `lost`. Só há movimento,
combate e avanço de tempo em `playing`. O HUD recebe entrada durante a pausa,
e limpa os índices de toque ao abrir menus. Reiniciar remove o mundo antigo e
recria seus atores, projéteis, efeitos, santuários e sementes.

- `player.gd`: CharacterBody3D com movimento, gravidade, animação, energia,
  cooldowns, invulnerabilidade e dano. A camada de cenário é 1; jogador é 2.
- `enemy.gd`: Cuca percebe o jogador e atira; Boitatá patrulha/persegue.
  Camada 4; colisões com cenário. Não há NavMesh nesta versão.
- `game.gd`: objetivos, colisão dos projéteis com o jogador, ataque frontal,
  NPCs, coleta, câmera e áudio.
- `hud.gd`: barras, menus, instruções, botões, minimapa e área segura no mobile.
- `touch_control.gd`: joystick e ações, cada um mantendo o próprio índice de dedo.
- `minimap.gd`: projeta as posições XZ dos objetivos e atores em uma vista 2D.

Santuários têm trava contra ativação duplicada. A Cuca ignora dano até o terceiro.
Iara cura com intervalo de 30 s. Uma semente cura 15 pontos e só pode ser coletada
uma vez por tentativa. O áudio usa um canal de ambiente em loop e quatro para efeitos.

`user://settings.cfg` armazena somente som ligado/desligado e melhor tempo.
Não há salvamento de progresso no meio da fase. Perder foco pausa; matar o
processo faz a próxima abertura começar pelo menu.

# Assets e renderização

1 unidade Blender = 1 metro. A receita gera GLB com +Y para cima. Os personagens
olham para -Y no Blender e +Z no GLB; o controlador orienta o visual em movimento.
Saci tem exatamente uma perna; os pés do Curupira apontam ao contrário.

Cada asset exporta uma malha com submateriais PBR. Rigs iniciais são rígidos por
segmento; precisam de retopologia e pesos suaves para alcançar qualidade final.
UVs existem, mas não há texturas fotográficas nem mapas de normal assados.
A importação Godot gera LODs automaticamente. Instâncias compartilham recursos,
vegetação tem alcance de 48 m e sombras têm distância de 38 m e mapa de 1024.

O renderer Compatibility usa GLES 3. Os limites de luzes são 8 renderizáveis e
4 por objeto, adequados às quatro luzes da cena. Isso reduz exigência de uniforms
em drivers móveis limitados. Medir performance em hardware real é etapa separada.
