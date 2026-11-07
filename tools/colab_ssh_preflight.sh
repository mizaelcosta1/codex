#!/usr/bin/env bash
# Official Colab SSH-over-WebSocket; no exposed port 22 and no paid GPU creation.
set -euo pipefail
HERE="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
SESSION=''
PROBE=false
help() {
cat <<'HELP'
Ratanaba Colab CLI SSH preflight, for Linux/macOS/Windows WSL2
  bash tools/colab_ssh_preflight.sh
  bash tools/colab_ssh_preflight.sh --session ratanaba-t4 --probe

One-time setup on YOUR computer:
  python3 -m venv ~/.venvs/colab-cli
  ~/.venvs/colab-cli/bin/python -m pip install google-colab-cli
  export PATH="$HOME/.venvs/colab-cli/bin:$PATH"
  ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519  # only if missing
  colab --auth oauth2 sessions                 # Google sign-in on your own device

Optional NEW runtime, only if compute-unit use is acceptable:
  colab --auth oauth2 usage
  colab --auth oauth2 new -s ratanaba-t4 --gpu T4

Never share OAuth codes, tokens or private SSH keys in chat.
HELP
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --session) [[ $# -ge 2 ]] || exit 2; SESSION="$2"; shift 2 ;;
    --probe) PROBE=true; shift ;;
    --help|-h) help; exit 0 ;;
    *) echo "Invalid argument: $1" >&2; help; exit 2 ;;
  esac
done
if ! command -v colab >/dev/null 2>&1; then echo "colab CLI not installed" >&2; help; exit 2; fi
if [[ ! -s "$HOME/.ssh/id_ed25519" && ! -s "$HOME/.ssh/id_ecdsa" ]]; then
  echo "Missing private SSH identity; generate it locally using ssh-keygen." >&2; exit 2
fi
colab version
if [[ "$PROBE" == false ]]; then
  colab --auth oauth2 sessions
  echo "No SSH session or billable VM created by preflight."
else
  if [[ ! "$SESSION" =~ ^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$ ]]; then
    echo "Invalid session name" >&2; exit 2
  fi
  colab --auth oauth2 ssh -s "$SESSION" -- python - < "$HERE/colab_remote_probe.py"
fi
