# Animações 0.5 — ações vinculadas ao combate

O módulo `web/animations.js` lê quatro atlas transparentes, com a direção original para a esquerda. A normalização e a geração das imagens são uma etapa separada. Este arquivo não alega que os atlas estejam disponíveis antes da validação visual e do carregamento.

| Atlas | Colunas × linhas | Poses previstas | Ações |
|---|---:|---:|---|
| Curupira | 6 × 8 | 48 | espera, corrida, antecipação, varredura/investida, raízes, eco, reação/recuperação, morte |
| Penitente | 6 × 4 | 24 | caminhada/espera, antecipação/ataque, reação/recuperação, morte |
| Besta de raízes | 6 × 4 | 24 | caminhada/espera, antecipação/ataque, reação/recuperação, morte |
| Sentinela | 6 × 4 | 24 | caminhada/espera, antecipação/ataque, reação/recuperação, morte |

O escopo do primeiro boss é o Curupira. Os demais Guardiões da história não são declarados implementados por este módulo.

## Integração

Inclua `animations.js` após o cliente principal. Os caminhos são relativos a `web/index.html`:

- `../assets/animations_v05/curupira.webp`
- `../assets/animations_v05/penitent.webp`
- `../assets/animations_v05/root_hound.webp`
- `../assets/animations_v05/sentinel.webp`

Ao final de cada atualização ativa da simulação, depois das transições da IA, execute `RatanabaAnimations.tick(inimigo, dt, {boss:false})` para todos os monstros, inclusive mortos, e `tick(boss, dt, {boss:true})`. Não avance esse relógio durante pausa, falas ou pausa de impacto. O relógio fica em um `WeakMap`, sem campos de persistência na entidade.

Na renderização, chame:

```js
const handled = window.RatanabaAnimations?.drawEntity(ctx, enemy, {
  cameraX: state.cam,
  time: state.t,
  boss: false,
  reducedMotion,
});
if (!handled) {
  // Renderizador anterior preservado como fallback.
}
```

`drawEntity` retorna verdadeiro quando tratou a entidade, inclusive se ela estiver fora da tela ou se a animação de morte terminou. Retorna falso se a imagem não estiver disponível ou a espécie for desconhecida. O desenho não altera entidades nem relógios.

`ready` é uma Promise que resolve com os resultados individuais do carregamento. `status` expõe `loading`, `loaded` ou `unavailable` por espécie; `loaded` só é verdadeiro se os quatro atlas carregaram. Para terminar a morte do Curupira durante a despedida com o mundo congelado, o cliente pode executar `tick` somente no boss morto a partir do relógio real, enquanto houver cut-scene e a pausa estiver desativada. Não duplique esse avanço nas atualizações normais.

Uma falha mantém o fallback anterior e não produz rejeição de Promise sem tratamento.

`sample(entity, options)` devolve `key`, `row`, `frame`, `age`, `duration`, `progress`, `loop`, `alpha` e `finished`, permitindo testes de fase e capturas reproduzíveis. `configure(name, {columns, rows, size, anchorX, anchorY})` permite ajustar o tamanho e o pivô após inspecionar as imagens, sem trocar URLs externamente.

## Fases e tempo

O Curupira usa a fase real da IA: `watch/dormant` → espera, `run/approach/stalk` → corrida, `windup` → antecipação, `charge` → ataque, `roots` → ritual de raízes, `echo` → magia de eco, `recover/flinch/stun` → reação e recuperação. Os tempos de antecipação e recuperação vêm do `timer` quando a fase começa, preservando a diferença de velocidade entre as fases do boss. A corrida tem suporte próprio; para aparecer no jogo, a IA deve efetivamente entrar em `run`, `approach` ou `stalk`.

Os monstros comuns mostram os quatro primeiros quadros da linha de ataque durante a antecipação e os dois últimos no início da recuperação, após o instante de contato. Golpes recebidos usam a linha de reação; um novo impacto reinicia a reação.

As mortes percorrem seis poses em 0,75 s e desvanecem até 0,95 s, sem reiniciar. Se o cliente já mantiver `deathAge`, ele é respeitado. Não desenhe o sprite antigo depois de `drawEntity` retornar verdadeiro, mesmo após o desaparecimento.

O pivô padrão é x=0,5 e y=305/320 da célula, correspondente à normalização de células quadradas de 320 px com pés na linha 305 e margem inferior de 15 px. Ajuste por `configure` se a normalização mudar. A linha de morte mantém a altura relativa das poses abaixadas. O tamanho padrão segue o cliente anterior: Curupira 260, humanoides 175, besta 155. A respiração e o recuo adicionam deformações discretas com pivô nos pés; não inventam quadros intermediários nem substituem poses desenhadas. A opção de movimento reduzido remove esses complementos.

## Verificação

`node web/tests/test_animation_unit.cjs` passou em 18 verificações: mapeamento das oito linhas do boss, tempos das fases, avanço/reinício, ataque e reação dos monstros, morte sem loop, direção, ausência de mutações durante desenho, descarte fora da tela e fallback. Estes são testes da lógica; o acabamento visual depende da inspeção dos atlas e de capturas reais do jogo integrado.
