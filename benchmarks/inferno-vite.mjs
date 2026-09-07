import babel from '@rolldown/plugin-babel';

const INFERNO_SOURCE_PATTERN = /\.[jt]sx(?:$|\?)/;

/** Compile benchmark JSX with Inferno's native production JSX transform. */
export function infernoCompiler({ include = INFERNO_SOURCE_PATTERN } = {}) {
	return babel({
		include,
		plugins: [['babel-plugin-inferno', { imports: true }]],
	});
}
