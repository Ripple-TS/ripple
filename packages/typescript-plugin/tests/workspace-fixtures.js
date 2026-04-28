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
};

/** @type {string[]} */
const created_workspaces = [];

/**
 * @param {string} workspace_dir
 * @param {keyof typeof COMPILER_STUBS} compiler_name
 */
function write_compiler_stub(workspace_dir, compiler_name) {
	const compiler_dir = path.join(workspace_dir, 'node_modules', '@tsrx', compiler_name, 'src');
	fs.mkdirSync(compiler_dir, { recursive: true });
	fs.writeFileSync(path.join(compiler_dir, 'index.js'), COMPILER_STUBS[compiler_name]);
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

	for (const compiler_name of config.compilers) {
		write_compiler_stub(workspace_dir, /** @type {keyof typeof COMPILER_STUBS} */ (compiler_name));
	}

	return workspace_dir;
}

export function cleanup_fixture_workspaces() {
	while (created_workspaces.length > 0) {
		fs.rmSync(/** @type {string} */ (created_workspaces.pop()), { recursive: true, force: true });
	}
}
