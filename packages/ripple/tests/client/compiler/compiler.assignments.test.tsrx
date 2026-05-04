import { RippleArray, effect, track, untrack } from 'ripple';
import { compile } from '@tsrx/ripple';

const EFFECT_BODY_REGEX = /_\$\_\.effect\(\(\) => \{([\s\S]*?)\n\t\}\);/;

describe('compiler > assignments', () => {
	it('properly handles JS assignments, reads and updates to array indices', () => {
		const logs: (number | undefined)[] = [];

		component App() {
			let items: number[] = [];
			let tracked_items = track<number[]>([]);
			let items2 = new Array();
			let items3: RippleArray<number> = new RippleArray();
			let i = 0;

			logs.push(items[0]);
			logs.push(items[i]);
			logs.push(tracked_items.value[0]);
			logs.push(tracked_items.value[i]);
			logs.push(items2[0]);
			logs.push(items2[i]);
			logs.push(items3[0]);
			logs.push(items3[i]);

			items[0] = 123;
			items[i] = 123;
			tracked_items.value[0] = 123;
			tracked_items.value[i] = 123;
			items2[0] = 123;
			items2[i] = 123;
			items3[0] = 123;
			items3[i] = 123;

			logs.push(items[0]);
			logs.push(items[i]);
			logs.push(tracked_items.value[0]);
			logs.push(tracked_items.value[i]);
			logs.push(items2[0]);
			logs.push(items2[i]);
			logs.push(items3[0]);
			logs.push(items3[i]);

			items[0]++;
			items[i]++;
			tracked_items.value[0]++;
			tracked_items.value[i]++;
			items2[0]++;
			items2[i]++;
			items3[0]++;
			items3[i]++;

			logs.push(items[0]);
			logs.push(items[i]);
			logs.push(tracked_items.value[0]);
			logs.push(tracked_items.value[i]);
			logs.push(items2[0]);
			logs.push(items2[i]);
			logs.push(items3[0]);
			logs.push(items3[i]);

			logs.push(--items[0]);
			logs.push(--items[i]);
			logs.push(--tracked_items.value[0]);
			logs.push(--tracked_items.value[i]);
			logs.push(--items2[0]);
			logs.push(--items2[i]);
			logs.push(--items3[0]);
			logs.push(--items3[i]);
		}

		render(App);

		expect(logs).toEqual([
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			123,
			123,
			123,
			123,
			123,
			123,
			123,
			123,
			125,
			125,
			125,
			125,
			125,
			125,
			125,
			125,
			124,
			123,
			124,
			123,
			124,
			123,
			124,
			123,
		]);
	});

	it('compiles tracked values in effect with assignment expression', () => {
		const source = `import { track, effect } from 'ripple';
component App() {
	let &[count] = track(0);

	effect(() => {
		state.count = count;
	});
}`;
		const result = compile(source, 'test.tsrx');
		const effect_match = result.code.match(EFFECT_BODY_REGEX);
		expect(effect_match?.[1].trim()).toMatchSnapshot();
	});

	it('compiles tracked values in effect with update expressions', () => {
		const source = `import { track, effect, untrack } from 'ripple';
component App() {
	let &[count] = track(5);

	effect(() => {
		untrack(() => {
			state.preIncrement = ++count;
			state.postIncrement = count++;
			state.preDecrement = --count;
			state.postDecrement = count--;
		});
	});
}`;
		const result = compile(source, 'test.tsrx');
		const effect_match = result.code.match(EFFECT_BODY_REGEX);
		expect(effect_match?.[1].trim()).toMatchSnapshot();
	});
});
