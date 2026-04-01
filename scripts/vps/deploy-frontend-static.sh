#!/usr/bin/env bash
set -euo pipefail

# Build and publish the Vite frontend to a static directory for nginx.

TARGET_DIR="/var/www/poker/web/dist"
SKIP_BUILD="false"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/vps/deploy-frontend-static.sh [options]

Options:
  --target-dir <dir>   Publish directory (default: /var/www/poker/web/dist)
  --skip-build         Skip npm build and only sync existing web/dist
  -h, --help           Show this help

Examples:
  ./scripts/vps/deploy-frontend-static.sh
  ./scripts/vps/deploy-frontend-static.sh --target-dir /var/www/poker/current
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
    --target-dir)
      require_option_value "$1" "${2-}"
      TARGET_DIR="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD="true"
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_DIR="$REPO_ROOT/web"
SOURCE_DIR="$WEB_DIR/dist"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 2
  fi
}

require_cmd npm
require_cmd date
require_cmd node

if [[ -z "$TARGET_DIR" || "$TARGET_DIR" == "/" ]]; then
  echo "Refusing to publish to unsafe target directory: $TARGET_DIR" >&2
  exit 2
fi

if [[ "$SKIP_BUILD" != "true" ]]; then
  echo "Installing frontend dependencies and building frontend bundle..."
  cd "$WEB_DIR"
  npm ci

  BUILD_SCRIPT="build"
  if node -e "const p=require('./package.json');process.exit(p.scripts && p.scripts['build:vite'] ? 0 : 1)"; then
    BUILD_SCRIPT="build:vite"
  fi

  echo "Using npm script: $BUILD_SCRIPT"
  npm run "$BUILD_SCRIPT"
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Build output not found: $SOURCE_DIR" >&2
  exit 1
fi

echo "Publishing frontend to: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$SOURCE_DIR/" "$TARGET_DIR/"
else
  # Delete all existing target contents, including dotfiles.
  rm -rf "${TARGET_DIR:?}/"* "${TARGET_DIR:?}/".[!.]* "${TARGET_DIR:?}/"..?* 2>/dev/null || true
  cp -a "$SOURCE_DIR/." "$TARGET_DIR/"
fi

BUILD_TIME_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BUILD_COMMIT="unknown"
BUILD_BRANCH="unknown"

if command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  BUILD_COMMIT="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
  BUILD_BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
fi

cat > "$TARGET_DIR/build-info.json" <<EOF
{
  "builtAtUtc": "$BUILD_TIME_UTC",
  "commit": "$BUILD_COMMIT",
  "branch": "$BUILD_BRANCH"
}
EOF

echo "Frontend published successfully"
