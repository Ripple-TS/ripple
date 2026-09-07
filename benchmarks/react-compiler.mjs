import babel from '@rolldown/plugin-babel';
import { reactCompilerPreset } from '@vitejs/plugin-react';

const REACT_SOURCE_PATTERN = /\.(?:[jt]sx?|[cm][jt]s|tsrx)(?:$|\?)/;
const TSRX_SOURCE_PATTERN = /\.tsrx(?:$|\?)/;

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

	return babel({ include, presets: [standardPreset, tsrxPreset] });
}
