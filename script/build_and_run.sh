#!/usr/bin/env bash
set -euo pipefail

# Compatibility entry point for existing Codex actions and approval rules.
exec "$(dirname "${BASH_SOURCE[0]}")/development/start_dev_client.sh" "$@"
