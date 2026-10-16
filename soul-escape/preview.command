#!/bin/zsh
set -eu
cd "${0:A:h}"
RUNTIME_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if command -v node >/dev/null 2>&1; then
  RUNTIME_NODE="$(command -v node)"
fi
if [[ ! -x "$RUNTIME_NODE" ]]; then
  print 'Для запуску потрібен Node.js 22 або новіший.'
  exit 1
fi
export PATH="${RUNTIME_NODE:h}:$PATH"
exec "$RUNTIME_NODE" node_modules/@remotion/cli/remotion-cli.js studio --no-open
