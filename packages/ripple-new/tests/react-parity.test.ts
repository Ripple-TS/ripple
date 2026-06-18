import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { flushSync } from '../src/index.js';
import { mountApp, rerender, ThemeApp, CamelStyle } from './_fixtures/react-parity.tsrx';

// React-parity API additions: root.render(<App/>), useContext, camelCase style.

describe('root.render(<App/>) — React element form', () => {
	function setup(label: string) {
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = mountApp(container, label);
		flushSync(() => {}); // commit the initial render
		return {
			container,
			root,
			btn: () => container.querySelector('#app-btn') as HTMLElement,
			text: () => (container.querySelector('#app-btn') as HTMLElement)?.textContent,
			teardown: () => {
				root.unmount();
				container.remove();
			},
		};
	}

	it('renders the component passed as a JSX element with its props', () => {
		const t = setup('count');
		expect(t.text()).toBe('count:5');
		t.teardown();
	});

	it('re-rendering with the same component (element form) updates props and preserves state', () => {
		const t = setup('count');
		// Bump local state so we can tell reuse from remount.
		flushSync(() => t.btn().click());
		expect(t.text()).toBe('count:6');
		// Re-render via root.render(<App label="changed"/>): same component identity,
		// so the block is reused (n stays 6) and the new prop is applied.
		flushSync(() => rerender(t.root, 'changed'));
		expect(t.text()).toBe('changed:6');
		t.teardown();
	});
});

describe('useContext(Context)', () => {
	it('reads the nearest Provider value (alias of use(Context))', () => {
		const r = mount(ThemeApp, { theme: 'dark' });
		expect(r.find('#theme-read').textContent).toBe('dark');
		r.update(ThemeApp, { theme: 'light' });
		expect(r.find('#theme-read').textContent).toBe('light');
		r.unmount();
	});
});

describe('camelCase style', () => {
	it('accepts camelCase keys, kebab-case keys, vendor prefixes, and custom props', () => {
		const r = mount(CamelStyle, {
			style: {
				fontSize: '20px', // camelCase
				'background-color': 'rgb(255, 0, 0)', // kebab still works
				WebkitTransform: 'scale(2)', // vendor prefix → -webkit-transform
				'--my-var': 'blue', // custom property (case preserved, untouched)
			},
		});
		const el = r.find('#cs') as HTMLElement;
		expect(el.style.fontSize).toBe('20px');
		expect(el.style.backgroundColor).toBe('rgb(255, 0, 0)');
		expect(el.style.getPropertyValue('-webkit-transform')).toBe('scale(2)');
		expect(el.style.getPropertyValue('--my-var')).toBe('blue');
		r.unmount();
	});

	it('removes a camelCase property when it disappears from the next style object', () => {
		const r = mount(CamelStyle, { style: { fontSize: '20px', color: 'green' } });
		const el = r.find('#cs') as HTMLElement;
		expect(el.style.fontSize).toBe('20px');
		// Drop fontSize on the next render — the diff must removeProperty('font-size').
		r.update(CamelStyle, { style: { color: 'green' } });
		expect(el.style.fontSize).toBe('');
		expect(el.style.color).toBe('green');
		r.unmount();
	});
});
