import { createRequire } from 'module';
import noModuleScopeTrack from './rules/no-module-scope-track.js';
import preferOnInput from './rules/prefer-oninput.js';
import noReturnInComponent from './rules/no-return-in-component.js';
import controlFlowJsx from './rules/control-flow-jsx.js';
import noLazyDestructuringInModules from './rules/no-lazy-destructuring-in-modules.js';
import validForOfKey from './rules/valid-for-of-key.js';
import requireStatementContainerBody from './rules/require-statement-container-body.js';

const plugin = {
	meta: {
		name: '@tsrx/eslint-plugin',
		version: '0.1.3',
	},
	rules: {
		'no-module-scope-track': noModuleScopeTrack,
		'prefer-oninput': preferOnInput,
		'no-return-in-component': noReturnInComponent,
		'control-flow-jsx': controlFlowJsx,
		'no-lazy-destructuring-in-modules': noLazyDestructuringInModules,
		'valid-for-of-key': validForOfKey,
		'require-statement-container-body': requireStatementContainerBody,
	},
	configs: {} as any,
};

// Try to load optional parsers
const require = createRequire(import.meta.url);

let rippleParser: any;
let tsParser: any;

try {
	rippleParser = require('@tsrx/eslint-parser');
} catch {
	// @tsrx/eslint-parser is optional
	rippleParser = null;
}

try {
	tsParser = require('@typescript-eslint/parser');
} catch {
	// @typescript-eslint/parser is optional
	tsParser = null;
}

// Helper to create config objects
function createConfig(name: string, files: string[], parser: any, isTsrx: boolean) {
	const rules: Record<string, string> = {
		'ripple/no-module-scope-track': 'error',
		'ripple/prefer-oninput': 'warn',
		'ripple/control-flow-jsx': 'error',
		'ripple/no-lazy-destructuring-in-modules': 'error',
		'ripple/valid-for-of-key': 'error',
	};

	if (isTsrx) {
		rules['ripple/require-statement-container-body'] = 'error';
	}

	const config: any = {
		name,
		files,
		plugins: {
			ripple: plugin,
		},
		rules,
	};

	// Only add parser if it's available
	if (parser) {
		config.languageOptions = {
			parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		};
	}

	return config;
}

// Recommended configuration (flat config format)
plugin.configs.recommended = [
	createConfig('ripple/recommended-ripple-files', ['**/*.tsrx'], rippleParser, true),
	createConfig('ripple/recommended-typescript-files', ['**/*.ts', '**/*.tsx'], tsParser, false),
	{
		name: 'ripple/ignores',
		ignores: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/build/**'],
	},
];

// Strict configuration (flat config format)
plugin.configs.strict = [
	createConfig('ripple/strict-ripple-files', ['**/*.tsrx'], rippleParser, true),
	createConfig('ripple/strict-typescript-files', ['**/*.ts', '**/*.tsx'], tsParser, false),
	{
		name: 'ripple/ignores',
		ignores: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/build/**'],
	},
];

export default plugin;
