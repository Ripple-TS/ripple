import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const zedPluginPath = join(root, 'packages/zed-plugin/package.json');
const lsPath = join(root, 'packages/language-server/package.json');

const zedPlugin = JSON.parse(readFileSync(zedPluginPath, 'utf8'));
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
if (current === ls.version) {
	console.log(`zed-plugin config.${pkgName} already at ${ls.version}, skipping`);
	process.exit(0);
}

zedPlugin.config[pkgName] = ls.version;
writeFileSync(zedPluginPath, JSON.stringify(zedPlugin, null, 2) + '\n');
console.log(`zed-plugin config.${pkgName}: ${current} → ${ls.version}`);
