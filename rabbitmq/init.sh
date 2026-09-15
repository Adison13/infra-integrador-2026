#!/bin/sh
# Cria no RabbitMQ o vhost, as exchanges e um usuário por módulo (Contrato §9.7 e §13.3).
#
# Roda a cada `docker compose up`, pelo serviço rabbitmq-init. Tudo é PUT na API de
# administração, então rodar de novo não duplica nada.
#
# Permissões de mq_{modulo}, em expressões regulares:
#   configurar  ^{modulo}\..*                           próprias exchanges e filas
#   escrever    ^({modulo}\..*|identity\.entrada)$      publica só no que é seu e na plataforma
#   ler         ^({modulo}\..*|[a-z]+\.eventos)$        lê as próprias filas; ler a exchange
#                                                       de outro módulo permite ligar fila a ela
set -eu

API="http://rabbitmq:15672/api"
AUTH="$RABBITMQ_ADMIN_USUARIO:$RABBITMQ_ADMIN_SENHA"
VHOST="${RABBITMQ_VHOST:-plataforma}"
MODULOS="identity crm produtos contratos financeiro chamados marketing landing exemplo"

put() {
  curl -fsS -u "$AUTH" -X PUT -H 'content-type: application/json' "$API/$1" -d "$2" >/dev/null
}

echo "Aguardando a API de administração do RabbitMQ..."
tentativas=0
until curl -fsS -u "$AUTH" "$API/overview" >/dev/null 2>&1; do
  tentativas=$((tentativas + 1))
  if [ "$tentativas" -ge 60 ]; then
    echo "RabbitMQ não respondeu em 2 minutos." >&2
    exit 1
  fi
  sleep 2
done

put "vhosts/$VHOST" '{}'
put "permissions/$VHOST/$RABBITMQ_ADMIN_USUARIO" '{"configure":".*","write":".*","read":".*"}'
put "exchanges/$VHOST/identity.entrada" '{"type":"topic","durable":true,"auto_delete":false}'

for modulo in $MODULOS; do
  nome_var="MQ_$(echo "$modulo" | tr '[:lower:]' '[:upper:]')_SENHA"
  eval "senha=\${$nome_var:-}"
  if [ -z "$senha" ]; then
    echo "Variável $nome_var não definida. Confira o .env." >&2
    exit 1
  fi

  put "users/mq_$modulo" "$(printf '{"password":"%s","tags":""}' "$senha")"
  put "permissions/$VHOST/mq_$modulo" "$(printf \
    '{"configure":"^%s\\\\..*","write":"^(%s\\\\..*|identity\\\\.entrada)$","read":"^(%s\\\\..*|[a-z]+\\\\.eventos)$"}' \
    "$modulo" "$modulo" "$modulo")"
  put "exchanges/$VHOST/$modulo.eventos" '{"type":"topic","durable":true,"auto_delete":false}'
  echo "Módulo $modulo: usuário mq_$modulo e exchange $modulo.eventos prontos."
done

echo "RabbitMQ configurado."
