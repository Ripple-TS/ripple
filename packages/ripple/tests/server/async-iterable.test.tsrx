import { getTrackedStatus, trackAsync } from 'ripple';
import { prerender, render } from 'ripple/server';

for (const renderResult of [render, prerender]) {
	it(
		`${renderResult.name}: hands off after exactly one yield, with status and cleanup`,
		async () => {
			let pulls = 0;
			let closes = 0;
			function App() @{
				const result = trackAsync(async function* () {
					try {
						pulls++;
						yield { cursor: 100 };
						pulls++;
						await new Promise(() => {});
					} finally {
						closes++;
					}
				});
				<>
					<p>{result.value.cursor}</p>
					<span>{JSON.stringify(getTrackedStatus(result))}</span>
				</>
			}
			const { body } = await renderResult(App);
			expect(pulls).toBe(1);
			expect(closes).toBe(1);
			expect(body).toContain('100');
			expect(body).toContain('"c":1');
			expect(body).toContain('"complete":false');
			expect(body).toContain('"state":"ready"');
			expect((body.match(/id="__ripple_ta_/g) ?? []).length).toBe(1);
		},
	);

	it(`${renderResult.name}: supports a promise of an iterable and valid undefined`, async () => {
		function App() @{
			const result = trackAsync(
				() => Promise.resolve(
					(async function* () {
						yield undefined;
					})(),
				),
			);
			<p>{String(result.value)}</p>
		}
		const { body } = await renderResult(App);
		expect(body).toContain('undefined');
		expect(body).toContain('"c":1');
	});

	it(`${renderResult.name}: rejects an empty initial source`, async () => {
		function App() @{
			@try {
				const result = trackAsync(async function* () {});
				<p>{result.value}</p>
			} @catch {
				<p class="error">empty</p>
			}
		}
		const { body } = await renderResult(App);
		expect(body).toContain('class="error"');
		expect(body).toContain('"ok":false');
	});
}
