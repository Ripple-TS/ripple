describe('code blocks in template children position', () => {
	it('renders a code block child with setup statements and output', async () => {
		function App() @{
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					<span class="x">{x}</span>
				}
			</>
		}

		const { body } = await render(App);

		expect(body).toBeHtml('<span class="a">a</span><span class="x">1</span>');
	});

	it('renders deeply nested code block children in source position', async () => {
		function App() @{
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					@{
						const y = 2;
						@{
							<span class="sum">
								{x + y}
							</span>
						}
					}
				}
				<span class="b">{'b'}</span>
			</>
		}

		const { body } = await render(App);

		expect(body).toBeHtml(
			'<span class="a">a</span><span class="sum">3</span><span class="b">b</span>',
		);
	});

	it('renders nothing for empty nested code blocks', async () => {
		function App() @{
			<>
				<span>{'a'}</span>
				<span>{'b'}</span>
				@{
					@{
						@{}
					}
				}
			</>
		}

		const { body } = await render(App);

		expect(body).toBeHtml('<span>a</span><span>b</span>');
	});

	it('renders a code block child inside an @if branch', async () => {
		function App() @{
			const show = true;
			<>
				@if (show) {
					@{
						const label = 'shown';
						<span class="label">{label}</span>
					}
				}
			</>
		}

		const { body } = await render(App);

		expect(body).toBeHtml('<span class="label">shown</span>');
	});

	it('gives each code block its own lexical scope', async () => {
		function App() @{
			const y = 10;
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					@{
						const x = 2;
						@{
							<span class="sum">
								{x + y}
							</span>
						}
					}
				}
			</>
		}

		const { body } = await render(App);

		expect(body).toBeHtml('<span class="a">a</span><span class="sum">12</span>');
	});

	it('renders nested code block chains without extra component levels', async () => {
		function App() @{
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					@{
						const y = 2;
						@{
							<span class="sum">
								{x + y}
							</span>
						}
					}
				}
			</>
		}

		const { body } = await render(App);

		expect(body).toBeHtml('<span class="a">a</span><span class="sum">3</span>');
	});
});
