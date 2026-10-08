# Sourced by the preview and development build entry points.
show_build_usage() {
  printf '%s\n' \
    "usage: ./script/$BUILD_HELPER --device <AVD-name>" \
    '' \
    "$BUILD_DESCRIPTION" \
    'An explicit AVD name is required; physical devices are not supported.' \
    'Start an emulator before running this helper.' \
    '  --help, -h  Show this help'
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

build_android() {
  local variant="$1"
  shift
  local ROOT_DIR DEVICE_NAME="" DEVICE="" DEVICE_ABI ANDROID_SDK_PATH DEVICES
  local serial state details name detail matches=0
  local DEVICE_DETAILS=() run_args=()
  ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --device)
        if [[ $# -lt 2 || -n "$DEVICE_NAME" || -z "$2" || "$2" == -* ]]; then
          printf '%s\n' '--device requires one nonempty AVD name.' >&2
          exit 2
        fi
        DEVICE_NAME="$2"
        shift 2
        ;;
      --help | -h)
        show_build_usage
        exit 0
        ;;
      *)
        show_build_usage >&2
        exit 2
        ;;
    esac
  done
  if [[ -z "$DEVICE_NAME" ]]; then
    show_build_usage >&2
    exit 2
  fi

  cd "$ROOT_DIR"

  for tool in node npm npx android java; do
    command -v "$tool" >/dev/null 2>&1 || fail "$tool is required but was not found on PATH."
  done
  node -e 'if (Number(process.versions.node.split(".")[0]) < 24) process.exit(1)' \
    || fail 'Node.js 24 or newer is required. Select it before running this helper.'
  [[ -x node_modules/.bin/expo && -d node_modules/tsx ]] \
    || fail 'Project dependencies are missing. Install them before running this helper.'
  java -version >/dev/null 2>&1 || fail 'Java is unavailable. Configure your installed JDK before building.'

  ANDROID_SDK_PATH="$(android info sdk)"
  [[ -n "$ANDROID_SDK_PATH" && -d "$ANDROID_SDK_PATH" ]] \
    || fail 'Android CLI did not return a valid SDK directory.'
  export ANDROID_HOME="$ANDROID_SDK_PATH"
  export ANDROID_SDK_ROOT="$ANDROID_SDK_PATH"
  export PATH="$ANDROID_SDK_PATH/platform-tools:$ANDROID_SDK_PATH/emulator:$PATH"
  command -v adb >/dev/null 2>&1 || fail 'ADB is missing from the installed Android SDK.'

  DEVICES="$(adb devices -l)"
  # SDK 57's run:android resolves --device by name rather than ADB serial.
  while read -r serial state details; do
    [[ "$state" == device ]] || continue
    if [[ "$serial" == emulator-* ]]; then
      name="$(adb -s "$serial" emu avd name | tr -d '\r' | sed '/^OK$/d')"
      if [[ "$name" == "$DEVICE_NAME" ]]; then
        matches=$((matches + 1))
        DEVICE="$serial"
      fi
    else
      name=""
      read -r -a DEVICE_DETAILS <<< "$details"
      for detail in "${DEVICE_DETAILS[@]+"${DEVICE_DETAILS[@]}"}"; do
        [[ "$detail" != model:* ]] || name="${detail#model:}"
      done
      [[ -n "$name" ]] || name="Device $serial"
      [[ "$name" != "$DEVICE_NAME" ]] \
        || fail "A physical device is named $DEVICE_NAME. Disconnect it before retrying."
    fi
  done <<< "$DEVICES"
  [[ "$matches" -gt 0 ]] || fail "No connected, ready emulator is named $DEVICE_NAME."
  [[ "$matches" -eq 1 ]] || fail "Several emulators are named $DEVICE_NAME. Stop the duplicate before retrying."
  [[ "$(adb -s "$DEVICE" shell getprop sys.boot_completed | tr -d '\r')" == 1 ]] \
    || fail "Emulator $DEVICE_NAME ($DEVICE) has not finished booting."

  DEVICE_ABI="$(adb -s "$DEVICE" shell getprop ro.product.cpu.abi | tr -d '\r')"
  case "$DEVICE_ABI" in
    arm64-v8a | armeabi-v7a | x86 | x86_64) ;;
    *) fail "Unsupported emulator architecture: $DEVICE_ABI" ;;
  esac

  npm run database:check

  # Prebuild rewrites npm launch scripts even with --no-install. Preserve the
  # caller's manifest, including on a failed or interrupted prebuild.
  PACKAGE_BACKUP="$(mktemp)"
  cp package.json "$PACKAGE_BACKUP"
  restore_package() {
    if [[ -n "$PACKAGE_BACKUP" ]]; then
      if ! cmp -s "$PACKAGE_BACKUP" package.json; then
        cp "$PACKAGE_BACKUP" package.json
      fi
      rm -f "$PACKAGE_BACKUP"
    fi
  }
  trap restore_package EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM

  printf 'Refreshing Android configuration for %s...\n' "$DEVICE"
  CI=1 npx --no-install expo prebuild --platform android --no-clean --no-install \
    --skip-dependency-update expo,react,react-native
  restore_package
  PACKAGE_BACKUP=""

  run_args=(--variant "$variant" --no-install --device "$DEVICE_NAME")
  if [[ "$variant" == release ]]; then
    run_args+=(--no-bundler)
  fi
  printf 'Building and launching %s on %s (%s, %s)...\n' "$variant" "$DEVICE_NAME" "$DEVICE" "$DEVICE_ABI"
  if ! GRADLE_OPTS="${GRADLE_OPTS:-} -Dorg.gradle.project.reactNativeArchitectures=$DEVICE_ABI" \
    npx --no-install expo run:android "${run_args[@]}"; then
    printf '%s\n' \
      'Android build or launch failed; the installed app has not been uninstalled.' \
      'If Android reports a signing conflict, use compatible local signing. This helper never clears app data.' >&2
    exit 1
  fi

  printf 'APK: android/app/build/outputs/apk/%s/app-%s.apk\n' "$variant" "$variant"
}
