import { beforeEach, describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { getRippleLanguagePlugin, _reset_for_test } from '../src/language.js';

/** @import { TSRXVirtualCode } from '../src/language.js' */

/**
 * @param {string} source
 * @returns {import('typescript').IScriptSnapshot}
 */
function create_snapshot(source) {
	return ts.ScriptSnapshot.fromString(source);
}

/**
 * @param {string} source
 * @returns {TSRXVirtualCode}
 */
function create_virtual_code(source) {
	const plugin = getRippleLanguagePlugin();
	const create_virtual_code_fn = plugin.createVirtualCode;
	if (typeof create_virtual_code_fn !== 'function') {
		throw new Error('Language plugin does not expose createVirtualCode');
	}

	/** @type {import('@volar/language-core').CodegenContext<string>} */
	const ctx = { getAssociatedScript: () => undefined };

	return /** @type {TSRXVirtualCode} */ (
		create_virtual_code_fn('/App.tsrx', 'ripple', create_snapshot(source), ctx)
	);
}

describe('volar completion mappings', () => {
	beforeEach(() => {
		_reset_for_test();
	});

	it('emits an exact completion-enabled mapping for a typed "@" amid JSX text', () => {
		const source = `export default function App() {
	return (
		<div>
			@
		</div>
	);
}
`;
		const virtual_code = create_virtual_code(source);
		expect(virtual_code.fatalErrors).toEqual([]);

		const at_source_offset = source.indexOf('@');
		const at_generated_offset = virtual_code.generatedCode.indexOf('@');
		const mapping = virtual_code.mappings.find(
			(m) => m.sourceOffsets[0] === at_source_offset && m.data?.completion,
		);

		expect(mapping).toBeDefined();
		expect(mapping?.lengths[0]).toBe(1);
		expect(mapping?.generatedOffsets[0]).toBe(at_generated_offset);
		expect(mapping?.generatedLengths?.[0]).toBe(1);
	});

	it('emits exact completion-enabled mappings for a partial "@i" directive in JSX text', () => {
		const source = `export default function App() {
	return (
		<div>
			hello @i
		</div>
	);
}
`;
		const virtual_code = create_virtual_code(source);
		expect(virtual_code.fatalErrors).toEqual([]);

		const at_source_offset = source.indexOf('@i');
		const at_generated_offset = virtual_code.generatedCode.indexOf('@i');
		const mapping = virtual_code.mappings.find(
			(m) => m.sourceOffsets[0] === at_source_offset && m.data?.completion,
		);

		expect(mapping).toBeDefined();
		expect(mapping?.lengths[0]).toBe(2);
		expect(mapping?.generatedOffsets[0]).toBe(at_generated_offset);
		expect(mapping?.generatedLengths?.[0]).toBe(2);

		// plain text without '@' gets no mapping, so completions aren't offered there
		const hello_offset = source.indexOf('hello');
		const hello_mapping = virtual_code.mappings.find((m) => m.sourceOffsets[0] === hello_offset);
		expect(hello_mapping).toBeUndefined();
	});

	it('keeps full completion mappings for a valueless event attribute (mid-typing onC)', () => {
		const source = `export default function App() {
	return <div class="shown" onC>{'hi'}</div>;
}
`;
		const virtual_code = create_virtual_code(source);

		// compile finishes with a normal error, not a fatal one that would drop all
		// the mappings and fall back to a single straight-through map
		expect(virtual_code.fatalErrors).toEqual([]);
		expect(virtual_code.usageErrors.length).toBeGreaterThan(0);
		expect(virtual_code.generatedCode).not.toBe(source);
		expect(virtual_code.mappings.length).toBeGreaterThan(1);

		const completion_mappings = virtual_code.mappings.filter((m) => m.data?.completion);
		expect(completion_mappings.length).toBeGreaterThan(0);

		// a completion mapping covers the 'onC' attribute
		const onc_offset = source.indexOf('onC');
		const covering = completion_mappings.find((m) =>
			m.sourceOffsets.some(
				(offset, i) => onc_offset >= offset && onc_offset < offset + m.lengths[i],
			),
		);
		expect(covering).toBeDefined();
	});

	it('keeps completion enabled on the parse-error fallback mapping', () => {
		const source = `export default function App() @{
	let x = 1;
	@
	<div>{x}</div>
}
`;
		const virtual_code = create_virtual_code(source);
		expect(virtual_code.fatalErrors.length).toBeGreaterThan(0);

		// the fallback maps source straight through, position for position
		expect(virtual_code.generatedCode).toBe(source);
		expect(virtual_code.mappings).toHaveLength(1);
		expect(virtual_code.mappings[0].sourceOffsets).toEqual([0]);
		expect(virtual_code.mappings[0].lengths).toEqual([source.length]);
		expect(virtual_code.mappings[0].data?.completion).toBe(true);
		expect(virtual_code.mappings[0].data?.verification).toBe(true);
	});
});
