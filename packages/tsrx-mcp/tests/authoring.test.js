import { describe, expect, it } from 'vitest';
import {
	review_tsrx_accessibility,
	review_tsrx_components,
	review_tsrx_styles,
} from '../src/index.js';

describe('@tsrx/mcp authoring reviews', () => {
	it('flags source patterns that commonly become Axe failures', () => {
		const result = review_tsrx_accessibility({
			target: 'react',
			filename: 'App.tsrx',
			code: `export component App() {
				<form>
					<button type="submit">"Add task"</button>
					<input id={\`todo-\${todo.id}\`} type="checkbox" />
				</form>
			}`,
		});

		expect(result.ok).toBe(false);
		expect(result.issues.map((issue) => issue.kind)).toEqual(
			expect.arrayContaining([
				'direct-quoted-text',
				'button-accessible-name',
				'input-accessible-name',
			]),
		);
	});

	it('accepts expression text and directly named form controls', () => {
		const result = review_tsrx_accessibility({
			target: 'react',
			filename: 'App.tsrx',
			code: `export component App() {
				<form>
					<label htmlFor="todo-input">{'Todo title'}</label>
					<input id="todo-input" type="text" />
					<input type="checkbox" aria-label="Mark task as complete" />
					<button type="submit">{'Add task'}</button>
				</form>
			}`,
		});

		expect(result.ok).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it('flags style patterns that can hide contrast or produce invalid CSS', () => {
		const result = review_tsrx_styles({
			target: 'react',
			filename: 'App.tsrx',
			code: `export component App() {
				<main class="app-shell">
					<p class="eyebrow">{'Daily Flow'}</p>
				</main>
				<style>
					:scope {
						background: #0f172a;
						color: #7dd3fc;
					}
					* {
						box-sizing: border-box;
					}
				</style>
			}`,
		});

		expect(result.ok).toBe(false);
		expect(result.issues.map((issue) => issue.kind)).toEqual(
			expect.arrayContaining([
				'scope-root-style',
				'contrast-risk-with-scope-background',
				'universal-selector',
			]),
		);
	});

	it('recommends component extraction for dense generated components', () => {
		const repeated_items = Array.from(
			{ length: 18 },
			(_, index) => `<div class="row-${index}">{'Row ${index}'}</div>`,
		).join('\n');
		const result = review_tsrx_components({
			target: 'react',
			filename: 'App.tsrx',
			code: `export component App() {
				if (items.length === 0) {
					<p>{'Empty'}</p>
				} else {
					<ul>
						for (const item of items; key item.id) {
							if (item.visible) {
								<li>{item.label}</li>
							}
						}
					</ul>
				}
				switch (mode) {
					case 'grid':
						<section>${repeated_items}</section>
				}
			}`,
		});

		expect(result.ok).toBe(true);
		expect(result.issues.map((issue) => issue.kind)).toContain('control-flow-depth');
	});
});
