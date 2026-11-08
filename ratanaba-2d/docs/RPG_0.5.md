# RPG 0.5 — mochila, mana, aura e sorte

A camada RPG é implementada em `web/rpg.js` e `web/rpg.css`. O cliente web mantém os sistemas anteriores de essência, nível, reagentes e frascos recarregáveis do altar. A atualização adiciona inventário, consumíveis, equipamento, mana e quatro atributos comprados com aura.

## Ações e recursos

- **B / botão Mochila:** abre 24 espaços de inventário. Cada pilha contém até 99 unidades. Selecionar mostra nome, raridade, efeito e chance real do item.
- **N / botão Aura:** abre força, vitalidade, magia e sorte. A compra exige estar a menos de 105 px de um dos três altares e a menos de 80 px de sua altura.
- A mochila e a tela de aura pausam a simulação. Esc fecha e devolve o estado anterior da pausa; controles pendentes são limpos.
- Um espaço de equipamento admite um amuleto ou relíquia. Equipar outro substitui o anterior; possuir várias unidades não acumula o bônus.
- A alma começa com duas poções pequenas de vida, duas poções pequenas de mana e um fragmento de aura (8 aura ao consumir). Os três frascos H do sistema anterior continuam independentes e são restaurados no altar.

A mana máxima inicial é **80**. Uma magia consome **18 mana** e o código do combate deve cobrar **8 vigor**. A recuperação natural é **2 mana/s** durante jogo ativo, e para durante pausa, menus e cut-scenes. O altar e a morte restauram mana.

A aura é vinculada à alma: **+2 por inimigo comum** e **+20 pelo boss**, além dos fragmentos consumíveis e materiais transmutados. Aura, itens e atributos não são perdidos na morte; essência segue a regra anterior de queda/recuperação. Itens soltos no chão são perdidos ao morrer.

## Atributos

Todos começam em zero e chegam a um limite de 20. O custo de qualquer compra é `8 + 4 × total de pontos já investidos`.

| Atributo | Efeito por ponto |
|---|---|
| Força | +2 dano físico |
| Vitalidade | +12 vida máxima; o ganho de capacidade também acrescenta a diferença à vida atual |
| Magia | +5 mana máxima e +2 dano mágico |
| Sorte | +2 pontos percentuais de chance de um item cair, até 90%, e pesos mais favoráveis de raridade |

O nível anterior ainda concede sua vida e dano originais. Os benefícios são calculados separadamente. Os atributos e o custo aparecem antes de confirmar cada compra. A aura só é consumida após validar altar, limite e saldo.

## Probabilidades reais

Sem pontos de sorte, um inimigo comum tem **65%** de chance de soltar um item e **35%** de não soltar item. A escolha de raridade acontece **somente quando um item é sorteado**.

| Raridade | Entre os itens que caem | Por inimigo comum (sorte 0) | Item aleatório do boss |
|---|---:|---:|---:|
| Comum | 60% | 39% | 0% |
| Incomum | 25% | 16,25% | 0% |
| Raro | 10% | 6,5% | 70% |
| Épico | 4% | 2,6% | 25% |
| Lendário | 1% | 0,65% | 5% |

O boss solta um item aleatório garantido e concede o **Rastro do Curupira** como recompensa fixa única. A relíquia fixa independe da tabela aleatória. O estado `bossRewarded` impede conceder novamente a recompensa, mesmo que o hook seja chamado outra vez ou o estado seja salvo e carregado. Caso a mochila esteja cheia, a relíquia fica pendente no save e entra quando houver espaço.

Para sorte `L`, limitada entre 0 e 20:

- Chance de um item: `min(0,90; 0,65 + 0,02 × L)`.
- Pesos de raridade: `60 / (1 + 0,04L)`, `25`, `10 × (1 + 0,06L)`, `4 × (1 + 0,08L)`, `1 × (1 + 0,10L)`.
- Os cinco pesos são divididos por sua soma. A chance absoluta da raridade é a chance de item multiplicada pelo peso normalizado.
- Os itens de uma mesma raridade têm seleção uniforme. A ficha do item mostra sua chance individual por inimigo. O painel expansível mostra as chances atuais, já ajustadas por sorte, e a coluna separada do boss.

Não existe garantia de lendário por número de tentativas. A raridade comum não é confundida com a chance de não cair item.

## Catálogo

| Item | Raridade | Uso |
|---|---|---|
| Sangue da Seiva | Comum | +35 vida |
| Sangue Primordial | Raro | +85 vida |
| Lágrima da Memória | Comum | +30 mana |
| Orvalho Primordial | Raro | +75 mana |
| Tônico de Raiz | Incomum | +50 vigor |
| Cinza Protetora | Incomum | 1,2 s de invulnerabilidade; não é anunciado como cura de veneno persistente, que ainda não afeta o jogador nesta versão |
| Fragmento de Aura | Raro | +8 aura |
| Nexo de Aura | Épico | +30 aura |
| Osso de Penitente | Comum | Transmutar em 1 aura |
| Folha do Exílio | Incomum | Transmutar em 2 aura |
| Brasa da Penitência | Incomum | Transmutar em 2 aura +1 reagente de fogo |
| Estilhaço de Tempestade | Raro | Transmutar em 4 aura +1 reagente elétrico |
| Pérola do Lamento | Raro | Transmutar em 4 aura +1 reagente de água |
| Seiva Corrompida | Raro | Transmutar em 4 aura +1 reagente de veneno |
| Amuleto da Ferida | Épico | Equipar: +3 dano físico/mágico |
| Máscara do Nome Apagado | Lendário | Equipar: +7 dano físico/mágico |
| Rastro do Curupira | Relíquia única | Equipar: +4 dano físico; não descartável |

Poções de vida/mana/vigor só são consumidas se houver recurso a restaurar. Um item não coletado por falta de espaço permanece no chão. Pilhas e espaços são validados durante coleta e migração; saves com itens desconhecidos, quantidades inválidas ou atributos fora dos limites são saneados.

## Integração e persistência

A chave de save continua `ratanaba_web_v02`; a camada é armazenada no campo `rpg`, com versão interna 1. Saves anteriores migram com os atributos novos em zero e recursos iniciais, preservando nível, essência, selos, relicário e progressão do jogo anterior. Um save antigo com Curupira morto recebe a nova relíquia fixa uma vez na migração.

| Hook | Responsabilidade |
|---|---|
| `initialize(state, savedRpg)` | Criar/sanear a camada após fresh ou depois dos campos antigos no restore |
| `serialize()` | Retornar aura, mana, atributos, inventário, equipamento, recompensa do boss, pendências e drops não coletados |
| `tick(dt)` | Regenerar mana e tentar coleta automática; chamar apenas em simulação ativa |
| `onKill(enemy, isBoss)` | Aura, tabela aleatória e relíquia do boss; chamar antes do persist |
| `renderDrops(ctx, cam)` | Desenhar drops RPG em contexto de tela; a função subtrai `cam` |
| `canCast()` / `spendMana()` | Validar/cobrar os 18 mana; o combate cobra vigor separadamente |
| `damageBonus(kind)` | Bônus físico ou mágico (`kind === 'magic'`) e equipamento |
| `onRest()` / `onDeath()` | Restaurar mana e sanear capacidades; death limpa drops, mantém itens e aura |

`node web/tests/test_rpg_unit.cjs` executa 21 verificações determinísticas: tabelas, soma e limites, recusa de consumíveis cheios, mana, evolução, equipamento, capacidade, coleta e persistência sem duplicação, recompensas únicas e migração.

## Arte

O cliente consome o atlas `assets/rpg_v05/items.webp` (4×4) e `ui_icons.webp` (4×2), criados pelo trabalho de arte principal. Os ícones de mochila e aura aparecem nos botões reais. As bordas e cores das raridades são elementos de interface, não texto gravado nas imagens.


Integração final: a morte também é salva pelo motor, incluindo mancha de essência e limpeza de drops soltos; a recuperação da mancha é persistida.
