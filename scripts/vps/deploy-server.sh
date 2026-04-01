#!/usr/bin/env bash
set -euo pipefail

# Deploy/update the poker backend on a VPS using PM2.
# - Picks a free port by default (3100-3999)
# - Builds server TypeScript
# - Starts/restarts PM2 process with production env (including on-chain settlement)

DOMAIN="poker.bodhix.io"
PROCESS_NAME="poker-server"
START_PORT="3100"
END_PORT="3999"
REQUESTED_PORT=""
ENFORCE_ONE_WALLET_PER_IP="true"
CORS_ORIGINS=""
HOST="127.0.0.1"
DISCONNECT_GRACE_MS="30000"
SHIDO_RPC_URL="${SHIDO_RPC_URL:-}"
TABLE_ESCROW_ADDRESS="${TABLE_ESCROW_ADDRESS:-}"
SERVER_SIGNER_PRIVATE_KEY="${SERVER_SIGNER_PRIVATE_KEY:-}"
ESCROW_TOKEN_DECIMALS="${ESCROW_TOKEN_DECIMALS:-}"
SETTLE_EACH_HAND="${SETTLE_EACH_HAND:-}"
HAND_BREAK_MS="${HAND_BREAK_MS:-}"
SMALL_BLIND="${SMALL_BLIND:-}"
BIG_BLIND="${BIG_BLIND:-}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/vps/deploy-server.sh [options]

Options:
  --domain <domain>           Public domain (default: poker.bodhix.io)
  --process-name <name>       PM2 process name (default: poker-server)
  --port <port>               Explicit backend port (skip auto-find)
  --start-port <port>         Auto-find range start (default: 3100)
  --end-port <port>           Auto-find range end (default: 3999)
  --cors-origins <origins>    Comma-separated CORS origins
  --enforce-ip-wallet <bool>  true/false (default: true)
  --shido-rpc-url <url>       Shido RPC URL for settlement bridge
  --table-escrow-address <a>  TableEscrow contract address
  --server-signer-key <key>   Server signer private key (hex)
  --escrow-token-decimals <n> Escrow token decimals (default: 18)
  --settle-each-hand <bool>   true/false (default: true)
  --hand-break-ms <ms>        Delay between hands in ms (default: 5000)
  --small-blind <chips>       Small blind amount (default: 500)
  --big-blind <chips>         Big blind amount (default: 1000)
  -h, --help                  Show this help

Examples:
  ./scripts/vps/deploy-server.sh
  ./scripts/vps/deploy-server.sh --port 3201
  ./scripts/vps/deploy-server.sh --domain poker.bodhix.io --process-name poker-mainnet
EOF
}

require_option_value() {
  local flag="$1"
  local value="${2-}"
  if [[ -z "$value" || "$value" == --* ]]; then
    echo "Missing value for $flag" >&2
    usage
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      require_option_value "$1" "${2-}"
      DOMAIN="$2"
      shift 2
      ;;
    --process-name)
      require_option_value "$1" "${2-}"
      PROCESS_NAME="$2"
      shift 2
      ;;
    --port)
      require_option_value "$1" "${2-}"
      REQUESTED_PORT="$2"
      shift 2
      ;;
    --start-port)
      require_option_value "$1" "${2-}"
      START_PORT="$2"
      shift 2
      ;;
    --end-port)
      require_option_value "$1" "${2-}"
      END_PORT="$2"
      shift 2
      ;;
    --cors-origins)
      require_option_value "$1" "${2-}"
      CORS_ORIGINS="$2"
      shift 2
      ;;
    --enforce-ip-wallet)
      require_option_value "$1" "${2-}"
      ENFORCE_ONE_WALLET_PER_IP="$2"
      shift 2
      ;;
    --shido-rpc-url)
      require_option_value "$1" "${2-}"
      SHIDO_RPC_URL="$2"
      shift 2
      ;;
    --table-escrow-address)
      require_option_value "$1" "${2-}"
      TABLE_ESCROW_ADDRESS="$2"
      shift 2
      ;;
    --server-signer-key)
      require_option_value "$1" "${2-}"
      SERVER_SIGNER_PRIVATE_KEY="$2"
      shift 2
      ;;
    --escrow-token-decimals)
      require_option_value "$1" "${2-}"
      ESCROW_TOKEN_DECIMALS="$2"
      shift 2
      ;;
    --settle-each-hand)
      require_option_value "$1" "${2-}"
      SETTLE_EACH_HAND="$2"
      shift 2
      ;;
    --hand-break-ms)
      require_option_value "$1" "${2-}"
      HAND_BREAK_MS="$2"
      shift 2
      ;;
    --small-blind)
      require_option_value "$1" "${2-}"
      SMALL_BLIND="$2"
      shift 2
      ;;
    --big-blind)
      require_option_value "$1" "${2-}"
      BIG_BLIND="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
FIND_PORT_SCRIPT="$REPO_ROOT/scripts/find-free-port.sh"
EXISTING_ENV_FILE="$SERVER_DIR/.env.production"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 2
  fi
}

is_uint() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

is_bool() {
  [[ "$1" == "true" || "$1" == "false" ]]
}

is_eth_address() {
  [[ "$1" =~ ^0x[0-9a-fA-F]{40}$ ]]
}

is_private_key() {
  [[ "$1" =~ ^0x[0-9a-fA-F]{64}$ || "$1" =~ ^[0-9a-fA-F]{64}$ ]]
}

is_port_in_use() {
  local port="$1"
  ss -H -ltn "sport = :$port" | grep -q .
}

read_env_file_value() {
  local file="$1"
  local key="$2"
  local line=""

  if [[ ! -f "$file" ]]; then
    return 1
  fi

  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi

  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf '%s' "$line"
}

resolve_env_value() {
  local key="$1"
  local current="$2"
  local fallback="$3"
  local existing=""

  if [[ -z "$current" ]]; then
    existing="$(read_env_file_value "$EXISTING_ENV_FILE" "$key" || true)"
    current="$existing"
  fi

  if [[ -z "$current" ]]; then
    current="$fallback"
  fi

  printf '%s' "$current"
}

require_cmd node
require_cmd npm
require_cmd pm2
require_cmd ss
require_cmd curl
require_cmd bash

if ! is_uint "$START_PORT" || ! is_uint "$END_PORT"; then
  echo "Port range values must be numeric" >&2
  exit 2
fi

if (( START_PORT > END_PORT )); then
  echo "Invalid port range: start port must be <= end port" >&2
  exit 2
fi

if [[ -z "$CORS_ORIGINS" ]]; then
  CORS_ORIGINS="https://$DOMAIN"
fi

# Preserve values from existing env file unless explicitly overridden.
SHIDO_RPC_URL="$(resolve_env_value "SHIDO_RPC_URL" "$SHIDO_RPC_URL" "https://rpc-nodes.shidoscan.com")"
TABLE_ESCROW_ADDRESS="$(resolve_env_value "TABLE_ESCROW_ADDRESS" "$TABLE_ESCROW_ADDRESS" "")"
SERVER_SIGNER_PRIVATE_KEY="$(resolve_env_value "SERVER_SIGNER_PRIVATE_KEY" "$SERVER_SIGNER_PRIVATE_KEY" "")"
ESCROW_TOKEN_DECIMALS="$(resolve_env_value "ESCROW_TOKEN_DECIMALS" "$ESCROW_TOKEN_DECIMALS" "18")"
SETTLE_EACH_HAND="$(resolve_env_value "SETTLE_EACH_HAND" "$SETTLE_EACH_HAND" "true")"
HAND_BREAK_MS="$(resolve_env_value "HAND_BREAK_MS" "$HAND_BREAK_MS" "5000")"
SMALL_BLIND="$(resolve_env_value "SMALL_BLIND" "$SMALL_BLIND" "500")"
BIG_BLIND="$(resolve_env_value "BIG_BLIND" "$BIG_BLIND" "1000")"

if ! is_bool "$ENFORCE_ONE_WALLET_PER_IP"; then
  echo "--enforce-ip-wallet must be true or false" >&2
  exit 2
fi

if ! is_bool "$SETTLE_EACH_HAND"; then
  echo "--settle-each-hand must be true or false" >&2
  exit 2
fi

if ! is_uint "$ESCROW_TOKEN_DECIMALS" || ! is_uint "$HAND_BREAK_MS" || ! is_uint "$SMALL_BLIND" || ! is_uint "$BIG_BLIND"; then
  echo "escrow-token-decimals, hand-break-ms, small-blind, and big-blind must be numeric" >&2
  exit 2
fi

if [[ -n "$TABLE_ESCROW_ADDRESS" ]] && ! is_eth_address "$TABLE_ESCROW_ADDRESS"; then
  echo "Invalid --table-escrow-address: $TABLE_ESCROW_ADDRESS" >&2
  exit 2
fi

if [[ -n "$SERVER_SIGNER_PRIVATE_KEY" ]] && ! is_private_key "$SERVER_SIGNER_PRIVATE_KEY"; then
  echo "Invalid --server-signer-key format (expected 64-byte hex, optional 0x prefix)" >&2
  exit 2
fi

if [[ -n "$TABLE_ESCROW_ADDRESS" || -n "$SERVER_SIGNER_PRIVATE_KEY" ]]; then
  if [[ -z "$TABLE_ESCROW_ADDRESS" || -z "$SERVER_SIGNER_PRIVATE_KEY" ]]; then
    echo "On-chain settlement requires both TABLE_ESCROW_ADDRESS and SERVER_SIGNER_PRIVATE_KEY" >&2
    exit 2
  fi
fi

if [[ -n "$REQUESTED_PORT" ]]; then
  if ! is_uint "$REQUESTED_PORT"; then
    echo "Requested port must be numeric: $REQUESTED_PORT" >&2
    exit 2
  fi
  PORT="$REQUESTED_PORT"
  if is_port_in_use "$PORT"; then
    echo "Requested port $PORT is already in use" >&2
    exit 1
  fi
else
  if [[ ! -f "$FIND_PORT_SCRIPT" ]]; then
    echo "Port finder script not found: $FIND_PORT_SCRIPT" >&2
    exit 2
  fi
  PORT="$(bash "$FIND_PORT_SCRIPT" "$START_PORT" "$END_PORT")"
  if [[ -z "$PORT" ]] || ! is_uint "$PORT"; then
    echo "Failed to find a free port in range $START_PORT-$END_PORT" >&2
    exit 1
  fi
fi

echo "Using backend port: $PORT"

echo "Installing server dependencies and building..."
cd "$SERVER_DIR"
npm ci
npm run build

# Save a concrete env file for auditability/debugging.
old_umask="$(umask)"
umask 077
cat > "$SERVER_DIR/.env.production" <<EOF
PORT=$PORT
HOST=$HOST
CORS_ORIGINS=$CORS_ORIGINS
ENFORCE_ONE_WALLET_PER_IP=$ENFORCE_ONE_WALLET_PER_IP
DISCONNECT_GRACE_MS=$DISCONNECT_GRACE_MS
NODE_ENV=production
SMALL_BLIND=$SMALL_BLIND
BIG_BLIND=$BIG_BLIND
SHIDO_RPC_URL=$SHIDO_RPC_URL
TABLE_ESCROW_ADDRESS=$TABLE_ESCROW_ADDRESS
SERVER_SIGNER_PRIVATE_KEY=$SERVER_SIGNER_PRIVATE_KEY
ESCROW_TOKEN_DECIMALS=$ESCROW_TOKEN_DECIMALS
SETTLE_EACH_HAND=$SETTLE_EACH_HAND
HAND_BREAK_MS=$HAND_BREAK_MS
EOF
umask "$old_umask"

echo "Wrote $SERVER_DIR/.env.production"

if pm2 describe "$PROCESS_NAME" >/dev/null 2>&1; then
  echo "Restarting PM2 process: $PROCESS_NAME"
  PORT="$PORT" \
  HOST="$HOST" \
  CORS_ORIGINS="$CORS_ORIGINS" \
  ENFORCE_ONE_WALLET_PER_IP="$ENFORCE_ONE_WALLET_PER_IP" \
  DISCONNECT_GRACE_MS="$DISCONNECT_GRACE_MS" \
  SMALL_BLIND="$SMALL_BLIND" \
  BIG_BLIND="$BIG_BLIND" \
  SHIDO_RPC_URL="$SHIDO_RPC_URL" \
  TABLE_ESCROW_ADDRESS="$TABLE_ESCROW_ADDRESS" \
  SERVER_SIGNER_PRIVATE_KEY="$SERVER_SIGNER_PRIVATE_KEY" \
  ESCROW_TOKEN_DECIMALS="$ESCROW_TOKEN_DECIMALS" \
  SETTLE_EACH_HAND="$SETTLE_EACH_HAND" \
  HAND_BREAK_MS="$HAND_BREAK_MS" \
  NODE_ENV="production" \
  pm2 restart "$PROCESS_NAME" --update-env
else
  echo "Starting PM2 process: $PROCESS_NAME"
  PORT="$PORT" \
  HOST="$HOST" \
  CORS_ORIGINS="$CORS_ORIGINS" \
  ENFORCE_ONE_WALLET_PER_IP="$ENFORCE_ONE_WALLET_PER_IP" \
  DISCONNECT_GRACE_MS="$DISCONNECT_GRACE_MS" \
  SMALL_BLIND="$SMALL_BLIND" \
  BIG_BLIND="$BIG_BLIND" \
  SHIDO_RPC_URL="$SHIDO_RPC_URL" \
  TABLE_ESCROW_ADDRESS="$TABLE_ESCROW_ADDRESS" \
  SERVER_SIGNER_PRIVATE_KEY="$SERVER_SIGNER_PRIVATE_KEY" \
  ESCROW_TOKEN_DECIMALS="$ESCROW_TOKEN_DECIMALS" \
  SETTLE_EACH_HAND="$SETTLE_EACH_HAND" \
  HAND_BREAK_MS="$HAND_BREAK_MS" \
  NODE_ENV="production" \
  pm2 start "$SERVER_DIR/dist/server.js" --name "$PROCESS_NAME" --time
fi

pm2 save >/dev/null

echo "Running local health check..."
HEALTH_URL="http://127.0.0.1:$PORT/health"
for attempt in {1..20}; do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null; then
    break
  fi

  if [[ "$attempt" -eq 20 ]]; then
    echo "Health check failed after 20 attempts: $HEALTH_URL" >&2
    exit 1
  fi

  sleep 1
done

echo ""
echo "Backend deployed successfully"
echo "Process: $PROCESS_NAME"
echo "Port:    $PORT"
echo "Health:  $HEALTH_URL"
if [[ "$SETTLE_EACH_HAND" == "true" ]]; then
  echo "Settlement mode: each-hand"
else
  echo "Settlement mode: on-leave"
fi
if [[ -n "$TABLE_ESCROW_ADDRESS" ]]; then
  echo "TableEscrow: $TABLE_ESCROW_ADDRESS"
else
  echo "TableEscrow: (not configured)"
fi
echo ""
echo "Next steps:"
echo "1) Render nginx config: ./scripts/vps/render-nginx-config.sh --domain $DOMAIN --backend-port $PORT"
echo "2) Install nginx config + reload nginx"
if [[ "$SETTLE_EACH_HAND" == "true" ]]; then
  echo "3) Run smoke checks: ./scripts/vps/smoke-check.sh --domain $DOMAIN --expect-settlement-mode each-hand"
else
  echo "3) Run smoke checks: ./scripts/vps/smoke-check.sh --domain $DOMAIN --expect-settlement-mode on-leave"
fi
