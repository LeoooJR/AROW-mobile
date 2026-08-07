#!/usr/bin/env bash
set -euo pipefail

MODE="${1:---dev-client}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

show_usage() {
  printf '%s\n' \
    'usage: ./script/build_and_run.sh [mode]' \
    '' \
    'Modes:' \
    '  --dev-client, dev-client  Start Metro for the development client' \
    '  --android, android        Start Metro and open the Android development client' \
    '  --help, help              Show this help'
}

resolve_android_sdk() {
  if ! command -v android >/dev/null 2>&1; then
    printf '%s\n' 'Android CLI is required but was not found on PATH.' >&2
    exit 1
  fi

  ANDROID_SDK_PATH="$(android info sdk)"

  if [[ -z "$ANDROID_SDK_PATH" || ! -d "$ANDROID_SDK_PATH" ]]; then
    printf '%s\n' 'Android CLI did not return a valid SDK directory.' >&2
    exit 1
  fi

  export ANDROID_HOME="$ANDROID_SDK_PATH"
  export ANDROID_SDK_ROOT="$ANDROID_SDK_PATH"
  export PATH="$ANDROID_SDK_PATH/platform-tools:$ANDROID_SDK_PATH/emulator:$PATH"
}

resolve_android_sdk

case "$MODE" in
  --dev-client | dev-client)
    exec npx expo start --dev-client
    ;;
  --android | android)
    exec npx expo start --dev-client --android
    ;;
  --help | help)
    show_usage
    ;;
  *)
    show_usage >&2
    exit 2
    ;;
esac
