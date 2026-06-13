import { useState } from 'ripple-new';
import { Counter } from './demos/Counter.tsrx';
import { KeyedList } from './demos/KeyedList.tsrx';
import { Conditional } from './demos/Conditional.tsrx';
import { Inputs } from './demos/Inputs.tsrx';
import { SuspenseDemo } from './demos/Suspense.tsrx';
import { DynamicDemo } from './demos/Dynamic.tsrx';

const DEMOS = [
	{ id: 'counter', label: 'Counter' },
	{ id: 'list', label: 'Keyed list' },
	{ id: 'cond', label: 'Conditional' },
	{ id: 'inputs', label: 'Inputs + @switch' },
	{ id: 'dynamic', label: '<{dynamic}>' },
	{ id: 'suspense', label: 'Suspense' },
];

export function App() @{
	const [active, setActive] = useState('counter');

	<>
		<header class="demo-header">
			<h1>{'ripple-new playground'}</h1>
			<p>{'Template-clone renderer + TSRX directives. Each demo exercises a distinctive corner of the surface.'}</p>
		</header>
		<nav class="demo-nav">
			@for (const d of DEMOS; key d.id) {
				<button class={active === d.id ? 'active' : ''} onClick={() => setActive(d.id)}>
					{d.label as string}
				</button>
			}
		</nav>
		<main class="demo-stage">
			@switch (active) {
				@case 'counter': {
					<Counter />
				}
				@case 'list': {
					<KeyedList />
				}
				@case 'cond': {
					<Conditional />
				}
				@case 'inputs': {
					<Inputs />
				}
				@case 'dynamic': {
					<DynamicDemo />
				}
				@case 'suspense': {
					<SuspenseDemo />
				}
				@default: {
					<p>{'(pick a demo)'}</p>
				}
			}
		</main>
	</>
}
