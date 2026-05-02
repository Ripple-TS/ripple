component ForContinueApp() {
	const items = ['a', '', 'c'];

	for (const item of items) {
		if (!item) continue;
		<li class="continue-item" key={item}>{item}</li>
	}
}

describe('@tsrx/vite-plugin-preact runtime', () => {
	it('skips for-of iterations with continue', async () => {
		await render(ForContinueApp);
		expect(
			Array.from(container.querySelectorAll('.continue-item'), (item) => item.textContent),
		).toEqual([
			'a',
			'c',
		]);
	});
});
