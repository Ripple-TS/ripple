import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const zedPluginPath = join(root, 'packages/zed-plugin/package.json');
const extensionTomlPath = join(root, 'packages/zed-plugin/extension.toml');
const lsPath = join(root, 'packages/language-server/package.json');

const zedPlugin = JSON.parse(readFileSync(zedPluginPath, 'utf8'));
let extensionToml = readFileSync(extensionTomlPath, 'utf8');
const ls = JSON.parse(readFileSync(lsPath, 'utf8'));

const keys = Object.keys(zedPlugin.config ?? {});
if (keys.length !== 1) {
	throw new Error(
		`Expected exactly one entry under "config" in ${zedPluginPath}, got ${keys.length}`,
	);
}
const pkgName = keys[0];
if (pkgName !== ls.name) {
	throw new Error(
		`zed-plugin pins "${pkgName}" but language-server's name is "${ls.name}" — out of sync`,
	);
}

const current = zedPlugin.config[pkgName];
if (current !== ls.version) {
	zedPlugin.config[pkgName] = ls.version;
	writeFileSync(zedPluginPath, JSON.stringify(zedPlugin, null, 2) + '\n');
	console.log(`zed-plugin config.${pkgName}: ${current} → ${ls.version}`);
} else {
	console.log(`zed-plugin config.${pkgName} already at ${ls.version}, skipping`);
}

const extensionVersion = extensionToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!extensionVersion) {
	throw new Error(`Could not find a version in ${extensionTomlPath}`);
}

if (extensionVersion !== zedPlugin.version) {
	extensionToml = extensionToml.replace(
		/^version\s*=\s*"[^"]+"/m,
		`version = "${zedPlugin.version}"`,
	);
	writeFileSync(extensionTomlPath, extensionToml);
	console.log(`zed extension.toml version: ${extensionVersion} → ${zedPlugin.version}`);
	await import('./sync-zed-grammar-rev.js');
} else {
	console.log(`zed extension.toml version already at ${zedPlugin.version}, skipping`);
}
