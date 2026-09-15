#!/usr/bin/env bash
# Cria o .env a partir do .env.example, com senhas aleatórias e uma chave RS256 nova.
# Uso: scripts/gerar-env.sh [--forcar]
# No Windows, rode pelo Git Bash, que já traz openssl e base64.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env && "${1:-}" != "--forcar" ]]; then
  echo ".env já existe. Use --forcar para recriar — as senhas mudam e o banco precisa ser"
  echo "recriado com: docker compose down -v"
  exit 1
fi

command -v openssl >/dev/null || { echo "openssl não encontrado."; exit 1; }

chave=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null | base64 | tr -d '\r\n')

while IFS= read -r linha || [[ -n "$linha" ]]; do
  linha=${linha%$'\r'}
  if [[ "$linha" =~ ^([A-Z0-9_]+)=troque$ ]]; then
    echo "${BASH_REMATCH[1]}=$(openssl rand -hex 16)"
  elif [[ "$linha" == IDENTITY_JWT_CHAVE_PRIVADA=* ]]; then
    echo "IDENTITY_JWT_CHAVE_PRIVADA=$chave"
  else
    echo "$linha"
  fi
done < .env.example > .env

echo ".env criado com senhas aleatórias e chave do JWT."
