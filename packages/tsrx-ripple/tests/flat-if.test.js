import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

/**
 * @param {string} source
 */
function client(source) {
	return compile(source, 'App.tsrx', { mode: 'client' }).code;
}

describe('flat @if lowering', () => {
	it('lowers an @if / @else over simple element branches into one block', () => {
		const code = client(`
			export function App(props) @{
				@if (props.code) {
					<pre class="code"><code>{String(props.text)}</code></pre>
				} @else {
					<p class="text" onClick={() => props.pick()}>{String(props.text)}</p>
				}
			}
		`);

		expect(code).toContain('_$_.if_flat(');
		expect(code).not.toContain('_$_.if(');
		expect(code).toContain('var __c = props.code ? 0 : 1;');
		expect(code).toContain('_$_.flat_swap(__s, __c);');
		// Each branch's setup keeps its nodes and last values on the state.
		expect(code).toContain('__s.b0_expression = expression;');
		expect(code).toContain('_$_.set_text(__s.b1_expression_1, __s.b1a = __b1a);');
		// No branch has a render block of its own.
		expect(code).not.toContain('_$_.render(');
	});

	it('uses -1 for no branch when there is no @else', () => {
		const code = client(`
			export function App(props) @{
				@if (props.show) {
					<p>{String(props.text)}</p>
				}
			}
		`);

		expect(code).toContain('_$_.if_flat(');
		expect(code).toContain('var __c = props.show ? 0 : -1;');
	});

	it('keeps the block-per-branch lowering when a branch needs a block', () => {
		const component = client(`
			import { Child } from './child.tsrx';
			export function App(props) @{
				@if (props.show) {
					<Child />
				} @else {
					<p>{'no'}</p>
				}
			}
		`);
		expect(component).toContain('_$_.if(');
		expect(component).not.toContain('_$_.if_flat(');

		const nested = client(`
			export function App(props) @{
				@if (props.show) {
					<div>
						@for (const item of props.items) {
							<p>{String(item)}</p>
						}
					</div>
				}
			}
		`);
		expect(nested).toContain('_$_.if(');
		expect(nested).not.toContain('_$_.if_flat(');

		const chain = client(`
			export function App(props) @{
				@if (props.a) {
					<p>{'a'}</p>
				} @else if (props.b) {
					<p>{'b'}</p>
				}
			}
		`);
		expect(chain).toContain('_$_.if(');
	});
});
