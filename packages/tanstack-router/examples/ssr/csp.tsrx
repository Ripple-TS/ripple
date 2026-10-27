import { Await } from '@ripple-ts/tanstack-router';

const delay = (ms: number) => new Promise<string>((resolve) => setTimeout(
	() => resolve('ready'),
	ms,
));

function LateStyle() @{
	<>
		<style>
			.late-style {
				color: rgb(21, 43, 65);
			}
		</style>
		<p class="late-style">Late scoped style</p>
	</>
}

function Child() @{
	const child = delay(300);
	<Await
		promise={child}
		fallback={<p>Nested child pending</p>}
		render={() => <>
			<p data-csp-child>Nested child ready</p>
			<LateStyle />
		</>}
	/>
}

function Parent() @{
	<>
		<p data-csp-parent>Parent ready</p>
		<Child />
	</>
}

export function CspPage() @{
	const parent = delay(100);
	<>
		<style>
			h1 {
				color: rgb(65, 43, 21);
			}
		</style>
		<h1>CSP streaming</h1>
		<Await promise={parent} fallback={<p>Parent pending</p>} render={() => <Parent />} />
	</>
}
