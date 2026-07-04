import { describe, expect, it } from 'vitest';
import { create_ts_completion_harness as harness } from './setup.js';

const INVOKED = { triggerKind: 1 };

/**
 * @param {import('@volar/language-server').CompletionList} result
 * @returns {string[]} labels with the optional-member '?' marker stripped
 */
function labels_of(result) {
	return result.items.map((item) => String(item.label).replace(/\?$/, ''));
}

describe('JSX completions through the TypeScript layer', () => {
	it('offers intrinsic element completions like "div" inside an open JSX tag', async () => {
		const source = `export default function App() {
	return (
		<div>
			<di></di>
		</div>
	);
}
`;
		const { service, uri } = harness(source, 'jsx-elements.tsrx');
		// cursor at the end of '<di' on line 3 ("\t\t\t<di></di>")
		const result = await service.getCompletionItems(uri, { line: 3, character: 6 }, INVOKED);

		expect(labels_of(result)).toContain('div');
	});

	it('offers ripple/jsx-runtime attribute completions like "onClick" on a div', async () => {
		const source = `export default function App() {
	const handle = () => {};
	return <div onC={handle}></div>;
}
`;
		const { service, uri } = harness(source, 'jsx-attributes.tsrx');
		// cursor at the end of 'onC' on line 2 ("\treturn <div onC={handle}></div>;")
		const result = await service.getCompletionItems(uri, { line: 2, character: 16 }, INVOKED);
		const labels = labels_of(result);

		expect(labels).toContain('onClick');
		// onClickCapture (the capture-phase variant) also comes from ripple's jsx types
		expect(labels).toContain('onClickCapture');
	});
});
