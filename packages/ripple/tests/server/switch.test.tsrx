describe('SSR: switch statements', () => {
	it('renders simple switch with literal cases', async () => {
		function App() @{
			let value = 'b';
			@switch (value) {
				case 'a':
					<div>Case A</div>
					break;
				case 'b':
					<div>Case B</div>
					break;
				case 'c':
					<div>{'Case C'}</div>
					break;
				default:
					<div>{'Default Case'}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Case B</div>');
	});

	it('renders a fall-through with an empty switch case', async () => {
		function App() @{
			let value = 'b';
			@switch (value) {
				case 'a':
					<div>Case A</div>
					break;
				case 'b':
				case 'c':
					<div>Case B or C</div>
					break;
				default:
					<div>{'Default Case'}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Case B or C</div>');
	});

	it('renders a fall-through with a case that has elements', async () => {
		function App() @{
			let value = 'a';
			@switch (value) {
				case 'a':
					<div>Case A</div>
				case 'b':
					<div>Case B</div>
				case 'c':
					<div>{'Case C'}</div>
					break;
				default:
					<div>{'Default Case'}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Case A</div><div>Case B</div><div>Case C</div>');
	});

	it('renders a default case', async () => {
		function App() @{
			let value = 'x';
			@switch (value) {
				case 'a':
					<div>Case A</div>
					break;
				default:
					<div>{'Default Case'}</div>
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Default Case</div>');
	});

	it('renders bare text nodes in switch fall-through cases without element wrappers', async () => {
		function App() @{
			let value = 'a';
			<div>
				<span>{'before'}</span>
				@switch (value) {
					case 'a':
						<>Case A</>
					case 'b':
						<>Case B</>
				}
			</div>
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div><span>before</span>Case ACase B</div>');
	});

	it('renders bare text nodes in switch cases without element wrappers', async () => {
		function App() @{
			let value = 'a';
			<div>
				<span>{'before'}</span>
				@switch (value) {
					case 'a':
						<>Case A</>
						break;
					case 'b':
						<>Case B</>
						break;
				}
			</div>
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div><span>before</span>Case A</div>');
	});
});
