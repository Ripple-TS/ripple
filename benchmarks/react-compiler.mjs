import path from 'node:path';
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import { reactCompilerPreset } from '@vitejs/plugin-react';

const REACT_SOURCE_PATTERN = /\.(?:[jt]sx?|[cm][jt]s|tsrx)(?:$|\?)/;
const TSRX_SOURCE_PATTERN = /\.tsrx(?:$|\?)/;

// Babel resolves the preset's `babel-plugin-react-compiler` from its `cwd`,
// which defaults to the process cwd; pin it to this package so builds work
// from any directory.
const BENCHMARKS_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Configure the production React Compiler for browser, server, and TSRX builds. */
export function reactCompiler({ include = REACT_SOURCE_PATTERN } = {}) {
	const standardPreset = reactCompilerPreset();
	const tsrxPreset = reactCompilerPreset({ compilationMode: 'all' });

	// Vite's preset defaults to browser-only compilation. Benchmark SSR and Worker
	// builds must receive the same optimization as the corresponding client app.
	standardPreset.rolldown.applyToEnvironmentHook = () => true;
	tsrxPreset.rolldown.applyToEnvironmentHook = () => true;

	// The TSRX React plugin lowers JSX before this plugin sees it, so inference
	// cannot recognize components that do not call an ordinary useXxx hook.
	// Restrict all-mode to those lowered TSRX modules; JSX/TSX keeps inference.
	standardPreset.rolldown.filter.id = { exclude: TSRX_SOURCE_PATTERN };
	tsrxPreset.rolldown.filter.id = TSRX_SOURCE_PATTERN;

	return babel({ include, cwd: BENCHMARKS_DIR, presets: [standardPreset, tsrxPreset] });
}
