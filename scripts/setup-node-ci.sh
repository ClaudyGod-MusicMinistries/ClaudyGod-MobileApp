#!/usr/bin/env bash
set -euo pipefail

NODE_MAJOR="${CLAUDYGOD_CI_NODE_MAJOR:-22}"
NVM_HOME="${NVM_DIR:-$HOME/.nvm}"

if [ ! -s "$NVM_HOME/nvm.sh" ]; then
  echo "::error::The GitHub-hosted runner does not provide nvm at $NVM_HOME/nvm.sh"
  exit 1
fi

# GitHub-hosted Ubuntu runners include nvm. Using the runner-owned installation
# keeps CI within the organization's action allowlist and avoids third-party
# setup actions.
# shellcheck source=/dev/null
. "$NVM_HOME/nvm.sh"
nvm install "$NODE_MAJOR"
nvm use "$NODE_MAJOR"

NODE_BIN_DIR="$(dirname "$(nvm which "$NODE_MAJOR")")"
echo "$NODE_BIN_DIR" >> "${GITHUB_PATH:?GITHUB_PATH is required in CI}"

corepack enable
corepack prepare yarn@1.22.22 --activate

node --version
yarn --version
