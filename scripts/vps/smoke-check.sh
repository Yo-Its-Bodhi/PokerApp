#!/usr/bin/env bash
set -euo pipefail

DOMAIN="poker.bodhix.io"
SCHEME="https"
TIMEOUT="15"
RETRIES="3"
EXPECT_SETTLEMENT_MODE="any"

is_uint() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

usage() {
  cat <<'EOF'
Usage:
  ./scripts/vps/smoke-check.sh [options]

Options:
  --domain <domain>     Domain to check (default: poker.bodhix.io)
  --scheme <http|https> Scheme to use (default: https)
  --timeout <seconds>   Curl timeout (default: 15)
  --retries <count>     Retry count for each check (default: 3)
  --expect-settlement-mode <mode>
                       any|each-hand|on-leave (default: any)
  -h, --help            Show this help

Example:
  ./scripts/vps/smoke-check.sh --domain poker.bodhix.io --scheme https
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
    --scheme)
      require_option_value "$1" "${2-}"
      SCHEME="$2"
      shift 2
      ;;
    --timeout)
      require_option_value "$1" "${2-}"
      TIMEOUT="$2"
      shift 2
      ;;
    --retries)
      require_option_value "$1" "${2-}"
      RETRIES="$2"
      shift 2
      ;;
    --expect-settlement-mode)
      require_option_value "$1" "${2-}"
      EXPECT_SETTLEMENT_MODE="$2"
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

if [[ "$SCHEME" != "http" && "$SCHEME" != "https" ]]; then
  echo "Scheme must be http or https" >&2
  exit 2
fi

if ! is_uint "$TIMEOUT" || ! is_uint "$RETRIES"; then
  echo "Timeout and retries must be numeric" >&2
  exit 2
fi

if [[ "$EXPECT_SETTLEMENT_MODE" != "any" && "$EXPECT_SETTLEMENT_MODE" != "each-hand" && "$EXPECT_SETTLEMENT_MODE" != "on-leave" ]]; then
  echo "Expected settlement mode must be one of: any, each-hand, on-leave" >&2
  exit 2
fi

BASE_URL="$SCHEME://$DOMAIN"

retry_curl() {
  local url="$1"
  local output=""

  for attempt in $(seq 1 "$RETRIES"); do
    if output="$(curl --fail --silent --show-error --location --max-time "$TIMEOUT" "$url")"; then
      printf '%s' "$output"
      return 0
    fi

    if [[ "$attempt" -lt "$RETRIES" ]]; then
      sleep 1
    fi
  done

  return 1
}

echo "Checking frontend: $BASE_URL"
retry_curl "$BASE_URL" >/dev/null

echo "Checking backend health: $BASE_URL/health"
HEALTH_RESPONSE="$(retry_curl "$BASE_URL/health")"
if ! grep -q '"status"[[:space:]]*:[[:space:]]*"ok"' <<<"$HEALTH_RESPONSE"; then
  echo "Health response does not contain status=ok: $HEALTH_RESPONSE" >&2
  exit 1
fi

if [[ "$EXPECT_SETTLEMENT_MODE" != "any" ]]; then
  if ! grep -q "\"settlementMode\"[[:space:]]*:[[:space:]]*\"$EXPECT_SETTLEMENT_MODE\"" <<<"$HEALTH_RESPONSE"; then
    echo "Health response settlementMode mismatch (expected $EXPECT_SETTLEMENT_MODE): $HEALTH_RESPONSE" >&2
    exit 1
  fi
fi

echo "Health response: $HEALTH_RESPONSE"

echo "Checking Socket.IO polling handshake"
SOCKET_RESPONSE="$(retry_curl "$BASE_URL/socket.io/?EIO=4&transport=polling&t=$(date +%s)")"
if [[ ! "$SOCKET_RESPONSE" =~ ^0\{ ]]; then
  echo "Unexpected socket handshake payload: $SOCKET_RESPONSE" >&2
  exit 1
fi

echo "Smoke checks passed"
