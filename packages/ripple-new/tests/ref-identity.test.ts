import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { IdentityRef } from './_fixtures/ref-identity.tsrx';

describe('callback ref identity change (React 19 detach-before-attach)', () => {
	it('swapping the callback runs the old cleanup-return before attaching the new', () => {
		const log: string[] = [];
		const a = (el: any) => {
			log.push(el ? 'A:attach' : 'A:null');
			return () => log.push('A:cleanup');
		};
		const b = (el: any) => {
			log.push(el ? 'B:attach' : 'B:null');
			return () => log.push('B:cleanup');
		};

		const r = mount(IdentityRef, { pick: a });
		expect(log).toEqual(['A:attach']);

		r.update(IdentityRef, { pick: b });
		expect(log).toEqual(['A:attach', 'A:cleanup', 'B:attach']);

		r.unmount();
		expect(log).toEqual(['A:attach', 'A:cleanup', 'B:attach', 'B:cleanup']);
	});

	it('a legacy callback (no cleanup) gets null when its identity changes', () => {
		const log: string[] = [];
		const a = (el: any) => log.push(el ? 'A:attach' : 'A:null');
		const b = (el: any) => log.push(el ? 'B:attach' : 'B:null');

		const r = mount(IdentityRef, { pick: a });
		r.update(IdentityRef, { pick: b });
		expect(log).toEqual(['A:attach', 'A:null', 'B:attach']);
		r.unmount();
		expect(log).toEqual(['A:attach', 'A:null', 'B:attach', 'B:null']);
	});

	it('replacing a callback ref with null detaches it (runs cleanup), once', () => {
		const log: string[] = [];
		const a = (el: any) => {
			log.push(el ? 'A:attach' : 'A:null');
			return () => log.push('A:cleanup');
		};

		const r = mount(IdentityRef, { pick: a });
		expect(log).toEqual(['A:attach']);

		r.update(IdentityRef, { pick: null });
		expect(log).toEqual(['A:attach', 'A:cleanup']);

		// No double-detach on unmount — it was already detached.
		r.unmount();
		expect(log).toEqual(['A:attach', 'A:cleanup']);
	});

	it('a stable callback ref is not re-invoked across renders', () => {
		const log: string[] = [];
		const a = (el: any) => {
			log.push(el ? 'A:attach' : 'A:null');
			return () => log.push('A:cleanup');
		};
		const r = mount(IdentityRef, { pick: a });
		r.update(IdentityRef, { pick: a }); // same identity
		r.update(IdentityRef, { pick: a });
		expect(log).toEqual(['A:attach']); // not re-fired
		r.unmount();
		expect(log).toEqual(['A:attach', 'A:cleanup']);
	});
});
