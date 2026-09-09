import path from 'node:path';
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';

const INFERNO_SOURCE_PATTERN = /\.[jt]sx(?:$|\?)/;

// Babel resolves plugin names from its `cwd`, which defaults to the process
// cwd; pin it to this package so the plugin is found from any directory.
const BENCHMARKS_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Compile benchmark JSX with Inferno's native production JSX transform. */
export function infernoCompiler({ include = INFERNO_SOURCE_PATTERN } = {}) {
	return babel({
		include,
		cwd: BENCHMARKS_DIR,
		plugins: [['babel-plugin-inferno', { imports: true }]],
	});
}
