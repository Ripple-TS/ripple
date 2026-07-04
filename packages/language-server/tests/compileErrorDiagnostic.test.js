import { describe, expect, it } from 'vitest';
import { create_completion_harness, create_diagnostic_harness } from './setup.js';

const INVOKED = { triggerKind: 1 };

// User typed `onC` on the way to `onClick`. The compile must survive with an
// error pointing at the attribute, so the squiggle lands there (not at the top
// of the file) and completions still work at the cursor.
const ONC_FIXTURE = `export default function App() {
	return <div class="shown" onC>{'hi'}</div>;
}
`;

describe('compile error diagnostic plugin', () => {
	it('ranges the valueless-event-attribute error on the attribute itself', async () => {
		const { document, service, uri } = create_diagnostic_harness(ONC_FIXTURE);
		const diagnostics = await service.getDiagnostics(uri);

		expect(diagnostics.length).toBeGreaterThan(0);
		const diagnostic = diagnostics.find((d) => /event attribute/i.test(d.message));
		expect(diagnostic).toBeDefined();

		// not pinned to the top of the file
		expect(diagnostic?.range.start).not.toEqual({ line: 0, character: 0 });

		// the range covers the `onC` attribute
		const start_offset = document.offsetAt(diagnostic.range.start);
		const end_offset = document.offsetAt(diagnostic.range.end);
		const onc_offset = ONC_FIXTURE.indexOf('onC');
		expect(start_offset).toBeLessThanOrEqual(onc_offset);
		expect(end_offset).toBeGreaterThanOrEqual(onc_offset + 'onC'.length);
	});

	it('keeps completions alive at the cursor right after "onC"', async () => {
		const { service, uri } = create_completion_harness(ONC_FIXTURE);
		// cursor right after `onC` on line 1
		const cursor = { line: 1, character: '\treturn <div class="shown" onC'.length };
		const result = await service.getCompletionItems(uri, cursor, INVOKED);

		expect(result.items.length).toBeGreaterThan(0);
	});
});
