#!/usr/bin/env bash
set -euo pipefail

BUILD_HELPER="build_and_run_preview.sh"
BUILD_DESCRIPTION="Build and launch a local Android release preview without Metro or EAS."
source "$(dirname "${BASH_SOURCE[0]}")/android_build_common.sh"

CI=1 build_android release "$@"
printf '%s\n' 'JavaScript and assets are embedded; Metro is not needed.'
