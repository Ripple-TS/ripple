import { flushSync, track, untrack } from 'ripple';
import { compile } from '@tsrx/ripple';

describe('basic client > errors', () => {
	it('renders with error handling simulation', () => {
		function Basic() {
			return <>
				let &[hasError] = track(false);
				let &[errorMessage] = track('');
				const triggerError = () => {
					try {
						throw new Error('Test error');
					} catch (e) {
						hasError = true;
						errorMessage = (e as Error).message;
					}
				};
				<div>
					<button onClick={triggerError}>{'Trigger Error'}</button>
					if (hasError) {
						<div class="error">{'Error caught: ' + errorMessage}</div>
					} else {
						<div class="success">{'No error'}</div>
					}
				</div>
			</>;
		}

		render(Basic);

		const button = container.querySelector('button');
		const successDiv = container.querySelector('.success');

		expect(successDiv).toBeTruthy();
		expect(successDiv.textContent).toBe('No error');

		button.click();
		flushSync();

		const errorDiv = container.querySelector('.error');
		expect(errorDiv).toBeTruthy();
		expect(errorDiv.textContent).toBe('Error caught: Test error');
	});

	it('should throw error for unclosed tag', () => {
		const malformedCode = `export default function Example() { return <>
	<div></span>
</>; }`;
		expect(() => {
			compile(malformedCode, 'test.tsrx');
		}).toThrow('Expected closing tag to match opening tag');
	});

	it('should throw error for completely unclosed tag', () => {
		const malformedCode = `export default function Example() { return <>
	<div>content
</>; }`;

		expect(() => {
			compile(malformedCode, 'test.tsrx');
		}).toThrow('Expected closing tag to match opening tag');
	});

	it('should throw error for interpolating children as text', () => {
		const code = `
			export function Layout({ children }) { return <>
				<div>{children}</div>
			</>; }
		`;

		expect(() => {
			compile(code, 'test.tsrx');
		}).not.toThrow();
	});

	it('should throw error for interpolating props.children as text', () => {
		const code = `
			export function Layout(props) { return <>
				<div>{props.children}</div>
			</>; }
		`;

		expect(() => {
			compile(code, 'test.tsrx');
		}).not.toThrow();
	});

	it('should throw error for calling children as a function', () => {
		const code = `
			export function Layout({ children }) { return <>
				{children()}
			</>; }
		`;

		expect(() => {
			compile(code, 'test.tsrx');
		}).toThrow(
			'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
		);
	});

	it('should throw error for calling props.children as a function', () => {
		const code = `
			export function Layout(props) { return <>
				{props.children()}
			</>; }
		`;

		expect(() => {
			compile(code, 'test.tsrx');
		}).toThrow(
			'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
		);
	});

	it('errors on mutating tracked value inside computed track() evaluation', () => {
		function Basic() {
			return <>
				let &[count] = track(0);
				const &[doubled] = track(() => {
					try {
						count *= 2;
					} catch (e) {
						error = (e as Error).message;
					}
				});
				<p>{doubled}</p>
			</>;
		}

		render(Basic);

		expect(error).toBe(
			'Assignments or updates to tracked values are not allowed during computed "track(() => ...)" evaluation',
		);
	});

	it('errors on mutating tracked value inside untrack() in computed track() evaluation', () => {
		function Basic() {
			return <>
				let &[count] = track(0);
				const &[doubled] = track(() => {
					try {
						untrack(() => {
							count *= 2;
						});
					} catch (e) {
						error = (e as Error).message;
					}
				});
				<p>{doubled}</p>
			</>;
		}

		render(Basic);

		expect(error).toBe(
			'Assignments or updates to tracked values are not allowed during computed "track(() => ...)" evaluation',
		);
	});

	it('errors on mutating a tracked variable in track() getter', () => {
		function Basic() {
			return <>
				let &[count] = track(0);
				const &[doubled] = track(0, (value) => {
					try {
						count += 1;
					} catch (e) {
						error = (e as Error).message;
					}
					return value;
				});
				<p>{doubled}</p>
			</>;
		}

		render(Basic);

		expect(error).toBe(
			'Assignments or updates to tracked values are not allowed during computed "track(() => ...)" evaluation',
		);
	});

	it('should throw error for await inside client components', () => {
		const code = `
			export default async function App() { return <>
				let data = 'initial';
				if (true) {
					await new Promise(r => setTimeout(r, 100));
					data = 'loaded';
				}
				<div>{data}</div>
			</>; }
		`;
		expect(() => {
			compile(code, 'test.tsrx', { mode: 'client' });
		}).toThrow(/`await` is not allowed inside components\./);
	});

	it('should throw error for while loop inside a component', () => {
		const code = `
			export default function App() { return <>
				let i = 0;
				while (i < 10) {
					i++;
				}
				<div>{i}</div>
			</>; }
		`;
		expect(() => {
			compile(code, 'test.tsrx');
		}).toThrow('While loops are not supported in TSRX templates.');
	});

	it('should throw error for do...while loop inside a component', () => {
		const code = `
			export default function App() { return <>
				let i = 0;
				do {
					i++;
				} while (i < 10);
				<div>{i}</div>
			</>; }
		`;
		expect(() => {
			compile(code, 'test.tsrx');
		}).toThrow('Do...while loops are not supported in TSRX templates.');
	});

	it('should allow JSX fragments in TSRX templates as <> shorthand', () => {
		const code = `
			export default function SafeProfile() { return <>
				<b><>{111}</></b>
			</>; }
		`;

		expect(() => {
			compile(code, 'test.tsrx');
		}).not.toThrow();
	});

	it('should allow JSX fragments inside tsx blocks', () => {
		const code = `
			export default function SafeProfile() { return <>
				<><>{111}</></>
			</>; }
		`;

		expect(() => {
			compile(code, 'test.tsrx');
		}).not.toThrow();
	});

	it('should not throw error for while loop inside a function within a component', () => {
		const code = `
			export default function App() { return <>
				const compute = () => {
					let i = 0;
					while (i < 10) {
						i++;
					}
					return i;
				};
				<div>{compute()}</div>
			</>; }
		`;
		expect(() => {
			compile(code, 'test.tsrx');
		}).not.toThrow();
	});

	it('should not throw error for do...while loop inside a function within a component', () => {
		const code = `
			export default function App() { return <>
				const compute = () => {
					let i = 0;
					do {
						i++;
					} while (i < 10);
					return i;
				};
				<div>{compute()}</div>
			</>; }
		`;
		expect(() => {
			compile(code, 'test.tsrx');
		}).not.toThrow();
	});

	it('should throw error for variables using the reserved _$_ prefix', () => {
		const code = `
			export default function App() { return <>
				const _$_test = 'hello';
				<div>{_$_test}</div>
			</>; }
		`;
		expect(() => {
			compile(code, 'test.tsrx');
		}).toThrow('identifiers starting with "_$_" are reserved');
	});
});
