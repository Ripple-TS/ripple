import { describe, it, expect } from 'vitest';
import { mount } from 'ripple';

describe('mount cleanup', () => {
	it('cleanup does not throw for a component that renders a DOM element', () => {
		component Button() {
			<button type="button">{'Click me'}</button>
		}

		const target = document.createElement('div');
		document.body.appendChild(target);

		const cleanup = mount(Button, { target });
		expect(target.querySelector('button')).toBeTruthy();

		expect(() => cleanup()).not.toThrow();
		expect(target.querySelector('button')).toBeNull();

		document.body.removeChild(target);
	});
});
