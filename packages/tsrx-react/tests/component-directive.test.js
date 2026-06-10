import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

/**
 * SPEC / TDD target for the proposed `@component { ... }` template directive.
 *
 * Status: RED. The parser only knows `@if`/`@for`/`@switch`/`@try` today
 * (packages/tsrx/src/plugin.js:1562), so every `compile()` below currently
 * throws `Unexpected token` on the `@component` keyword. The suite is
 * `describe.skip` so it does not break the green `tsrx-react` project — remove
 * `.skip` to run it as the implementation target:
 *
 *   pnpm test --project tsrx-react component-directive
 *
 * THE PROBLEM `@component` SOLVES: conditional hooks. React's rules of hooks
 * forbid calling a hook conditionally or a variable number of times — a hook
 * inside an `if`, a branch, a `switch` case, after an early `return`, or in a
 * loop is illegal because React tracks hook state by call order. Every example
 * below leads with the plain-React form that VIOLATES that rule, then shows the
 * `@component` form that legalizes it.
 *
 * WHY IT WORKS: conditionally *calling a hook* is illegal, but conditionally
 * *mounting a component* is fine. `@component` draws a real component boundary
 * around the conditional region, so the hook becomes unconditional relative to
 * its own component while the surrounding `@if`/`@for`/`@switch` only decides
 * whether that component mounts. It reuses the SAME machinery the compiler
 * already uses to auto-hoist hook-bearing scopes (create_hook_safe_helper +
 * get_referenced_helper_bindings prop-threading, transform/jsx/index.js) — the
 * boundary is just author-drawn instead of inferred from a `use*` call.
 *
 * Syntax: `@component { ...setup; <Output/> }` is a directive block like
 * `@if (…) { … }` (setup statements first, one trailing output node) that
 * lowers into its own component. Naming decision (change here to reuse
 * `__StatementBodyHook`): explicit boundaries generate `<Owner>__Component<N>`.
 * Captured component-scope bindings are auto-wired as props.
 */
describe.skip('@component directive (proposed) — conditional hooks', () => {
	it('legalizes a hook used only inside one @if branch', () => {
		// ❌ Plain React — `useActivity` is called conditionally:
		//      function Profile({ showActivity, userId }) {
		//        if (showActivity) {
		//          const activity = useActivity(userId); // ❌ conditional hook
		//        }
		//        return <div>...{activity}...</div>;       // and out of scope
		//      }
		// ✅ The hook + the JSX that consumes it sit inside @component, so the
		//    hook is unconditional there; @if only mounts the component.
		const { code } = compile(
			`import { useActivity } from './use-activity';

			export function Profile({ showActivity, userId }: { showActivity: boolean; userId: string }) @{
				<div>
					<h1>{'Profile'}</h1>
					@if (showActivity) {
						@component {
							const activity = useActivity(userId);
							<Activity activity={activity} />
						}
					}
				</div>
			}`,
			'App.tsrx',
		);

		// `userId` is the only captured component-scope binding -> auto-wired
		expect(code).toContain('function Profile__Component1({ userId })');
		expect(code).toContain('const activity = useActivity(userId);');
		expect(code).toContain('return <Activity activity={activity} />;');
		// conditionally MOUNTED, never a conditional hook call
		expect(code).toContain('showActivity ? <Profile__Component1 userId={userId} /> : null');
	});

	it('legalizes different hooks across @if / @else branches', () => {
		// ❌ Plain React — each branch calls a different hook conditionally, so
		//    the hook order changes with `mode`:
		//      if (mode === 'edit') { const form = useForm(initial); ... }
		//      else                 { const view = useViewer(initial); ... }
		// ✅ Each branch is its own conditionally-mounted component.
		const { code } = compile(
			`import { useForm } from './use-form';
			import { useViewer } from './use-viewer';

			export function Panel({ mode, initial }: { mode: 'edit' | 'view'; initial: string }) @{
				@if (mode === 'edit') {
					@component {
						const form = useForm(initial);
						<Editor form={form} />
					}
				} @else {
					@component {
						const view = useViewer(initial);
						<Viewer view={view} />
					}
				}
			}`,
			'App.tsrx',
		);

		// two independent boundaries, each capturing only `initial`
		expect(code).toContain('function Panel__Component1({ initial })');
		expect(code).toContain('const form = useForm(initial);');
		expect(code).toContain('function Panel__Component2({ initial })');
		expect(code).toContain('const view = useViewer(initial);');
		expect(code).toContain("mode === 'edit'");
	});

	it('legalizes a hook called a variable number of times inside @for', () => {
		// ❌ Plain React — calling `useState` once per item means the hook count
		//    changes whenever `items.length` does:
		//      items.forEach(() => { const [open] = useState(false); }); // ❌
		// ✅ Each iteration mounts its own component, so each `useState` is the
		//    first (and only) hook of a fresh component instance.
		const { code } = compile(
			`import { useState } from 'react';

			export function Tabs({ items }: { items: { id: string; label: string }[] }) @{
				@for (const item of items) {
					@component {
						const [open, setOpen] = useState(false);
						<li key={item.id} onClick={() => setOpen(!open)}>{open ? item.label : '...'}</li>
					}
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function Tabs__Component1');
		expect(code).toContain('const [open, setOpen] = useState(false);');
		// loop var captured as a prop + key preserved on the emitted element
		expect(code).toContain('key={item.id}');
	});

	it('legalizes per-case hooks inside @switch', () => {
		// ❌ Plain React — a different hook per `switch` case is a conditional
		//    hook; cases without hooks must not shift the others' order:
		//      switch (status) {
		//        case 'idle':   { const l = useMemo(...); ... }  // ❌
		//        case 'active': { const l = useMemo(...); ... }  // ❌
		//        case 'offline': return <span>Offline</span>;
		//      }
		// ✅ Only the hook-bearing cases get a boundary; the plain case stays
		//    inline.
		const { code } = compile(
			`import { useMemo } from 'react';

			export function Status({ status }: { status: 'idle' | 'active' | 'offline' }) @{
				@switch (status) {
					@case "idle": {
						@component {
							const label = useMemo(() => 'Online', [status]);
							<span>{label}</span>
						}
					}
					@case "active": {
						@component {
							const label = useMemo(() => 'Away', [status]);
							<span>{label}</span>
						}
					}
					@case "offline": {
						<span>{'Offline'}</span>
					}
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function Status__Component1({ status })');
		expect(code).toContain('function Status__Component2({ status })');
		// the hookless case is not lifted into a component
		expect(code).not.toContain('function Status__Component3');
		expect(code).toContain("<span>{'Offline'}</span>");
	});

	it('auto-wires multiple captured bindings on a conditional hook', () => {
		// ❌ Plain React — `count`/`setCount` are fine (top level), but the
		//    `useEffect` is conditional on `enabled`:
		//      const [count, setCount] = useState(0);
		//      if (enabled) { useEffect(() => {...}, [count]); }  // ❌
		// ✅ The conditional effect + the JSX that uses it move into a boundary
		//    that captures both `count` and `setCount` as props.
		const source = `import { useState, useEffect } from 'react';

			export function Counter({ enabled }: { enabled: boolean }) @{
				const [count, setCount] = useState(0);

				@if (enabled) {
					@component {
						useEffect(() => {
							document.title = String(count);
						}, [count]);
						<button onClick={() => setCount(count + 1)}>{count}</button>
					}
				} @else {
					<span>{count}</span>
				}
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('function Counter__Component1({ count, setCount })');
		expect(code).toContain('useEffect(');
		expect(code).toContain('enabled ? <Counter__Component1 count={count} setCount={setCount} />');
		// `count`/`setCount` stay top-level/unconditional in Counter itself
		expect(code).toContain('const [count, setCount] = useState(0);');
		// prop types derived via `typeof` aliases, same as the implicit path
		expect(mappings.code).toContain('count: typeof');
		expect(mappings.code).toContain('setCount: typeof');
		expect(mappings.errors).toEqual([]);
	});

	it('leaves an unconditional hook alone when there is no @component', () => {
		// Sanity: `@component` is opt-in. A plain top-level hook with no
		// conditional context is already legal and must not be split.
		const { code } = compile(
			`import { useState } from 'react';

			export function App() @{
				const [tab, setTab] = useState('overview');
				<button onClick={() => setTab('next')}>{tab}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const [tab, setTab] = useState('overview');");
		expect(code).not.toContain('__Component1');
		expect(code).not.toContain('__StatementBodyHook');
	});

	// Escape hatch: explicit prop list `@component({ userId }) { ... }` to
	// narrow/rename the captured boundary inputs instead of auto-wiring every
	// referenced binding. Semantics still need pinning down (does it RESTRICT
	// capture to the listed names, or just rename them?), so it stays a todo.
	it.todo('honors an explicit prop list to narrow captured bindings');

	// Cross-target: on Solid/Ripple there are no rules of hooks, so the
	// boundary is not load-bearing. `@component` around a conditional hook
	// should compile to an inline boundary there. Lives in tsrx-solid/tests.
	it.todo('compiles a conditional @component to an inline boundary on non-hook targets');
});
