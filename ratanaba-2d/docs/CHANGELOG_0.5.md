# Ratanabá Guardians — RPG, mochila, aura e animação 0.5

Abra `web/index.html` após extrair a pasta inteira. Esta atualização é do cliente web; o projeto Godot anterior foi preservado.

## Sprites e movimentos

120 quadros novos com transparência, PNGs individuais e atlas WebP. O Curupira possui 48 poses em oito sequências de seis quadros: espera/respiração, corrida/aproximação, preparação do golpe, golpe/investida, ritual de raízes, eco temporal, reação/recuperação e morte. Penitente, fera de raízes e sentinela têm 24 poses cada: caminhada, ataque, reação e morte. A IA seleciona as sequências pela fase real do combate; a morte termina sem repetir.

Os quadros têm escala comum por espécie e pivô de chão normalizado para reduzir tremores e saltos. A prévia `assets/animations_v05/curupira_preview.gif` monta as poses reais. As sequências geradas ainda precisam de revisão manual para continuidade anatômica e acabamento de produção. Os outros Guardiões da história não foram adicionados como bosses jogáveis nesta atualização.

## Itens e mochila

16 ilustrações de itens: poções pequenas/grandes de vida e mana, tônico de vigor, cinza protetora, dois cristais de aura, osso, folha, brasa, cristal elétrico, pérola aquática, seiva de veneno, amuleto épico e máscara lendária. O Rastro do Curupira é uma relíquia única fixa que reutiliza o ícone de máscara.

B abre a mochila de 24 espaços; cada pilha aceita até 99 unidades. É possível usar consumíveis, transmutar materiais em aura, equipar uma relíquia/amuleto ou descartar pilhas. Os slots usam cores de raridade e a descrição mostra a chance atual do item. Uma mochila cheia mantém o item no chão. A relíquia fixa do boss fica pendente com segurança se não houver espaço.

A mochila inicial contém duas poções pequenas de vida, duas de mana e um fragmento de aura. As três curas H continuam sendo o frasco recarregável dos altares, independente das poções da mochila.

## Raridades e chances

Com Sorte 0, cada monstro comum tem 65% de chance de gerar um item de inventário e 35% de não gerar. A chance de raridade abaixo é condicional a sair um item; a coluna por monstro já inclui os 35% sem saque.

| Raridade | Entre itens que saem | Por monstro comum |
|---|---:|---:|
| Comum | 60% | 39% |
| Incomum | 25% | 16,25% |
| Raro | 10% | 6,5% |
| Épico | 4% | 2,6% |
| Lendário | 1% | 0,65% |

Dentro de cada raridade, os itens elegíveis têm pesos iguais. A mochila mostra a chance individual já dividida pelo tamanho do grupo. A sorte aumenta a chance de algum item em 2 pontos percentuais por ponto (máximo 90%) e muda os pesos normalizados das raridades, favorecendo as superiores. As chances exibidas são calculadas pela mesma função usada no sorteio.

Curupira concede um item aleatório garantido (70% raro, 25% épico, 5% lendário), mais o Rastro do Curupira fixo, uma vez por vitória salva. Sorte não garante lendários nem altera o item fixo. As recompensas antigas de essência/reagentes continuam separadas desse novo sorteio.

## Aura e atributos

N abre a evolução. Cada monstro concede 2 aura e Curupira concede 20; cristais e materiais também podem fornecer aura. A aura é vinculada ao personagem e permanece com a mochila após a morte. Só é possível investir perto de um dos três Altares da Memória.

O primeiro ponto custa 8 aura; o custo aumenta em 4 por ponto já comprado. Cada atributo aceita até 20 pontos.

| Atributo | Benefício por ponto |
|---|---|
| Força | +2 de dano físico |
| Vitalidade | +12 de vida máxima |
| Magia | +5 de mana máxima e +2 de dano mágico |
| Sorte | Melhora chance e raridade dos itens, conforme tabela dinâmica |

Mana começa em 80 e regenera 2 por segundo de jogo ativo. U gasta 18 mana e 8 vigor por magia. A regeneração para durante pausa, mochila e cut-scenes. Poções restauram recursos reais e não são gastas quando o recurso correspondente já está cheio.

## Salvamento e verificação

Saves anteriores são migrados sem apagar nível, essência, selos, checkpoint ou vitória. A nova camada grava atributos, aura, mana, mochila, equipamento, drops no chão e recompensa única. A morte agora grava a mancha de essência recuperável e limpa o saque solto; a recuperação da mancha também é salva.

89 verificações de navegador passaram, mais 21 verificações unitárias de RPG e 18 de animação, além do teste em tempo real de movimento e pausa pela mochila. Capturas em `docs/prints/v05/`. Foram usados lugares e itens de QA para enquadrar as telas; não representam um inventário inicial completo de raridades. Sem teste em aparelho Android real ou APK novo nesta entrega.
