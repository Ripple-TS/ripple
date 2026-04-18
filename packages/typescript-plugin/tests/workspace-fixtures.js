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
};

const WORKSPACE_CONFIGS = {
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
};

const created_workspaces = [];

function write_compiler_stub(workspace_dir, compiler_name) {
	const compiler_dir = path.join(workspace_dir, 'node_modules', '@tsrx', compiler_name, 'src');
	fs.mkdirSync(compiler_dir, { recursive: true });
	fs.writeFileSync(path.join(compiler_dir, 'index.js'), COMPILER_STUBS[compiler_name]);
}

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
		write_compiler_stub(workspace_dir, compiler_name);
	}

	return workspace_dir;
}

export function cleanup_fixture_workspaces() {
	while (created_workspaces.length > 0) {
		fs.rmSync(created_workspaces.pop(), { recursive: true, force: true });
	}
}
