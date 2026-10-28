import {
	Activity,
	Portal,
	effect,
	flushSync,
	track,
	mount,
	bindValue,
	createSubscriber,
	type Tracked,
} from 'ripple';
import { pause_block, resume_block } from '../../src/runtime/internal/client/blocks.js';
import { active_block } from '../../src/runtime/internal/client/runtime.js';

describe('Activity', () => {
	it.each(['expression', 'primitive'])('keeps cleared hidden root text empty (%s)', (kind) => {
		let mode: Tracked<'visible' | 'hidden'>;
		let value: Tracked<string | null>;
		function App() @{
			mode = track('visible');
			value = track('old');
			<Activity {mode}>
				@if (kind === 'primitive') {
					<>
						{String(value.value ?? '')}
					</>
				} @else {
					<>
						{value.value}
					</>
				}
			</Activity>
		}
		const dispose = mount(App, { target: container });
		flushSync();
		for (const cleared of ['', null]) {
			flushSync(() => (value.value = 'old'));
			flushSync(() => (mode.value = 'hidden'));
			flushSync(() => (value.value = cleared));
			flushSync(() => (mode.value = 'visible'));
			expect(container.textContent).toBe('');
		}
		dispose();
	});
	it('handles reentrant activation and restores ordinary dependency checking', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		let count: Tracked<number>;
		let reopen = true;
		const calls: string[] = [];
		function Child() @{
			const parity = track(() => count.value % 2);
			effect(() => {
				calls.push(`setup:${parity.value}`);
				return () => {
					calls.push('cleanup');
					if (reopen) {
						reopen = false;
						flushSync(() => (mode.value = 'visible'));
					}
				};
			});
			<p>content</p>
		}
		function App() @{
			mode = track('visible');
			count = track(0);
			<Activity {mode}>
				<Child />
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		flushSync(() => (mode.value = 'hidden'));
		expect(calls).toEqual(['setup:0', 'cleanup', 'setup:0']);
		flushSync(() => (count.value = 2));
		expect(calls).toHaveLength(3);
		unmount();
	});

	it('retains an authored display change made by an initially hidden ref', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		function App() @{
			mode = track('hidden');
			<Activity {mode}>
				<div
					ref={(node) => {
						node.style.setProperty('display', 'none', '');
					}}
				>content</div>
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		flushSync(() => (mode.value = 'visible'));
		expect(container.querySelector('div')!.style.display).toBe('none');
		expect(container.querySelector('div')!.style.getPropertyPriority('display')).toBe('');
		unmount();
	});
	it.each(['activity-first', 'async-first'])('preserves overlapping async pauses (%s)', (order) => {
		let mode: Tracked<'visible' | 'hidden'>;
		let effect_block: any;
		const calls: string[] = [];
		function Child() @{
			effect(function () {
				expect(arguments.length).toBe(0);
				effect_block = active_block;
				calls.push('setup');
				return function () {
					expect(arguments.length).toBe(0);
					calls.push('cleanup');
				};
			});
			<p>content</p>
		}
		function App() @{
			mode = track('visible');
			<Activity {mode}>
				<Child />
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		if (order === 'async-first') pause_block(effect_block);
		flushSync(() => (mode.value = 'hidden'));
		if (order === 'activity-first') pause_block(effect_block);
		flushSync(() => (mode.value = 'visible'));
		expect(calls).toEqual(['setup', 'cleanup']);
		resume_block(effect_block);
		flushSync();
		expect(calls).toEqual(['setup', 'cleanup', 'setup']);
		unmount();
	});

	it('keeps refs attached, prevents hidden activation, and cleans head content on disposal', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		const calls: string[] = [];
		function Child() @{
			effect(() => {
				calls.push('effect');
				return () => calls.push('cleanup');
			});
			<>
				<head>
					<meta name="activity-test" content="present" />
				</head>
				<input
					ref={() => {
						calls.push('ref');
						return () => calls.push('unref');
					}}
				/>
			</>
		}
		function App() @{
			mode = track('hidden');
			<Activity {mode}>
				<Child />
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		expect(calls).toEqual(['ref']);
		expect(document.head.querySelector('[name="activity-test"]')).not.toBeNull();
		flushSync(() => {
			mode.value = 'visible';
			mode.value = 'hidden';
		});
		expect(calls).toEqual(['ref']);
		flushSync(() => (mode.value = 'visible'));
		flushSync(() => (mode.value = 'hidden'));
		expect(calls).toEqual(['ref', 'effect', 'cleanup']);
		unmount();
		expect(calls).toEqual(['ref', 'effect', 'cleanup', 'unref']);
		expect(document.head.querySelector('[name="activity-test"]')).toBeNull();
	});
	it('supports aliases and dynamic components using a live mode prop', () => {
		let visible: Tracked<boolean>;
		const Alias = Activity;
		const calls: string[] = [];
		function Child() @{
			effect(() => {
				calls.push('setup');
			});
			<p>retained</p>
		}
		function App() @{
			visible = track(false);
			const Component = track(() => Alias);
			const mode = track(() => visible.value ? 'visible' : 'hidden');
			<{Component.value} {mode}>
				<Child />
			</{Component.value}>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		const node = container.querySelector('p');
		expect(calls).toEqual([]);
		flushSync(() => (visible.value = true));
		expect(calls).toEqual(['setup']);
		expect(container.querySelector('p')).toBe(node);
		unmount();
	});

	it('preserves author style and text updates while hidden', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		let display: Tracked<string>;
		let text: Tracked<string>;
		function App() @{
			mode = track('hidden');
			display = track('grid');
			text = track('old');
			<Activity {mode}>
				{text.value}
				<div style={{ display: display.value }}>content</div>
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync(() => {
			display.value = 'flex';
			text.value = 'new';
		});
		expect(container.querySelector('div')!.style.display).toBe('none');
		expect(container.textContent).not.toContain('new');
		flushSync(() => (mode.value = 'visible'));
		expect(container.querySelector('div')!.style.display).toBe('flex');
		expect(container.textContent).toBe('newcontent');
		flushSync(() => (mode.value = 'hidden'));
		flushSync(() => (display.value = 'none'));
		flushSync(() => (mode.value = 'visible'));
		expect(container.querySelector('div')!.style.display).toBe('none');
		unmount();
	});
	it('retains DOM and state, cleans effects once and activates unchanged effects', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		let value: Tracked<number>;
		const calls: string[] = [];
		function Child() @{
			effect(() => {
				const current = value.value;
				calls.push(`setup:${current}`);
				return () => calls.push(`cleanup:${current}`);
			});
			effect(() => {
				calls.push('constant');
				return () => calls.push('constant cleanup');
			});
			<input ref={bindValue(value)} />
		}
		function App() @{
			mode = track<'visible' | 'hidden'>('visible');
			value = track(0);
			<Activity mode={mode}>
				<Child />
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		const input = container.querySelector('input')!;
		expect(calls).toEqual(['setup:0', 'constant']);
		flushSync(() => (mode.value = 'hidden'));
		expect(input.style.display).toBe('none');
		expect(calls).toEqual(['setup:0', 'constant', 'cleanup:0', 'constant cleanup']);
		flushSync(() => (value.value = 2));
		expect(input.value).toBe('2');
		expect(calls).toHaveLength(4);
		flushSync(() => (mode.value = 'visible'));
		expect(container.querySelector('input')).toBe(input);
		expect(input.style.display).toBe('');
		expect(calls.slice(4)).toEqual(['setup:2', 'constant']);
		flushSync(() => (mode.value = 'hidden'));
		expect(calls.slice(-2)).toEqual(['cleanup:2', 'constant cleanup']);
		const length = calls.length;
		unmount();
		expect(calls).toHaveLength(length);
	});

	it('never starts hidden effects, including newly rendered descendants', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		let added: Tracked<boolean>;
		const calls: string[] = [];
		function Child({ name }: { name: string }) @{
			effect(() => {
				calls.push(name);
			});
			<span>{name}</span>
		}
		function App() @{
			mode = track<'visible' | 'hidden'>('hidden');
			added = track(false);
			<Activity mode={mode}>
				<Child name="first" />
				@if (added.value) {
					<Child name="second" />
				}
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync(() => (added.value = true));
		expect(calls).toEqual([]);
		expect(
			[...container.querySelectorAll('span')].every((node) => node.style.display === 'none'),
		).toBe(true);
		flushSync(() => (mode.value = 'visible'));
		expect(calls).toEqual(['first', 'second']);
		unmount();
	});

	it('keeps nested hidden Activities inactive and coalesces activation with updates', () => {
		let outer: Tracked<'visible' | 'hidden'>;
		let inner: Tracked<'visible' | 'hidden'>;
		let count: Tracked<number>;
		const calls: number[] = [];
		function Child() @{
			effect(() => {
				calls.push(count.value);
			});
			<b>{count.value}</b>
		}
		function App() @{
			outer = track<'visible' | 'hidden'>('hidden');
			inner = track<'visible' | 'hidden'>('hidden');
			count = track(0);
			<Activity mode={outer}>
				<Activity mode={inner}>
					<Child />
				</Activity>
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync(() => (outer.value = 'visible'));
		expect(calls).toEqual([]);
		expect(container.querySelector('b')!.style.display).toBe('none');
		flushSync(() => {
			inner.value = 'visible';
			count.value = 1;
		});
		expect(calls).toEqual([1]);
		flushSync(() => (inner.value = 'hidden'));
		flushSync(() => (inner.value = 'visible'));
		expect(calls).toEqual([1, 1]);
		unmount();
	});

	it('hides text, SVG, table rows and portal roots without wrappers', () => {
		let mode: Tracked<'visible' | 'hidden'>;
		const portal = document.createElement('div');
		document.body.append(portal);
		function App() @{
			mode = track<'visible' | 'hidden'>('hidden');
			<>
				<Activity mode={mode}>
					{'text'}
					<span style="display:inline-flex!important">{'span'}</span>
					<Portal target={portal}>
						<b>{'portal'}</b>
					</Portal>
				</Activity>
				<svg>
					<Activity mode={mode}>
						<circle r="2" />
					</Activity>
				</svg>
				<table>
					<tbody>
						<Activity mode={mode}>
							<tr>
								<td>{'cell'}</td>
							</tr>
						</Activity>
					</tbody>
				</table>
			</>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		expect(container.textContent).not.toContain('text');
		for (const node of [
			...container.querySelectorAll('span,circle,tr'),
			portal.querySelector('b')!,
		]) expect((node as HTMLElement).style.display).toBe('none');
		flushSync(() => (mode.value = 'visible'));
		expect(container.textContent).toContain('text');
		expect(container.querySelector('span')!.style.display).toBe('inline-flex');
		expect(container.querySelector('span')!.style.getPropertyPriority('display')).toBe('important');
		unmount();
		expect(portal.childNodes).toHaveLength(0);
		portal.remove();
	});

	it('disconnects subscriptions and nested effects owned by an application effect', async () => {
		let mode: Tracked<'visible' | 'hidden'>;
		const calls: string[] = [];
		const subscribe = createSubscriber(() => {
			calls.push('subscribe');
			return () => calls.push('unsubscribe');
		});
		function Child() @{
			effect(() => {
				subscribe();
				effect(() => {
					calls.push('nested');
					return () => calls.push('nested cleanup');
				});
				return () => calls.push('parent cleanup');
			});
			<div />
		}
		function App() @{
			mode = track<'visible' | 'hidden'>('visible');
			<Activity mode={mode}>
				<Child />
			</Activity>
		}
		const unmount = mount(App, { target: container });
		flushSync();
		flushSync(() => (mode.value = 'hidden'));
		await Promise.resolve();
		expect(calls).toEqual([
			'subscribe',
			'nested',
			'nested cleanup',
			'parent cleanup',
			'unsubscribe',
		]);
		flushSync(() => (mode.value = 'visible'));
		expect(calls.slice(-2)).toEqual(['subscribe', 'nested']);
		unmount();
	});
});
