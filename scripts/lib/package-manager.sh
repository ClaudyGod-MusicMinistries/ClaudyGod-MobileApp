#!/usr/bin/env bash

# Repository scripts must not depend on a globally activated Yarn binary.
# Corepack ships with the supported Node runtime and resolves the package
# manager consistently in interactive shells, CI, and non-interactive Git hooks.
run_yarn() {
  if command -v corepack >/dev/null 2>&1; then
    corepack yarn "$@"
    return
  fi

  if command -v yarn >/dev/null 2>&1; then
    command yarn "$@"
    return
  fi

  echo "Yarn is unavailable. Install Node.js with Corepack support." >&2
  return 127
}
