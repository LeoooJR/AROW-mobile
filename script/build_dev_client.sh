#!/usr/bin/env bash
set -euo pipefail

BUILD_HELPER="build_dev_client.sh"
BUILD_DESCRIPTION="Build, install, and launch the Android development client with Metro."
source "$(dirname "${BASH_SOURCE[0]}")/android_build_common.sh"

build_android debug "$@"
