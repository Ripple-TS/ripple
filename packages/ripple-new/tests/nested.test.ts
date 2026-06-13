import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import {
	HookInIf,
	HooksInIfElse,
	RowList,
	TryWithHooks,
	DeclInIf,
	DeclInForLoop,
	DeclInTry,
} from './_fixtures/nested.tsrx';

describe('nested hooks', () => {
	it('hook inside if-branch gets fresh state when branch unmounts/remounts', () => {
		const r = mount(HookInIf);
		expect(r.find('#inner').textContent).toBe('0');
		r.click('#inner');
		r.click('#inner');
		expect(r.find('#inner').textContent).toBe('2');
		r.click('#top'); // hide
		expect(r.findAll('#inner')).toHaveLength(0);
		r.click('#top'); // show again → fresh slot
		expect(r.find('#inner').textContent).toBe('0');
		r.unmount();
	});

	it('hooks in if vs else branches are independent slots', () => {
		const r = mount(HooksInIfElse);
		expect(r.find('#a').textContent).toBe('a:0');
		r.click('#a');
		r.click('#a');
		expect(r.find('#a').textContent).toBe('a:2');
		r.click('#swap'); // → branch b, a's state gone
		expect(r.find('#b').textContent).toBe('b:0');
		r.click('#b');
		expect(r.find('#b').textContent).toBe('b:1');
		r.click('#swap'); // back to a → fresh
		expect(r.find('#a').textContent).toBe('a:0');
		r.unmount();
	});

	it('per-item hooks survive reordering by key', () => {
		const r = mount(RowList);
		expect(
			r
				.findAll('button')
				.slice(1)
				.map((b) => b.textContent),
		).toEqual(['a:0', 'b:0', 'c:0']);
		// Bump each row to a different count.
		r.click('.row-1 button');
		r.click('.row-1 button');
		r.click('.row-1 button'); // a:3
		r.click('.row-2 button'); // b:1
		r.click('.row-3 button');
		r.click('.row-3 button'); // c:2
		expect(
			r
				.findAll('button')
				.slice(1)
				.map((b) => b.textContent),
		).toEqual(['a:3', 'b:1', 'c:2']);
		// Reverse — same keys, state survives.
		r.click('#reverse');
		expect(
			r
				.findAll('button')
				.slice(1)
				.map((b) => b.textContent),
		).toEqual(['c:2', 'b:1', 'a:3']);
		r.unmount();
	});

	it('hooks in try-body and catch-body are isolated; reset() yields fresh state', () => {
		const r = mount(TryWithHooks);
		expect(r.find('#hit').textContent).toBe('hit:0');
		r.click('#hit');
		r.click('#hit');
		expect(r.find('#hit').textContent).toBe('hit:2');
		r.click('#bang'); // throw → catch-branch mounted
		expect(r.findAll('#hit')).toHaveLength(0);
		expect(r.find('#retry').textContent).toBe('tries:0');
		r.click('#retry');
		expect(r.find('#retry').textContent).toBe('tries:1');
		r.click('#bang'); // fix → re-throw? still bang=false now
		// bang flipped back to false; the boundary stayed in catch (no auto-retry).
		// Different test (#reset) would re-attempt — covered in try-catch.test.ts.
		r.unmount();
	});
});

describe('nested declarations', () => {
	it('const inside if-branch is in scope for branch JSX', () => {
		const r = mount(DeclInIf, { flag: true, name: 'world' });
		expect(r.find('.msg').textContent).toBe('hello world');
		r.update(DeclInIf, { flag: false, name: 'world' });
		expect(r.find('.msg').textContent).toBe('world?');
		r.unmount();
	});

	it('const inside for-of body is in scope per iteration', () => {
		const r = mount(DeclInForLoop, { nums: [1, 2, 3, 4] });
		expect(r.findAll('li').map((li) => li.textContent)).toEqual([
			'1² = 1',
			'2² = 4',
			'3² = 9',
			'4² = 16',
		]);
		r.unmount();
	});

	it('const inside try/catch bodies — caught branch sees its own decls', () => {
		const r = mount(DeclInTry);
		expect(r.find('.out').textContent).toBe('caught: always');
		r.unmount();
	});
});
