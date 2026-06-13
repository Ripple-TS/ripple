import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { App } from './_fixtures/portal.tsrx';

describe('portal', () => {
	it('renders content into a foreign DOM target, with context flowing through', () => {
		const portalTarget = document.createElement('section');
		document.body.appendChild(portalTarget);

		const r = mount(App, { target: portalTarget });

		// The modal's DOM lives in portalTarget, NOT in the app container.
		expect(r.findAll('.modal')).toHaveLength(0);
		expect(portalTarget.querySelector('.modal')).not.toBe(null);

		// Context (the `Theme.Provider value="dark"`) flows through the portal.
		expect(portalTarget.querySelector('.child')!.textContent).toBe('dark');

		r.unmount();
		expect(portalTarget.querySelector('.modal')).toBe(null);
		portalTarget.remove();
	});

	it('unmounts portal content when the if-branch closes', () => {
		const portalTarget = document.createElement('section');
		document.body.appendChild(portalTarget);

		const r = mount(App, { target: portalTarget });
		expect(portalTarget.querySelector('.modal')).not.toBe(null);

		r.click('button'); // close
		expect(portalTarget.querySelector('.modal')).toBe(null);

		r.click('button'); // reopen
		expect(portalTarget.querySelector('.modal')).not.toBe(null);

		r.unmount();
		portalTarget.remove();
	});
});
