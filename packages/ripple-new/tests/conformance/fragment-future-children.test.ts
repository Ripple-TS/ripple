import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FragmentInstance } from '../../src/index.js';
import { FutureChildren, FragmentRefUpdate } from './_fixtures/fragment-future.tsrx';

// React canary enableFragmentRefs: listeners/observers added to a FragmentInstance
// apply to children that mount LATER, and are detached from children that unmount.
describe('FragmentInstance — future children', () => {
	it('a listener added before a child existed still fires on that child once it mounts', () => {
		const fragRef: { current: FragmentInstance | null } = { current: null };
		const r = mount(FutureChildren, { fragRef });
		const fi = fragRef.current!;
		let count = 0;
		fi.addEventListener('click', () => count++);

		// #a was present when the listener was added.
		r.find('#a').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(count).toBe(1);
		expect(r.findAll('#b')).toHaveLength(0);

		// Mount #b into the live fragment — it must pick up the existing listener.
		r.click('#toggle');
		expect(r.findAll('#b')).toHaveLength(1);
		r.find('#b').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(count).toBe(2);

		r.unmount();
	});

	it('removeEventListener stops future children from getting the listener', () => {
		const fragRef: { current: FragmentInstance | null } = { current: null };
		const r = mount(FutureChildren, { fragRef });
		const fi = fragRef.current!;
		let count = 0;
		const handler = () => count++;
		fi.addEventListener('click', handler);
		fi.removeEventListener('click', handler);

		r.click('#toggle'); // add #b after removal
		r.find('#b').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(count).toBe(0);
		r.unmount();
	});

	it('an observer added before a child existed observes it once it mounts', () => {
		const fragRef: { current: FragmentInstance | null } = { current: null };
		const observed: Element[] = [];
		const observer = { observe: (el: Element) => observed.push(el), unobserve: () => {} };
		const r = mount(FutureChildren, { fragRef });
		const fi = fragRef.current!;
		fi.observeUsing(observer);
		expect(observed).toContain(r.find('#a'));

		r.click('#toggle'); // add #b
		const b = r.find('#b');
		expect(observed).toContain(b);
		r.unmount();
	});
});

describe('FragmentInstance — changing ref expression (update path)', () => {
	it('detaches the old fragment ref and attaches the new one on a ref change', () => {
		const log: string[] = [];
		const a = (fi: any) => log.push(fi ? 'a:attach' : 'a:null');
		const b = (fi: any) => log.push(fi ? 'b:attach' : 'b:null');

		const r = mount(FragmentRefUpdate, { pick: a });
		expect(log).toEqual(['a:attach']);

		r.update(FragmentRefUpdate, { pick: b });
		expect(log).toEqual(['a:attach', 'a:null', 'b:attach']);

		r.unmount();
		expect(log).toEqual(['a:attach', 'a:null', 'b:attach', 'b:null']);
	});
});
