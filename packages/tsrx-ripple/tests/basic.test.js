import { runSharedClassComponentDeclarationTests } from '@tsrx/core/test-harness/compile';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedClassComponentDeclarationTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});
