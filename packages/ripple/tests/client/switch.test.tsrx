import { flushSync, track } from 'ripple';

describe('switch statements', () => {
	it('renders simple switch with literal cases', () => {
		function App() @{
			const value = track('b');
			<>
				<button onClick={() => (value.value = 'c')}>{'Change to C'}</button>
				<button onClick={() => (value.value = 'a')}>{'Change to A'}</button>
				@switch (value.value) {
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
			</>
		}

		render(App);
		expect(container.querySelector('div').textContent).toBe('Case B');

		container.querySelectorAll('button')[0].click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Case C');
		container.querySelectorAll('button')[1].click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Case A');
	});

	it('renders switch with reactive discriminant', () => {
		function App() @{
			const count = track(1);
			<>
				<button onClick={() => count.value++}>{'Increment'}</button>
				@switch (count.value) {
					@case 1: {
						<div>{'Count is 1'}</div>
					}
					@case 2: {
						<div>{'Count is 2'}</div>
					}
					@default: {
						<div>{'Count is other'}</div>
					}
				}
			</>
		}

		render(App);
		expect(container.querySelector('div').textContent).toBe('Count is 1');

		container.querySelector('button').click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Count is 2');

		container.querySelector('button').click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Count is other');
	});

	it('renders switch with default clause only', () => {
		function App() @{
			const value = track('x');
			<>
				<button onClick={() => (value.value = 'y')}>{'Change Value'}</button>
				@switch (value.value) {
					@default: {
						<div>{'Default for ' + value.value}</div>
					}
				}
			</>
		}

		render(App);
		expect(container.querySelector('div').textContent).toBe('Default for x');

		container.querySelector('button').click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Default for y');
	});

	it('renders switch with isolated empty cases', () => {
		function App() @{
			const value = track('a');
			<>
				<button onClick={() => (value.value = 'b')}>{'Change to B'}</button>
				<button onClick={() => (value.value = 'c')}>{'Change to C'}</button>
				@switch (value.value) {
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
			</>
		}

		render(App);
		const [buttonB, buttonC] = container.querySelectorAll('button');

		expect(container.querySelector('div').textContent).toContain('Case A');

		buttonB.click();
		flushSync();

		expect(container.querySelector('div')).toBeNull();

		buttonC.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Case B or C');

		container.querySelector('div').textContent = 'DOM check';
		buttonC.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('DOM check');
	});

	it('renders switch with template content and reacts to tracked changes', () => {
		function App() @{
			const status = track('active');
			const message = track('');
			<>
				<button onClick={() => (status.value = 'pending')}>{'Pending'}</button>
				<button onClick={() => (status.value = 'completed')}>{'Completed'}</button>
				<button onClick={() => (status.value = 'error')}>{'Error'}</button>
				@switch (status.value) {
					@case 'active': {
						message.value = 'Currently active.';
						<div>{'Status: ' + message.value}</div>
					}
					@case 'pending': {
						message.value = 'Waiting for completion.';
						<div>{'Status: ' + message.value}</div>
					}
					@case 'completed': {
						message.value = 'Task finished!';
						<div class="success">{'Status: ' + message.value}</div>
					}
					@default: {
						message.value = 'An error occurred.';
						<div class="error">{'Status: ' + message.value}</div>
					}
				}
			</>
		}

		render(App);
		const [buttonPending, buttonCompleted, buttonError] = container.querySelectorAll('button');
		expect(container.querySelector('div').textContent).toBe('Status: Currently active.');

		buttonPending.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Status: Waiting for completion.');

		buttonCompleted.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Status: Task finished!');
		expect(container.querySelector('.success')).toBeTruthy();

		buttonError.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Status: An error occurred.');
		expect(container.querySelector('.error')).toBeTruthy();
	});

	it(
		'renders switch with isolated cases and reacts to tracked changes without recreating DOM unnecessarily',
		() => {
			function App() @{
				const status = track(0);
				<>
					<div>
						@switch (status.value) {
							@case -1: {
							}
							@case 0: {
								<p>{' Idle'}</p>
							}
							@case 1: {
								<p>{' Loading'}</p>
							}
							@case 2: {
								<p>{' Success'}</p>
							}
							@default: {
								<>
									<p>{' Unknown status'}</p>
									<p>{' Unknown 2'}</p>
								</>
							}
							@case 3: {
								<>
									<p>{' Error'}</p>
									<p>{' Error 2'}</p>
									<p>{' Error 3'}</p>
								</>
							}
						}
					</div>
					<button
						onClick={() => {
							status.value = (status.value + 1) % 5;
						}}
					>{'Next Status'}</button>
				</>
			}

			render(App);
			const button = container.querySelector('button');

			expect(container.querySelector('div').textContent).toBe(' Idle');

			button.click();
			flushSync();

			expect(container.querySelector('div').textContent).toBe(' Loading');

			button.click();
			flushSync();

			expect(container.querySelector('div').textContent).toBe(' Success');

			button.click();
			flushSync();

			expect(container.querySelector('div').textContent).toBe(' Error Error 2 Error 3');

			button.click();
			flushSync();

			expect(container.querySelector('div').textContent).toBe(' Unknown status Unknown 2');

			button.click();
			flushSync();

			expect(container.querySelector('div').textContent).toBe(' Idle');
		},
	);

	it('renders a middle switch case without falling through to later cases', () => {
		function App() @{
			const value = track('x');
			<>
				<button onClick={() => (value.value = 'a')}>{'Set A'}</button>
				<button onClick={() => (value.value = 'b')}>{'Set B'}</button>
				<button onClick={() => (value.value = 'c')}>{'Set C'}</button>
				<button onClick={() => (value.value = 'x')}>{'Set X'}</button>
				<div>
					@switch (value.value) {
						@case 'a': {
							<div>{' Case A'}</div>
						}
						@case 'x': {
							<div>{' Default Case for ' + value.value}</div>
						}
						@case 'b': {
							<div>{' Case B'}</div>
						}
						@case 'c': {
							<div>{' Case C'}</div>
						}
					}
				</div>
			</>
		}

		render(App);
		const [buttonA, buttonB, buttonC, buttonX] = container.querySelectorAll('button');

		expect(container.querySelector('div').textContent).toBe(' Default Case for x');
		expect(container.querySelector('div').querySelectorAll('div').length).toBe(1);

		buttonA.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe(' Case A');
		expect(container.querySelector('div').querySelectorAll('div').length).toBe(1);

		buttonC.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe(' Case C');
		expect(container.querySelector('div').querySelectorAll('div').length).toBe(1);

		buttonB.click();
		flushSync();

		const bDiv = container.querySelector('div').querySelectorAll('div')[0];
		expect(bDiv.textContent).toBe(' Case B');
		bDiv.id = 'b';

		buttonX.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe(' Default Case for x');
		expect(container.querySelector('div').querySelectorAll('div').length).toBe(1);
		expect(container.querySelector('#b')).toBeNull();
	});

	it('renders bare text nodes in switch cases without falling through', () => {
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

		render(App);
		expect(container.querySelector('div').textContent).toBe('beforeCase A');
	});

	it('renders bare text nodes in switch cases without element wrappers', () => {
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

		render(App);
		expect(container.querySelector('div').textContent).toBe('beforeCase A');
	});

	it('renders switch with isolated block-scoped cases', () => {
		function App() @{
			const level = track(1);
			<>
				<button
					onClick={() => {
						if (level.value === 1) level.value = 2;
						else if (level.value === 2) level.value = 3;
						else level.value = 1;
					}}
				>{'Toggle'}</button>
				@switch (level.value) {
					@case 1: {
						<div class="level">{'Level 1'}</div>
					}
					@case 2: {
						<div class="level">{'Level 2'}</div>
					}
					@case 3: {
						<div class="level">{'Level 3'}</div>
					}
				}
			</>
		}

		render(App);
		expect(container.querySelector('.level').textContent).toBe('Level 1');
		expect(container.querySelectorAll('.level').length).toBe(1);

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.level').textContent).toBe('Level 2');
		expect(container.querySelectorAll('.level').length).toBe(1);

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.level').textContent).toBe('Level 3');
		expect(container.querySelectorAll('.level').length).toBe(1);

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.level').textContent).toBe('Level 1');
		expect(container.querySelectorAll('.level').length).toBe(1);
	});

	it('keeps setup locals with the same name in separate cases', () => {
		function App() @{
			const kind = track('a');
			<>
				<button onClick={() => (kind.value = kind.value === 'a' ? 'b' : 'a')}>{'Toggle'}</button>
				@switch (kind.value) {
					@case 'a': {
						const label = 'Alpha';
						<div class="label">{label}</div>
					}
					@case 'b': {
						const label = 'Beta';
						<div class="label">{label}</div>
					}
				}
			</>
		}

		render(App);
		expect(container.querySelector('.label').textContent).toBe('Alpha');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.label').textContent).toBe('Beta');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.label').textContent).toBe('Alpha');
	});

	it('lets a case declare a local named like one the selector or another case reads', () => {
		function App() @{
			const kind = track('a');
			const label = track('outer');
			<>
				<button onClick={() => (kind.value = kind.value === 'a' ? 'b' : 'a')}>{'Toggle'}</button>
				@switch (label.value && kind.value) {
					@case 'a': {
						const label = 'Alpha';
						<div class="label">{label}</div>
					}
					@default: {
						<div class="label">{label.value}</div>
					}
				}
			</>
		}

		render(App);
		expect(container.querySelector('.label').textContent).toBe('Alpha');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.label').textContent).toBe('outer');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.label').textContent).toBe('Alpha');
	});
});
