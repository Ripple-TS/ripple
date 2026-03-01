#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCKFILE_PATH="${WORKSPACE_ROOT}/pnpm-lock.yaml"
LOCKFILE_HASH_PATH="${HOME}/.cache/cursor/ripple-pnpm-lock.sha256"
PACKAGE_MANAGER="$(node -p "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')).packageManager" "${WORKSPACE_ROOT}/package.json")"
if [[ "${PACKAGE_MANAGER}" != pnpm@* ]]; then
	echo "Expected packageManager in package.json to be pnpm@<version>, got '${PACKAGE_MANAGER}'."
	exit 1
fi
REQUIRED_PNPM_VERSION="${PACKAGE_MANAGER#pnpm@}"

cd "${WORKSPACE_ROOT}"

if [ ! -f "${LOCKFILE_PATH}" ]; then
	echo "Expected lockfile at ${LOCKFILE_PATH}, but it was not found."
	exit 1
fi

pnpm_version=""
if command -v pnpm >/dev/null 2>&1; then
	pnpm_version="$(pnpm --version)"
fi

if [ "${pnpm_version}" != "${REQUIRED_PNPM_VERSION}" ]; then
	corepack enable
	corepack prepare "pnpm@${REQUIRED_PNPM_VERSION}" --activate >/dev/null
fi

lockfile_hash="$(sha256sum "${LOCKFILE_PATH}" | awk '{ print $1 }')"
cached_lockfile_hash=""

if [ -f "${LOCKFILE_HASH_PATH}" ]; then
	read -r cached_lockfile_hash < "${LOCKFILE_HASH_PATH}" || true
fi

if [ -d "${WORKSPACE_ROOT}/node_modules" ] \
	&& [ -x "${WORKSPACE_ROOT}/node_modules/.bin/vitest" ] \
	&& [ "${cached_lockfile_hash}" = "${lockfile_hash}" ]; then
	echo "pnpm dependencies are up to date; skipping install."
else
	pnpm install --frozen-lockfile --prefer-offline
	mkdir -p "$(dirname "${LOCKFILE_HASH_PATH}")"
	printf '%s\n' "${lockfile_hash}" > "${LOCKFILE_HASH_PATH}"
fi

# Warm command resolution so vitest-based test runs start quickly.
pnpm exec vitest --version >/dev/null
