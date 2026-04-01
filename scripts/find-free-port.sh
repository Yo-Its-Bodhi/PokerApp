#!/usr/bin/env bash
set -euo pipefail

START_PORT="${1:-3100}"
END_PORT="${2:-3999}"

if ! command -v ss >/dev/null 2>&1; then
  echo "Error: ss command not found. Install iproute2." >&2
  exit 2
fi

if ! [[ "$START_PORT" =~ ^[0-9]+$ ]] || ! [[ "$END_PORT" =~ ^[0-9]+$ ]]; then
  echo "Usage: $0 [start_port] [end_port]" >&2
  exit 2
fi

if [ "$START_PORT" -gt "$END_PORT" ]; then
  echo "Error: start_port must be <= end_port" >&2
  exit 2
fi

used_ports="$(ss -H -ltn | awk '{print $4}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -u)"

for port in $(seq "$START_PORT" "$END_PORT"); do
  if ! grep -qx "$port" <<< "$used_ports"; then
    echo "$port"
    exit 0
  fi
done

echo "No free port found in range ${START_PORT}-${END_PORT}" >&2
exit 1
