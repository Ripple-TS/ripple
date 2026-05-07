describe('for statements in SSR', () => {
	it('renders a simple static array', async () => {
		component App() {
			const items = ['Item 1', 'Item 2', 'Item 3'];

			for (const item of items) {
				<div class={item}>{item}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml(
			'<div class="Item 1">Item 1</div><div class="Item 2">Item 2</div><div class="Item 3">Item 3</div>',
		);
	});

	it('renders nested for...of loops', async () => {
		component App() {
			const groups = [
				{
					name: 'Group 1',
					items: ['Item 1.1', 'Item 1.2'],
				},
				{
					name: 'Group 2',
					items: ['Item 2.1', 'Item 2.2'],
				},
			];

			for (const group of groups) {
				<h1>{group.name}</h1>
				<ul>
					for (const item of group.items) {
						<li>{item}</li>
					}
				</ul>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml(
			'<h1>Group 1</h1><ul><li>Item 1.1</li><li>Item 1.2</li></ul><h1>Group 2</h1><ul><li>Item 2.1</li><li>Item 2.2</li></ul>',
		);
	});

	it('renders an array with index', async () => {
		component App() {
			const items = ['Item 1', 'Item 2', 'Item 3'];

			for (const item of items; index i) {
				<div class={`${item} ${i}`}>{`${item} ${i}`}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml(
			'<div class="Item 1 0">Item 1 0</div><div class="Item 2 1">Item 2 1</div><div class="Item 3 2">Item 3 2</div>',
		);
	});

	it('renders an array with key', async () => {
		component App() {
			const items = [
				{ id: 1, name: 'Item' },
				{ id: 2, name: 'Item' },
				{ id: 3, name: 'Item' },
			];

			for (const item of items; key item.id) {
				<div class={`${item.name} ${item.id}`}>{`${item.name} ${item.id}`}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml(
			'<div class="Item 1">Item 1</div><div class="Item 2">Item 2</div><div class="Item 3">Item 3</div>',
		);
	});

	it('renders an array with index and key', async () => {
		component App() {
			const items = [
				{ id: 1, name: 'Item' },
				{ id: 2, name: 'Item' },
				{ id: 3, name: 'Item' },
			];

			for (const item of items; index i; key item.id) {
				<div class={`${item.name} ${item.id} ${i}`}>{`${item.name} ${item.id} ${i}`}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml(
			'<div class="Item 1 0">Item 1 0</div><div class="Item 2 1">Item 2 1</div><div class="Item 3 2">Item 3 2</div>',
		);
	});

	it('allows continue to skip a for...of iteration', async () => {
		component App() {
			const items = ['Item 1', '', 'Item 3'];

			for (const item of items) {
				if (!item) continue;
				<div>{item}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Item 1</div><div>Item 3</div>');
	});

	it('allows ordinary function control flow inside for...of loops', async () => {
		component App() {
			const items = ['Item 1', '', 'Item 3'];

			for (const item of items) {
				function label(value) {
					for (let i = 0; i < 1; i++) {
						while (i < 0) {
							break;
						}
						if (!value) return 'missing';
					}
					return value;
				}

				<div>{label(item)}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Item 1</div><div>missing</div><div>Item 3</div>');
	});

	it('throws for return statements inside for...of loops', () => {
		expect(
			() => compile(
				`component App(items) {
					for (const item of items) {
						if (!item) return
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
				{ mode: 'server' },
			),
		).toThrow('Return statements are not allowed inside component for...of loops');
	});

	it('throws for break statements targeting for...of loops', () => {
		expect(
			() => compile(
				`component App(items) {
					for (const item of items) {
						if (!item) break
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
				{ mode: 'server' },
			),
		).toThrow('Break statements are not allowed inside component for...of loops');
	});
});
