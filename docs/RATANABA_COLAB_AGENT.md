# Ratanabá Remote Agent — Colab, Blender e Gradio

**Estado:** implementação inicial; a VM Google Colab da pessoa usuária **não está
diretamente acessível pelo ChatGPT**. O primeiro teste real depende de executar
uma célula no notebook já conectado à GPU. Não confundir sintaxe/CI com render
comprovado.

## Operação

1. Na VM Colab **já ativa**, confira se existe:
   \`/content/ratanaba_blender/blender-4.5.15-linux-x64/blender\`.
2. Execute no notebook uma vez:

   \`\`\`python
   import subprocess
   from pathlib import Path

   repo = Path("/content/ratanaba_agent_repo")
   branch = "feature/ratanaba-colab-agent"
   remote = "https://github.com/mizaelcosta1/codex.git"
   if not (repo / ".git").exists():
       subprocess.run(["git", "clone", "--branch", branch, "--depth", "1",
                       remote, str(repo)], check=True)
   subprocess.run(["python", str(repo/"tools/ratanaba_colab_agent.py"),
                   "--repo", str(repo), "--pull"],
                  check=True)
   \`\`\`

3. Abra o **Gradio já autenticado** e clique em **Atualizar visualização**.
   Ele lerá \`/content/ratanaba_testes/ratanaba_teste.glb\` e \`preview.png\`.
   A cópia anterior só é substituída depois que GLB/PNG/.blend forem validados.

4. Consulte \`/content/ratanaba_testes/ratanaba_agent_status.json\` e
   \`/content/ratanaba_testes/jobs/banido-v003-preview/blender.log\`.
   A saída gerada fica em \`jobs/banido-v003-preview/\` e é preservada.

## Modo semiautomático (opcional)

Troque a chamada final por:

\`\`\`python
subprocess.run(["python", str(repo/"tools/ratanaba_colab_agent.py"),
                "--repo", str(repo), "--pull", "--watch"], check=True)
\`\`\`

Enquanto essa célula **permanecer ativa**, o agente consulta somente a branch
do projeto a cada 120 segundos, atualiza por fast-forward e executa novos jobs
da lista permitida. Não é um serviço permanente; desconexão/limites do Colab
podem encerrar a VM. Monitoramento contínuo pode consumir unidades de
computação, então execute somente com sua própria decisão.

## Política de segurança e custo

- Não instala GPUs, não cria Colab runtime, não usa Tripo/Lux3D ou APIs pagas.
- Não pede OAuth, tokens, chaves privadas ou credenciais GitHub.
- Apenas job kind \`banido_v003\` é permitido; scripts locais são versionados.
- Não aceita comandos shell arbitrários vindos da fila.
- Usa apenas \`git pull --ff-only\` no checkout **dedicado ao agente**.
- A fila é \`tasks/colab/queue.json\`; alterá-la exige commit no repositório.
- Um render Cycles pode usar CPU se CUDA/OptiX não estiver disponível.
- Modelo v003: protótipo procedural; ainda não é escultura realista AAA, não
  possui rigging, retopologia ou animação.
- Não publica arquivos em GitHub/Drive sem uma etapa de publicação autorizada.
- A validação do GLB verifica contêiner e presença de mesh, mas não substitui
  importação e testes Godot.
- O Gradio possui link público temporário: manter senha, não compartilhar URL.
- **Não** substituir \`assets/models\` do jogo sem testes de importação e FPS.

## Evolução coordenada

1. Confirmar v003 GLB e render no Colab/Gradio.
2. Inspecionar materiais, proporção e anatomia a partir de capturas.
3. Incorporar texturas PBR e detalhamento com fonte/licença conhecida.
4. Validar otimização e importação Godot antes de trocar assets.
5. Salvar os artefatos no Drive após autorização, pois /content é temporário.
