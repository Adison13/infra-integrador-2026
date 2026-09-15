#!/bin/sh
# Cria o schema e os dois usuários de banco de cada módulo (Contrato §7.1).
#
# Roda sozinho na primeira subida do PostgreSQL, quando o volume de dados está vazio.
# Para rodar de novo: docker compose down -v && docker compose up -d
#
#   own_{modulo}  dono do schema; usado só pelo Flyway, para aplicar migrations
#   usr_{modulo}  usado pela aplicação; lê e grava dados, nunca altera estrutura
set -eu

MODULOS="identity crm produtos contratos financeiro chamados marketing landing exemplo"

# Lê DB_<OWN|APP>_<MODULO>_SENHA do ambiente e para tudo se estiver faltando.
senha() {
  nome="DB_$1_$(echo "$2" | tr '[:lower:]' '[:upper:]')_SENHA"
  eval "valor=\${$nome:-}"
  if [ -z "$valor" ]; then
    echo "Variável $nome não definida. Confira o .env." >&2
    exit 1
  fi
  printf '%s' "$valor"
}

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v banco="$POSTGRES_DB" <<'SQL'
REVOKE ALL ON DATABASE :"banco" FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE EXTENSION IF NOT EXISTS citext;
SQL

for modulo in $MODULOS; do
  # atribuição separada: assim uma variável faltando interrompe o script (set -e)
  own_senha=$(senha OWN "$modulo")
  app_senha=$(senha APP "$modulo")
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -v banco="$POSTGRES_DB" \
    -v schema="$modulo" \
    -v own="own_$modulo" \
    -v app="usr_$modulo" \
    -v own_senha="$own_senha" \
    -v app_senha="$app_senha" <<'SQL'
CREATE ROLE :"own" LOGIN PASSWORD :'own_senha';
CREATE ROLE :"app" LOGIN PASSWORD :'app_senha';
GRANT CONNECT ON DATABASE :"banco" TO :"own", :"app";

CREATE SCHEMA :"schema" AUTHORIZATION :"own";
REVOKE ALL ON SCHEMA :"schema" FROM PUBLIC;
GRANT USAGE ON SCHEMA :"schema" TO :"app";

-- Tudo que o dono criar no schema já nasce acessível à aplicação, só para dados.
ALTER DEFAULT PRIVILEGES FOR ROLE :"own" IN SCHEMA :"schema"
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app";
ALTER DEFAULT PRIVILEGES FOR ROLE :"own" IN SCHEMA :"schema"
  GRANT USAGE, SELECT ON SEQUENCES TO :"app";

ALTER ROLE :"own" SET search_path TO :"schema", public;
ALTER ROLE :"app" SET search_path TO :"schema", public;
SQL
  echo "Schema $modulo criado, com own_$modulo e usr_$modulo."
done
