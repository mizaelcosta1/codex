# Validação da v0.1.0

## Código e arte

Godot 4.6.3 oficial e Blender 4.3.2, Linux x86_64. O runner funcional executou
**41 verificações, 41 aprovadas e 0 reprovadas**. Os mesmos testes passaram em
uma cópia limpa, sem `.godot` nem caches do projeto. Relatórios:
`test_results.json` e `clean_test_results.json`.

Além disso, um teste de percurso alcançou os três santuários a partir do início,
usando movimento e colisões, sem teletransporte. Os inimigos foram desativados
nesse teste para isolar a acessibilidade das trilhas do balanceamento de combate.
A ponte foi alinhada à trilha após esse teste encontrar uma grade obstruindo a
passagem. Relatórios: `routes_results.json` e `clean_routes_results.json`.

A suíte cobre início da partida, importação de modelos/rigs/clips, colisão com o
chão, gravidade e pulo, orientação visual, movimento real por física, limites,
esquiva e invulnerabilidade, energia, dano, eventos de dois dedos simultâneos,
liberação do joystick, pausa, cura e cooldown, coleta, projétil, patrulha do
Boitatá, percepção e disparo da Cuca, objetivos sem duplicação, vitória por combate,
melhor tempo, derrota, nova tentativa e som.

Os testes de objetivos movem o jogador para as posições relevantes, e os testes
de combate isolam os cooldowns. Isso valida as regras, não substitui uma sessão
humana completa de exploração ou uma avaliação de balanceamento.

**12/12 GLBs** passaram na verificação de cabeçalho, buffers, cena isolada, malha,
triângulos, normais e UVs. Os quatro humanoides têm pesos normalizados e exatamente
três clips (Idle, Walk, Attack). Também foi verificada a presença de uma única
perna no rig do Saci. Veja `assets_validation.json` e `assets_manifest.json`.

O renderer OpenGL do computador executou a cena e produziu as capturas em
`docs/images`. A cena estática de inspeção também foi exportada.

## APK

Exportação debug concluída com templates oficiais Godot 4.6.3.stable. Assinatura
APK v2 e v3 e alinhamento ZIP verificados pelas ferramentas Android oficiais.
ZIP íntegro; arquiteturas ARM64 e x86_64. Fontes Blender, testes, skills,
repositório Git e chaves de assinatura não estão no pacote.

O template declara min SDK 24 (Android 7) e target SDK 36. A exportação direta
usa build-tools 35.0.0, aceito pela engine com aviso de diferença do target. Não
usa Gradle, não requer NDK e não solicita permissão de Internet. A única permissão
explicitamente ativada é vibração. A chave debug não foi incluída no repositório.

Veja `apk_validation.json` e `downloads/SHA256SUMS.txt` para tamanho e digest do
arquivo entregue. O APK é uma compilação de testes, não uma publicação em loja.

## Execução Android

O APK candidato com a ponte corrigida foi instalado no emulador Android 10/API 29
x86_64. O menu renderizou, o toque em ENTRAR NA MATA iniciou a fase e um gesto no
joystick moveu e girou o personagem. A cena, o HUD e o tempo de partida aparecem
na captura `images/android-gameplay.png`. O backend usado foi ANGLE 2.1 com
SwiftShader 5, GLES 3.1, sem aceleração KVM.

O backend SwiftShader 4 antigo falhou ao compilar shaders. O backend host
llvmpipe produziu uma captura corrompida. O backend ANGLE atual renderizou o jogo.
A própria System UI do Android apresentou ANR por lentidão da emulação; o diálogo
foi fechado antes da captura de gameplay. Isso impede usar esses testes como
medição de FPS ou estabilidade de um telefone real. Os logs da engine sob ANGLE
não mostraram erro de script ou falha de shader durante a abertura e a entrada
na partida.

A compilação final também foi instalada e aberta no emulador. O toque no botão
de entrada iniciou a partida; pressionar Voltar abriu a tela A MATA ESPERA, e o
processo permaneceu ativo. A captura é `images/android-pause.png`. Essa regra
também é coberta na suíte funcional de 41 verificações. Houve aviso de cache de
shader recompilado ao atualizar o APK; a cena e a pausa renderizaram corretamente.

## Limites da validação

Não houve teste em telefone físico. Não foi medida uma meta de FPS, bateria,
memória ou compatibilidade entre fabricantes. O visual é uma primeira versão
simplificada; rigs e materiais não são o acabamento fotorealista da concept art.
A IA não usa navegação NavMesh para contornar obstáculos.
