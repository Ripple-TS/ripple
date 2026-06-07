describe('SSR: switch statements', () => {
	it('renders simple switch with literal cases', async () => {
		function App() @{
			let value = 'b';
			@switch (value) {
				@case 'a': {
					<div>Case A</div>
				}
				@case 'b': {
					<div>Case B</div>
				}
				@case 'c': {
					<div>{'Case C'}</div>
				}
				@default: {
					<div>{'Default Case'}</div>
				}
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Case B</div>');
	});

	it('renders an empty switch case without falling through', async () => {
		function App() @{
			let value = 'b';
			@switch (value) {
				@case 'a': {
					<div>Case A</div>
				}
				@case 'b': {
				}
				@case 'c': {
					<div>Case B or C</div>
				}
				@default: {
					<div>{'Default Case'}</div>
				}
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('');
	});

	it('renders a case with elements without falling through', async () => {
		function App() @{
			let value = 'a';
			@switch (value) {
				@case 'a': {
					<div>Case A</div>
				}
				@case 'b': {
					<div>Case B</div>
				}
				@case 'c': {
					<div>{'Case C'}</div>
				}
				@default: {
					<div>{'Default Case'}</div>
				}
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Case A</div>');
	});

	it('renders a default case', async () => {
		function App() @{
			let value = 'x';
			@switch (value) {
				@case 'a': {
					<div>Case A</div>
				}
				@default: {
					<div>{'Default Case'}</div>
				}
			}
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>Default Case</div>');
	});

	it('renders bare text nodes in switch cases without falling through', async () => {
		function App() @{
			let value = 'a';
			<div>
				<span>{'before'}</span>
				@switch (value) {
					@case 'a': {
						<>Case A</>
					}
					@case 'b': {
						<>Case B</>
					}
				}
			</div>
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div><span>before</span>Case A</div>');
	});

	it('renders bare text nodes in switch cases without element wrappers', async () => {
		function App() @{
			let value = 'a';
			<div>
				<span>{'before'}</span>
				@switch (value) {
					@case 'a': {
						<>Case A</>
					}
					@case 'b': {
						<>Case B</>
					}
				}
			</div>
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div><span>before</span>Case A</div>');
	});
});
