import fs from 'fs';
import os from 'os';
import path from 'path';

const COMPILER_STUBS = {
	ripple: `module.exports = {
	compile_to_volar_mappings(source, filename) {
		const code = \`/* compiler:ripple */\\nexport const filename = \${JSON.stringify(filename)};\\nexport default \${JSON.stringify(source)};\`;
		return {
			code,
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [source.length],
					generatedLengths: [source.length],
					data: {
						verification: false,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
						customData: {},
					},
				},
			],
			cssMappings: [],
			errors: [],
		};
	},
};
`,
	react: `module.exports = {
	compile_to_volar_mappings(source, filename) {
		const code = \`/* compiler:react */\\nexport const filename = \${JSON.stringify(filename)};\\nexport default \${JSON.stringify(source)};\`;
		return {
			code,
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [source.length],
					generatedLengths: [source.length],
					data: {
						verification: false,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
						customData: {},
					},
				},
			],
			cssMappings: [],
			errors: [],
		};
	},
};
`,
	solid: `module.exports = {
	compile_to_volar_mappings(source, filename) {
		const code = \`/* compiler:solid */\\nexport const filename = \${JSON.stringify(filename)};\\nexport default \${JSON.stringify(source)};\`;
		return {
			code,
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [source.length],
					generatedLengths: [source.length],
					data: {
						verification: false,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
						customData: {},
					},
				},
			],
			cssMappings: [],
			errors: [],
		};
	},
};
`,
	preact: `module.exports = {
	compile_to_volar_mappings(source, filename) {
		const code = \`/* compiler:preact */\\nexport const filename = \${JSON.stringify(filename)};\\nexport default \${JSON.stringify(source)};\`;
		return {
			code,
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [source.length],
					generatedLengths: [source.length],
					data: {
						verification: false,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
						customData: {},
					},
				},
			],
			cssMappings: [],
			errors: [],
		};
	},
};
`,
	// Octane ships its compiler inside the `octane` package at
	// `src/compiler/volar.js` and exports the contract under a camelCase name —
	// this stub mirrors the real published shape so the tests cover the
	// plugin's entry-path override AND its module-shape normalization.
	octane: `module.exports = {
	compileToVolarMappings(source, filename) {
		const code = \`/* compiler:octane */\\nexport const filename = \${JSON.stringify(filename)};\\nexport default \${JSON.stringify(source)};\`;
		return {
			code,
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [source.length],
					generatedLengths: [source.length],
					data: {
						verification: false,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
						customData: {},
					},
				},
			],
			cssMappings: [],
			errors: [],
		};
	},
};
`,
	vue: `module.exports = {
	compile_to_volar_mappings(source, filename) {
		const code = \`/* compiler:vue */\\nexport const filename = \${JSON.stringify(filename)};\\nexport default \${JSON.stringify(source)};\`;
		return {
			code,
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [source.length],
					generatedLengths: [source.length],
					data: {
						verification: false,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
						customData: {},
					},
				},
			],
			cssMappings: [],
			errors: [],
		};
	},
};
`,
};

const DECLARED_COMPILER_STUB = COMPILER_STUBS.octane.replace(
	'compiler:octane',
	'compiler:declared',
);

function tsconfig_with(tsrx) {
	return { tsrx, compilerOptions: {} };
}

function declared_workspace_config(package_name, compiler, marker, overrides = {}) {
	const specifier = overrides.specifier ?? compiler.trim();
	return {
		package_json: { name: package_name, private: true, ...overrides.package_json },
		tsconfig_json: tsconfig_with({ compiler }),
		compilers: [],
		declared_compilers: [{ specifier, marker, ...overrides.declared_compiler }],
		...overrides.config,
	};
}

function invalid_tsconfig_config(package_name, tsrx) {
	return {
		package_json: { name: package_name, private: true },
		tsconfig_json: tsconfig_with(tsrx),
		compilers: ['ripple'],
	};
}

export const WORKSPACE_CONFIGS = {
	'ripple-only': {
		package_json: {
			name: '@ripple-ts/fixture-ripple-only-project',
			private: true,
			devDependencies: {
				'@tsrx/ripple': 'workspace:*',
				'@ripple-ts/vite-plugin': 'workspace:*',
				ripple: 'workspace:*',
			},
		},
		compilers: ['ripple'],
	},
	'react-only': {
		package_json: {
			name: '@tsrx/fixture-react-only-project',
			private: true,
			devDependencies: {
				'@tsrx/react': 'workspace:*',
				'@tsrx/vite-plugin-react': 'workspace:*',
			},
		},
		compilers: ['react'],
	},
	'solid-only': {
		package_json: {
			name: '@tsrx/fixture-solid-only-project',
			private: true,
			devDependencies: {
				'@tsrx/solid': 'workspace:*',
				'@tsrx/vite-plugin-solid': 'workspace:*',
			},
		},
		compilers: ['solid'],
	},
	'preact-only': {
		package_json: {
			name: '@tsrx/fixture-preact-only-project',
			private: true,
			devDependencies: {
				'@tsrx/preact': 'workspace:*',
				'@tsrx/vite-plugin-preact': 'workspace:*',
			},
		},
		compilers: ['preact'],
	},
	'vue-only': {
		package_json: {
			name: '@tsrx/fixture-vue-only-project',
			private: true,
			devDependencies: {
				'@tsrx/vue': 'workspace:*',
				vue: '^3.5.0',
				'vue-jsx-vapor': '^3.2.10',
			},
		},
		compilers: ['vue'],
	},
	'octane-only': {
		package_json: {
			name: '@octanejs/fixture-octane-only-project',
			private: true,
			devDependencies: {
				octane: 'workspace:*',
				'@octanejs/vite-plugin': 'workspace:*',
			},
		},
		compilers: ['octane'],
	},
	'both-octane': {
		package_json: {
			name: '@octanejs/fixture-octane-project',
			private: true,
			devDependencies: {
				octane: 'workspace:*',
				'@octanejs/vite-plugin': 'workspace:*',
			},
		},
		compilers: ['ripple', 'react', 'octane'],
	},
	both: {
		package_json: {
			name: '@ripple-ts/fixture-ripple-project',
			private: true,
			devDependencies: {
				'@tsrx/ripple': 'workspace:*',
				'@ripple-ts/vite-plugin': 'workspace:*',
				ripple: 'workspace:*',
			},
		},
		compilers: ['ripple', 'react'],
	},
	'both-vue': {
		package_json: {
			name: '@tsrx/fixture-vue-project',
			private: true,
			devDependencies: {
				'@tsrx/vue': 'workspace:*',
				vue: '^3.5.0',
				'vue-jsx-vapor': '^3.2.10',
			},
		},
		compilers: ['ripple', 'vue'],
	},
	'both-react': {
		package_json: {
			name: '@tsrx/fixture-react-project',
			private: true,
			devDependencies: {
				'@tsrx/react': 'workspace:*',
				'@tsrx/vite-plugin-react': 'workspace:*',
			},
		},
		compilers: ['ripple', 'react'],
	},
	'both-preact': {
		package_json: {
			name: '@tsrx/fixture-preact-project',
			private: true,
			devDependencies: {
				'@tsrx/preact': 'workspace:*',
				'@tsrx/vite-plugin-preact': 'workspace:*',
			},
		},
		compilers: ['ripple', 'react', 'solid', 'preact'],
	},
	'declared-only': declared_workspace_config(
		'@tsrx/fixture-declared-only-project',
		'consumer-tsrx-compiler',
		'declared',
	),
	'declared-scoped': declared_workspace_config(
		'@tsrx/fixture-declared-scoped-project',
		'@consumer/tsrx-compiler',
		'scoped',
	),
	'declared-scoped-whitespace': declared_workspace_config(
		'@tsrx/fixture-declared-scoped-whitespace-project',
		' @consumer/tsrx-compiler ',
		'scoped',
	),
	'declared-dist': declared_workspace_config(
		'@tsrx/fixture-declared-dist-project',
		'consumer-dist-compiler',
		'dist',
		{ declared_compiler: { entry_parts: ['dist', 'volar.cjs'] } },
	),
	'declared-subpath': declared_workspace_config(
		'@tsrx/fixture-declared-subpath-project',
		'consumer-tsrx-compiler/volar',
		'subpath',
	),
	'declared-scoped-subpath': declared_workspace_config(
		'@tsrx/fixture-declared-scoped-subpath-project',
		'@consumer/tsrx-compiler/compiler/volar',
		'scoped-subpath',
	),
	'declared-mixed-case-subpath': declared_workspace_config(
		'@tsrx/fixture-declared-mixed-case-subpath-project',
		'@consumer/tsrx-compiler/compileToVolar',
		'mixed-case-subpath',
		{ declared_compiler: { export_subpath: true } },
	),
	'declared-beats-candidates': declared_workspace_config(
		'@tsrx/fixture-declared-priority-project',
		'consumer-tsrx-compiler',
		'declared',
		{
			package_json: { devDependencies: { '@tsrx/ripple': 'workspace:*' } },
			config: { compilers: ['ripple', 'react'] },
		},
	),
	'jsonc-declared': {
		package_json: {
			name: '@tsrx/fixture-jsonc-declared-project',
			private: true,
		},
		tsconfig_source:
			'{\n\t// Consumer-selected TSRX compiler.\n\t"tsrx": { "compiler": "consumer-tsrx-compiler", },\n\t"compilerOptions": {},\n}\n',
		compilers: [],
		declared_compilers: [{ specifier: 'consumer-tsrx-compiler', marker: 'declared' }],
	},
	'malformed-tsconfig': {
		package_json: {
			name: '@tsrx/fixture-malformed-tsconfig-project',
			private: true,
			devDependencies: { '@tsrx/ripple': 'workspace:*' },
		},
		tsconfig_source: '{ "tsrx": { "compiler": "consumer-tsrx-compiler" },\n',
		compilers: ['ripple'],
		declared_compilers: [{ specifier: 'consumer-tsrx-compiler', marker: 'declared' }],
	},
	'malformed-tsconfig-without-tsrx': {
		package_json: {
			name: '@tsrx/fixture-malformed-tsconfig-without-tsrx-project',
			private: true,
			devDependencies: { '@tsrx/ripple': 'workspace:*' },
		},
		tsconfig_source: '{ "compilerOptions": {\n',
		compilers: ['ripple'],
	},
	'invalid-compiler-type': invalid_tsconfig_config('@tsrx/fixture-invalid-compiler-type-project', {
		compiler: 42,
	}),
	'empty-compiler': invalid_tsconfig_config('@tsrx/fixture-empty-compiler-project', {
		compiler: '',
	}),
	'whitespace-only-compiler': invalid_tsconfig_config(
		'@tsrx/fixture-whitespace-only-compiler-project',
		{ compiler: '   ' },
	),
	'invalid-tsrx-type': invalid_tsconfig_config('@tsrx/fixture-invalid-tsrx-type-project', 'string'),
	'relative-declared': {
		package_json: {
			name: '@tsrx/fixture-relative-declared-project',
			private: true,
			devDependencies: { '@tsrx/ripple': 'workspace:*' },
		},
		tsconfig_json: { tsrx: { compiler: './compiler.cjs' }, compilerOptions: {} },
		compilers: ['ripple'],
		relative_compiler: true,
	},
	'unresolvable-declared': {
		package_json: {
			name: '@tsrx/fixture-unresolvable-declared-project',
			private: true,
			devDependencies: { '@tsrx/ripple': 'workspace:*' },
		},
		tsconfig_json: { tsrx: { compiler: 'missing-tsrx-compiler' }, compilerOptions: {} },
		compilers: ['ripple'],
	},
	'invalid-declared-specifier': {
		package_json: {
			name: '@tsrx/fixture-invalid-declared-project',
			private: true,
			imports: { '#internal': './escape.cjs' },
		},
		tsconfig_json: { tsrx: { compiler: '#internal' }, compilerOptions: {} },
		compilers: ['ripple'],
		imports_escape: true,
	},
	'nearest-tsconfig': {
		package_json: {
			name: '@tsrx/fixture-nearest-tsconfig-project',
			private: true,
		},
		tsconfig_json: { tsrx: { compiler: 'consumer-tsrx-compiler' }, compilerOptions: {} },
		nested_tsconfig_json: {
			tsrx: { compiler: 'nested-tsrx-compiler' },
			compilerOptions: {},
		},
		compilers: [],
		declared_compilers: [
			{ specifier: 'consumer-tsrx-compiler', marker: 'declared' },
			{ specifier: 'nested-tsrx-compiler', marker: 'nested', directory: 'nested' },
		],
	},
};

/** @type {string[]} */
const created_workspaces = [];

/**
 * @param {string} workspace_dir
 * @param {keyof typeof COMPILER_STUBS} compiler_name
 */
function write_compiler_stub(workspace_dir, compiler_name) {
	if (compiler_name === 'octane') {
		// Octane's layout: the compiler entry lives INSIDE the octane package.
		const package_dir = path.join(workspace_dir, 'node_modules', 'octane');
		const compiler_dir = path.join(package_dir, 'src', 'compiler');
		fs.mkdirSync(compiler_dir, { recursive: true });
		fs.writeFileSync(
			path.join(package_dir, 'package.json'),
			JSON.stringify({ name: 'octane' }, null, 2) + '\n',
		);
		fs.writeFileSync(path.join(compiler_dir, 'volar.js'), COMPILER_STUBS[compiler_name]);
		return;
	}
	const package_dir = path.join(workspace_dir, 'node_modules', '@tsrx', compiler_name);
	const compiler_dir = path.join(package_dir, 'src');
	fs.mkdirSync(compiler_dir, { recursive: true });
	fs.writeFileSync(
		path.join(package_dir, 'package.json'),
		JSON.stringify({ name: `@tsrx/${compiler_name}` }, null, 2) + '\n',
	);
	fs.writeFileSync(path.join(compiler_dir, 'index.js'), COMPILER_STUBS[compiler_name]);
}

/**
 * @param {string} workspace_dir
 * @param {string} specifier
 * @param {string} marker
 * @param {string} [directory]
 * @param {string[]} [entry_parts]
 * @param {boolean} [export_subpath]
 */
function write_declared_compiler_stub(
	workspace_dir,
	specifier,
	marker,
	directory = '',
	entry_parts,
	export_subpath = false,
) {
	const specifier_parts = specifier.split('/');
	const package_part_count = specifier.startsWith('@') ? 2 : 1;
	const package_name = specifier_parts.slice(0, package_part_count).join('/');
	const subpath_parts = specifier_parts.slice(package_part_count);
	const subpath = subpath_parts.join('/');
	const compiler_dir = path.join(workspace_dir, directory, 'node_modules', package_name);
	fs.mkdirSync(compiler_dir, { recursive: true });
	fs.writeFileSync(
		path.join(compiler_dir, 'package.json'),
		JSON.stringify(
			{
				name: package_name,
				main: entry_parts?.join('/') ?? 'index.cjs',
				...(export_subpath ? { exports: { [`./${subpath}`]: `./${subpath}.js` } } : {}),
			},
			null,
			2,
		) + '\n',
	);
	const compiler_path =
		entry_parts !== undefined
			? path.join(compiler_dir, ...entry_parts)
			: subpath_parts.length === 0
				? path.join(compiler_dir, 'index.cjs')
				: path.join(compiler_dir, ...subpath_parts) + '.js';
	fs.mkdirSync(path.dirname(compiler_path), { recursive: true });
	fs.writeFileSync(
		compiler_path,
		DECLARED_COMPILER_STUB.replace('compiler:declared', `compiler:${marker}`),
	);
}

/**
 * @param {keyof typeof WORKSPACE_CONFIGS} name
 */
export function create_fixture_workspace(name) {
	const config = WORKSPACE_CONFIGS[name];
	if (!config) {
		throw new Error(`Unknown fixture workspace: ${name}`);
	}

	const workspace_dir = fs.mkdtempSync(path.join(os.tmpdir(), `ts-plugin-${name}-`));
	created_workspaces.push(workspace_dir);

	fs.mkdirSync(path.join(workspace_dir, 'src', 'nested', 'components'), { recursive: true });
	fs.writeFileSync(
		path.join(workspace_dir, 'package.json'),
		JSON.stringify(config.package_json, null, 2) + '\n',
	);
	if (config.tsconfig_json || config.tsconfig_source) {
		fs.writeFileSync(
			path.join(workspace_dir, 'tsconfig.json'),
			config.tsconfig_source ?? JSON.stringify(config.tsconfig_json, null, 2) + '\n',
		);
	}
	if (config.nested_tsconfig_json) {
		fs.mkdirSync(path.join(workspace_dir, 'nested'), { recursive: true });
		fs.writeFileSync(
			path.join(workspace_dir, 'nested', 'tsconfig.json'),
			JSON.stringify(config.nested_tsconfig_json, null, 2) + '\n',
		);
	}

	for (const compiler_name of config.compilers) {
		write_compiler_stub(workspace_dir, /** @type {keyof typeof COMPILER_STUBS} */ (compiler_name));
	}
	for (const declared_compiler of config.declared_compilers ?? []) {
		write_declared_compiler_stub(
			workspace_dir,
			declared_compiler.specifier,
			declared_compiler.marker,
			declared_compiler.directory,
			declared_compiler.entry_parts,
			declared_compiler.export_subpath,
		);
	}
	if (config.relative_compiler) {
		fs.writeFileSync(path.join(workspace_dir, 'compiler.cjs'), DECLARED_COMPILER_STUB);
	}
	if (config.imports_escape) {
		fs.writeFileSync(
			path.join(workspace_dir, 'escape.cjs'),
			`require('fs').writeFileSync(__dirname + '/escape-executed', 'executed');\n${DECLARED_COMPILER_STUB}`,
		);
	}

	return workspace_dir;
}

export function cleanup_fixture_workspaces() {
	while (created_workspaces.length > 0) {
		fs.rmSync(/** @type {string} */ (created_workspaces.pop()), { recursive: true, force: true });
	}
}
