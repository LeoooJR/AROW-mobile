#!/usr/bin/env bash
set -euo pipefail

# Compatibility entry point for existing Codex actions and approval rules.
exec "$(dirname "${BASH_SOURCE[0]}")/start_dev_client.sh" "$@"
