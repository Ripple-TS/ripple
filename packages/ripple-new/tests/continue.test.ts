import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import {
	FilterList,
	MultiContinue,
	NoBraces,
	Stateful,
	ReturnInComponentContinueInLoop,
} from './_fixtures/continue.tsrx';

describe('continue in for-of', () => {
	it('skips rendering for matching items', () => {
		const r = mount(FilterList, {
			items: [
				{ id: 1, label: 'a', hidden: false },
				{ id: 2, label: 'b', hidden: true },
				{ id: 3, label: 'c', hidden: false },
				{ id: 4, label: 'd', hidden: true },
			],
		});
		expect(r.findAll('li').map((li) => li.textContent)).toEqual(['a', 'c']);
		r.unmount();
	});

	it('multiple continues — each gates the remainder', () => {
		const r = mount(MultiContinue, {
			items: [
				{ id: 1, label: 'a', skipA: false, skipB: false }, // badge + A + B
				{ id: 2, label: 'b', skipA: false, skipB: true }, // badge + A
				{ id: 3, label: 'c', skipA: true, skipB: false }, // badge only
				{ id: 4, label: 'd', skipA: true, skipB: true }, // badge only (first skipA wins)
			],
		});
		expect(r.findAll('.badge')).toHaveLength(4);
		expect(r.findAll('.a').map((el) => el.textContent)).toEqual(['A:a', 'A:b']);
		expect(r.findAll('.b').map((el) => el.textContent)).toEqual(['B:a']);
		r.unmount();
	});

	it('handles no-braces continue form', () => {
		const r = mount(NoBraces, {
			items: [
				{ id: 1, label: 'x', hidden: true },
				{ id: 2, label: 'y', hidden: false },
			],
		});
		expect(r.findAll('li').map((li) => li.textContent)).toEqual(['y']);
		r.unmount();
	});

	it('items reappear when their guard flips false', () => {
		const r = mount(Stateful);
		expect(r.findAll('li').map((li) => li.textContent)).toEqual(['a', 'c']);
		r.click('#show2');
		expect(r.findAll('li').map((li) => li.textContent)).toEqual(['a', 'b', 'c']);
		r.click('#hide1');
		expect(r.findAll('li').map((li) => li.textContent)).toEqual(['b', 'c']);
		r.unmount();
	});

	it('combines with component-level early-return without interference', () => {
		const r = mount(ReturnInComponentContinueInLoop, {
			hideAll: false,
			items: [
				{ id: 1, label: 'a', skip: false },
				{ id: 2, label: 'b', skip: true },
				{ id: 3, label: 'c', skip: false },
			],
		});
		expect(r.findAll('li').map((li) => li.textContent)).toEqual(['a', 'c']);
		r.update(ReturnInComponentContinueInLoop, {
			hideAll: true,
			items: [{ id: 1, label: 'a', skip: false }],
		});
		expect(r.findAll('li')).toHaveLength(0);
		expect(r.findAll('ul')).toHaveLength(0);
		r.unmount();
	});
});
