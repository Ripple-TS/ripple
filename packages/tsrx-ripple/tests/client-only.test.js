import { compile } from '../src/index.js';
import { describe, expect, it } from 'vitest';

const source = `import { track } from 'ripple';

export function App() @{
	const count = track(0);
	<div>
		<span>{count.value}</span>
		<b>static</b>
		@if (count.value > 1) {
			<i>many</i>
		}
	</div>
}`;

describe('@tsrx/ripple client-only output (hydration: false)', () => {
	it('emits bare DOM reads, no cursor pops, and no track hashes', () => {
		const { code, errors } = compile(source, 'App.tsrx', { hydration: false });
		expect(errors).toEqual([]);
		expect(code).toContain('div.firstChild');
		expect(code).not.toContain('_$_.hydrating');
		expect(code).not.toContain('_$_.hydrate_child');
		expect(code).not.toContain('_$_.hydrate_sibling');
		expect(code).not.toContain('_$_.pop(');
		expect(code).toMatch(/_\$_\.track\(0, __block\)/);
	});

	it('keeps the hydration cursor and hashes by default', () => {
		const { code } = compile(source, 'App.tsrx');
		expect(code).toContain('_$_.hydrating ? _$_.hydrate_child() : div.firstChild');
		expect(code).toContain('_$_.hydrating && _$_.pop(div)');
		expect(code).toMatch(/_\$_\.track\(0, __block, '[0-9a-z]+'\)/);
	});
});
