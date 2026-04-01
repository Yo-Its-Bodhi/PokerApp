#!/usr/bin/env bash
set -euo pipefail

# Deterministic VPS deploy from GitHub source-of-truth.
# Pulls latest branch, builds Vite frontend, publishes static assets,
# and runs smoke checks against the domain.

REPO_DIR="/root/poker-live"
REMOTE_NAME="origin"
BRANCH_NAME="main"
REPO_URL=""
SSH_KEY_PATH=""
DOMAIN="poker.bodhix.io"
SCHEME="https"
TARGET_DIR="/var/www/poker/web/dist"
DEPLOY_SERVER="false"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/vps/deploy-from-github.sh [options]

Options:
  --repo-dir <dir>       Repo path on VPS (default: /root/poker-live)
  --remote <name>        Git remote name (default: origin)
  --repo-url <url>       GitHub repo URL (used if remote does not exist)
  --ssh-key <path>       SSH private key for git operations (optional)
  --branch <name>        Git branch to deploy (default: main)
  --domain <domain>      Public domain for smoke checks (default: poker.bodhix.io)
  --scheme <http|https>  Scheme for smoke checks (default: https)
  --target-dir <dir>     Static publish dir (default: /var/www/poker/web/dist)
  --deploy-server        Also rebuild/restart backend via deploy-server.sh
  -h, --help             Show this help

Examples:
  ./scripts/vps/deploy-from-github.sh
  ./scripts/vps/deploy-from-github.sh --branch main --deploy-server
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
    --repo-dir)
      require_option_value "$1" "${2-}"
      REPO_DIR="$2"
      shift 2
      ;;
    --remote)
      require_option_value "$1" "${2-}"
      REMOTE_NAME="$2"
      shift 2
      ;;
    --repo-url)
      require_option_value "$1" "${2-}"
      REPO_URL="$2"
      shift 2
      ;;
    --ssh-key)
      require_option_value "$1" "${2-}"
      SSH_KEY_PATH="$2"
      shift 2
      ;;
    --branch)
      require_option_value "$1" "${2-}"
      BRANCH_NAME="$2"
      shift 2
      ;;
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
    --target-dir)
      require_option_value "$1" "${2-}"
      TARGET_DIR="$2"
      shift 2
      ;;
    --deploy-server)
      DEPLOY_SERVER="true"
      shift 1
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

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 2
  fi
}

require_cmd git
require_cmd bash

if [[ -z "$SSH_KEY_PATH" && -f "/root/.ssh/poker_deploy_ed25519" ]]; then
  SSH_KEY_PATH="/root/.ssh/poker_deploy_ed25519"
fi

run_git() {
  if [[ -n "$SSH_KEY_PATH" ]]; then
    GIT_SSH_COMMAND="ssh -i $SSH_KEY_PATH -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes" git "$@"
  else
    git "$@"
  fi
}

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "Repo not found or not a git repo: $REPO_DIR" >&2
  exit 2
fi

echo "==> Deploying from GitHub"
echo "Repo:   $REPO_DIR"
echo "Remote: $REMOTE_NAME"
echo "Branch: $BRANCH_NAME"

if ! run_git -C "$REPO_DIR" remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  if [[ -z "$REPO_URL" ]]; then
    echo "Git remote '$REMOTE_NAME' is not configured for $REPO_DIR." >&2
    echo "Re-run with --repo-url <github-url> to bootstrap remote setup." >&2
    exit 2
  fi

  echo "==> Configuring missing git remote: $REMOTE_NAME -> $REPO_URL"
  run_git -C "$REPO_DIR" remote add "$REMOTE_NAME" "$REPO_URL"
fi

cd "$REPO_DIR"

echo "==> Fetching latest refs"
REMOTE_BRANCH_REF="$(run_git ls-remote --heads "$REMOTE_NAME" "$BRANCH_NAME" || true)"
if [[ -z "$REMOTE_BRANCH_REF" ]]; then
  echo "Remote branch '$BRANCH_NAME' was not found on '$REMOTE_NAME'." >&2
  echo "If this is a new/empty GitHub repo, push your branch first, then rerun this deploy." >&2
  exit 2
fi

run_git fetch "$REMOTE_NAME" "$BRANCH_NAME"

echo "==> Checking out branch"
run_git checkout "$BRANCH_NAME"

echo "==> Pulling latest commit (fast-forward only)"
run_git pull --ff-only "$REMOTE_NAME" "$BRANCH_NAME"

echo "==> Publishing frontend static build"
bash "$REPO_DIR/scripts/vps/deploy-frontend-static.sh" --target-dir "$TARGET_DIR"

if [[ "$DEPLOY_SERVER" == "true" ]]; then
  echo "==> Deploying backend"
  bash "$REPO_DIR/scripts/vps/deploy-server.sh" --domain "$DOMAIN"
fi

echo "==> Running smoke checks"
bash "$REPO_DIR/scripts/vps/smoke-check.sh" --domain "$DOMAIN" --scheme "$SCHEME"

echo "==> Deploy complete"
run_git rev-parse --short HEAD
