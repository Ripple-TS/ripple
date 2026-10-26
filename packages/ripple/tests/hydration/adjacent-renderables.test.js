import { describe, expect, it } from 'vitest';
import { flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as ServerComponents from './compiled/server/adjacent-renderables.js';
import * as ClientComponents from './compiled/client/adjacent-renderables.js';

const cases = [
	['AdjacentRenderableProps', '<section><i>one</i><b>two</b></section><button>update</button>'],
	[
		'MixedRenderableValues',
		'<section>before:<i>one</i><b>two</b><i>one</i>&amp;<b>two</b>&lt;after</section>',
	],
];

describe.each(['mount', 'hydrate'])('adjacent renderables > %s', (mode) => {
	it.each(cases)('renders %s', async (name, expected) => {
		let server_elements;
		if (mode === 'hydrate') {
			const { body } = await render(ServerComponents[name]);
			expect(body).toBeHtml(expected);
			container.innerHTML = body;
			server_elements = Array.from(container.querySelectorAll('*'));
		}

		const unmount = (mode === 'hydrate' ? hydrate : mount)(ClientComponents[name], {
			target: container,
		});
		expect(container.innerHTML).toBeHtml(expected);
		server_elements?.forEach((element, index) => {
			expect(container.querySelectorAll('*')[index]).toBe(element);
		});

		if (name === 'AdjacentRenderableProps') {
			container.querySelector('button').click();
			flushSync();
			expect(container.innerHTML).toBeHtml(
				'<section>three<em>four</em></section><button>update</button>',
			);
		}

		unmount();
		expect(container.innerHTML).toBeHtml('');
	});
});
