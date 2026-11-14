# Ratanabá Guardians — conexão SSH segura com Google Colab

A conexão usa o Google Colab CLI oficial: https://github.com/googlecolab/google-colab-cli

O CLI oferece SSH encapsulado em WebSocket e autenticado pelo Google. Nenhuma porta TCP pública, serviço de túnel terceirizado ou servidor SSH no notebook é necessário.

## Passo a passo no Windows

O Colab CLI documenta Linux e macOS como plataformas oficiais. No Windows, utilize Ubuntu em WSL2.

Instale a ferramenta em um ambiente virtual, sem colar credenciais em arquivos:

    python3 -m venv ~/.venvs/colab-cli
    ~/.venvs/colab-cli/bin/python -m pip install google-colab-cli
    export PATH="$HOME/.venvs/colab-cli/bin:$PATH"
    ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519   # apenas se não existir chave
    colab --auth oauth2 sessions

O login exibe um link Google e solicita um código. Insira esse código apenas no seu próprio terminal. Nunca envie chaves SSH privadas, tokens, links de sessão com credenciais, ou códigos OAuth ao chat ou GitHub.

O comando sessions não cria GPU. Uma sessão criada pela interface web pode não ter o endpoint SSH; a documentação informa que o recurso deve estar disponível desde a criação do runtime.

## Criar GPU T4 (ação opcional que pode consumir unidades Colab)

    colab --auth oauth2 usage
    colab --auth oauth2 new -s ratanaba-t4 --gpu T4

Exige acesso pago com unidades de computação positivas para shell remoto, conforme a FAQ do Google Colab. A assinatura Google AI Pro não garante unidades disponíveis a todo instante. O Colab tem limites e runtimes temporários.

## Testar a conexão e o Blender remotamente

Na pasta do repositório mizaelcosta1/codex, branch feature/guardians-v0.2-asset-pipeline:

    bash tools/colab_ssh_preflight.sh --session ratanaba-t4 --probe

O comando se conecta ao runtime especificado, executa o script de inspeção sem escrever arquivos e imprime JSON com: GPU real, versão Python, Blender instalado, Git e espaço livre.

Para abrir shell interativo:

    colab --auth oauth2 ssh -s ratanaba-t4

Para um comando remoto:

    colab --auth oauth2 ssh -s ratanaba-t4 -- 'cd /content && python --version'

O helper nunca cria automaticamente uma sessão GPU. Não instala Blender e não ativa a API paga Lux3D.

## Codex e MCP

Uma vez autenticado no mesmo ambiente WSL, seu Codex CLI pode usar comandos colab ssh para executar scripts de modelagem e diagnósticos no runtime e transferir resultados. O Colab MCP oficial é um caminho alternativo: https://github.com/googlecolab/colab-mcp

A sessão atual do ChatGPT não tem acesso aos tokens do Codex CLI ou ao runtime autenticado. O arquivo Gpt_blender.ipynb não precisa ser modificado para essa conexão.

## Diagnósticos

- colab ausente: instale o CLI no WSL.
- HTTP 404 em /colab/ssh: recrie o runtime pelo CLI após verificar custo; alguns runtimes abertos no navegador não suportam SSH.
- HTTP 401: autentique-se novamente no seu terminal.
- HTTP 429: excesso de conexões simultâneas.
- GPU ausente: examine colab status e o plano ativo.
- Blender ausente: instale-o na sessão antes de tentar GLB.

Nenhuma conexão viva foi realizada nesta sessão; ainda falta sua autenticação local e o probe remoto. Os assets e o APK não foram alterados.
