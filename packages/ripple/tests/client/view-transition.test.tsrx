import {
	Activity,
	ViewTransition,
	createViewTransition,
	createRenderObserver,
	flushSync,
	mount,
	trackAsync,
	track,
	effect,
	type Component,
	type ViewTransitionController,
	type ViewTransitionInstance,
} from 'ripple';
import { installViewTransitions } from '../view-transition/native.js';
import { create_library_value } from './library-value.js';

let native: ReturnType<typeof installViewTransitions>;
const disposers: Array<() => void> = [];
function setup(App: Component) {
	const dispose = mount(App, { target: container });
	disposers.push(dispose);
	flushSync();
	return dispose;
}
beforeEach(() => {
	native = installViewTransitions();
});
afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	Reflect.deleteProperty(document, 'startViewTransition');
	vi.restoreAllMocks();
});

it('adds no DOM, animates explicit updates, and separates render, ready and finish', async () => {
	let transition!: ViewTransitionController;
	const count = create_library_value(0);
	const cleanup = vi.fn();
	const updated = vi.fn(() => cleanup);
	function App() @{
		transition = createViewTransition();
		<ViewTransition onUpdate={updated}>
			<button>{count.value}</button>
		</ViewTransition>
	}
	setup(App);
	expect(container.children.length).toBe(1);
	expect(container.querySelector('button')!.parentNode).toBe(container);
	expect(native.start).not.toHaveBeenCalled();
	count.value++;
	flushSync();
	expect(native.start).not.toHaveBeenCalled();
	const button = container.firstChild;
	const handle = transition.run(() => {
		count.value++;
	});
	expect(container.textContent).toBe('1');
	expect(await handle.rendered).toBe(true);
	expect(container.textContent).toBe('2');
	expect(await handle.ready).toBe(true);
	expect(updated).toHaveBeenCalledOnce();
	expect(container.firstChild).toBe(button);
	expect(container.querySelector('[style]')).toBeNull();
	expect(cleanup).not.toHaveBeenCalled();
	native.transitions[0].finish();
	await handle.finished;
	expect(cleanup).toHaveBeenCalledOnce();
});

it(
	'pairs unrelated branches, gives share precedence, and cleans the outgoing callback',
	async () => {
		const route = create_library_value(false);
		let transition!: ViewTransitionController;
		const callbacks = { enter: vi.fn(), exit: vi.fn(), share: vi.fn(() => vi.fn()) };
		function App() @{
			transition = createViewTransition();
			@if (route.value) {
				<section>
					<ViewTransition
						name="photo"
						share="grow"
						onShare={callbacks.share}
						onEnter={callbacks.enter}
					>
						<h1>detail</h1>
					</ViewTransition>
				</section>
			} @else {
				<aside>
					<ViewTransition name="photo" onShare={callbacks.share} onExit={callbacks.exit}>
						<button>thumb</button>
					</ViewTransition>
				</aside>
			}
		}
		setup(App);
		const handle = transition.run(() => {
			route.value = true;
		}, { types: ['forward', 'forward'] });
		expect(await handle.ready).toBe(true);
		expect(callbacks.share).toHaveBeenCalledOnce();
		expect(callbacks.enter).not.toHaveBeenCalled();
		expect(callbacks.exit).not.toHaveBeenCalled();
		expect(callbacks.share.mock.calls[0][1]).toEqual(['forward']);
		expect(
			native.transitions[0].new.some((entry: any[]) => entry[1] === 'photo' && entry[2] === 'grow'),
		).toBe(true);
		native.transitions[0].finish();
		await handle.finished;
		for (const result of callbacks.share.mock.results) expect(result.value).toHaveBeenCalledOnce();
	},
);

it(
	'selects only top-level enter/exit and attributes nested mutations to the inner boundary',
	async () => {
		const shown = create_library_value(false);
		const text = create_library_value('one');
		let transition!: ViewTransitionController;
		const outer = vi.fn();
		const inner = vi.fn();
		const hidden = vi.fn();
		function App() @{
			transition = createViewTransition();
			@if (shown.value) {
				<>
					<ViewTransition onEnter={outer} onExit={outer} onUpdate={outer}>
						<div>
							<ViewTransition onEnter={inner} onExit={inner} onUpdate={inner}>
								<p>{text.value}</p>
							</ViewTransition>
						</div>
					</ViewTransition>
					<section>
						<ViewTransition onEnter={hidden} onExit={hidden}>
							<p>deep</p>
						</ViewTransition>
					</section>
				</>
			}
		}
		setup(App);
		let handle = transition.run(() => {
			shown.value = true;
		});
		await handle.ready;
		expect(outer).toHaveBeenCalledOnce();
		expect(inner).not.toHaveBeenCalled();
		expect(hidden).not.toHaveBeenCalled();
		native.transitions[0].finish();
		await handle.finished;
		outer.mockClear();
		handle = transition.run(() => {
			text.value = 'two';
		});
		await handle.ready;
		expect(inner).toHaveBeenCalledOnce();
		expect(outer).not.toHaveBeenCalled();
		native.transitions[1].finish();
		await handle.finished;
		handle = transition.run(() => {
			shown.value = false;
		});
		await handle.ready;
		expect(outer).toHaveBeenCalledOnce();
		expect(inner).toHaveBeenCalledOnce();
		expect(hidden).not.toHaveBeenCalled();
		native.transitions[2].finish();
		await handle.finished;
	},
);

it('handles multiple roots, live classes, map fallbacks and none precedence', async () => {
	const count = create_library_value(0);
	const style = create_library_value({
		forward: 'slide',
		fast: 'quick',
		stop: 'none',
		default: 'fallback',
	});
	let transition!: ViewTransitionController;
	const updated = vi.fn();
	function App() @{
		transition = createViewTransition();
		<ViewTransition name="pair" update={style.value} onUpdate={updated}>
			<button>{count.value}</button>
			<span>{count.value}</span>
		</ViewTransition>
	}
	setup(App);
	let handle = transition.run(() => {
		count.value++;
	}, { types: ['forward', 'fast'] });
	await handle.ready;
	expect(updated.mock.calls[0][0].names).toEqual(['pair', 'pair--ripple-1']);
	expect(
		native.transitions[0].new.filter((entry: any[]) => entry[2] === 'slide quick'),
	).toHaveLength(2);
	native.transitions[0].finish();
	await handle.finished;
	handle = transition.run(() => {
		count.value++;
	}, { types: ['forward', 'stop'] });
	expect(await handle.ready).toBe(false);
	await handle.finished;
	expect(updated).toHaveBeenCalledOnce();
	handle = transition.run(() => {
		count.value++;
	});
	await handle.ready;
	expect(native.transitions[2].new.some((entry: any[]) => entry[2] === 'fallback')).toBe(true);
	native.transitions[2].finish();
	await handle.finished;
});

it(
	'awaits visible async rendering and effects without animating intermediate fallbacks',
	async () => {
		const shown = create_library_value(false);
		const result = Promise.withResolvers<string>();
		let transition!: ViewTransitionController;
		const enter = vi.fn();
		function Child() @{
			const data = trackAsync(() => result.promise);
			<ViewTransition onEnter={enter}>
				<p>{data.value}</p>
			</ViewTransition>
		}
		function App() @{
			transition = createViewTransition();
			@try {
				@if (shown.value) {
					<Child />
				}
			} @pending {
				<p>loading</p>
			}
		}
		setup(App);
		const handle = transition.run(() => {
			shown.value = true;
		});
		await Promise.resolve();
		flushSync();
		await Promise.resolve();
		expect(container.textContent).toBe('loading');
		expect(enter).not.toHaveBeenCalled();
		result.resolve('ready');
		expect(await handle.rendered).toBe(true);
		expect(container.textContent).toBe('ready');
		await handle.ready;
		native.transitions[0].finish();
		await handle.finished;
	},
);

it(
	'supersedes deferred updaters before mutation and cleans interrupted animations exactly once',
	async () => {
		const count = create_library_value(0);
		let transition!: ViewTransitionController;
		const cleanup = vi.fn();
		function App() @{
			transition = createViewTransition();
			<ViewTransition onUpdate={() => cleanup}>
				<p>{count.value}</p>
			</ViewTransition>
		}
		setup(App);
		const first = transition.run(() => {
			count.value = 1;
		});
		const second = transition.run(() => {
			count.value = 2;
		});
		expect(await first.rendered).toBe(false);
		await first.finished;
		await second.ready;
		expect(container.textContent).toBe('2');
		const third = transition.run(() => {
			count.value = 3;
		});
		await second.finished;
		expect(cleanup).toHaveBeenCalledOnce();
		await third.ready;
		native.transitions[1].finish();
		expect(cleanup).toHaveBeenCalledOnce();
		native.transitions[2].finish();
		await third.finished;
		expect(cleanup).toHaveBeenCalledTimes(2);
	},
);

it.each(['skip', 'unsupported', 'reduced', 'external'])(
	'commits and remains interactive with %s animation',
	async (mode) => {
		const count = create_library_value(0);
		let transition!: ViewTransitionController;
		const event = vi.fn();
		function App() @{
			transition = createViewTransition();
			<ViewTransition onUpdate={event}>
				<button
					onClick={() => {
						count.value++;
					}}
				>{count.value}</button>
			</ViewTransition>
		}
		setup(App);
		if (mode === 'unsupported') Reflect.deleteProperty(document, 'startViewTransition');
		if (mode === 'reduced') vi.stubGlobal('matchMedia', () => ({ matches: true }));
		if (mode === 'external') Object.defineProperty(document, 'activeViewTransition', {
			configurable: true,
			value: {},
		});
		const handle = transition.run(() => {
			count.value = 1;
		});
		if (mode === 'skip') handle.skipTransition();
		expect(await handle.rendered).toBe(true);
		expect(await handle.ready).toBe(false);
		await handle.finished;
		expect(event).not.toHaveBeenCalled();
		container.querySelector('button')!.click();
		flushSync();
		expect(container.textContent).toBe('2');
		expect(container.querySelector('[style]')).toBeNull();
		Reflect.deleteProperty(document, 'activeViewTransition');
		vi.unstubAllGlobals();
	},
);

it('restores authored inline styles and retains updated styles', async () => {
	const count = create_library_value(0);
	let transition!: ViewTransitionController;
	function App() @{
		transition = createViewTransition();
		<ViewTransition update="flash">
			<p
				style={{
					color: count.value ? 'blue' : 'red',
					viewTransitionName: 'authored',
					viewTransitionClass: 'original',
				}}
			>{count.value}</p>
		</ViewTransition>
	}
	setup(App);
	const handle = transition.run(() => {
		count.value++;
	});
	await handle.ready;
	const style = container.querySelector('p')!.style;
	expect(style.color).toBe('blue');
	expect(style.getPropertyValue('view-transition-name')).toBe('authored');
	expect(style.getPropertyValue('view-transition-class')).toBe('original');
	native.transitions[0].finish();
	await handle.finished;
});

it('diagnoses duplicate names across roots without breaking rendering', async () => {
	const count = create_library_value(0);
	let transition!: ViewTransitionController;
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const event = vi.fn();
	function App() @{
		transition = createViewTransition();
		<ViewTransition name="same" onUpdate={event}>
			<p>{count.value}</p>
		</ViewTransition>
	}
	setup(App);
	const other = document.createElement('div');
	document.body.append(other);
	const unmount = mount(App, { target: other });
	disposers.push(() => {
		unmount();
		other.remove();
	});
	flushSync();
	const handle = transition.run(() => {
		count.value++;
	});
	await handle.finished;
	expect(warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate name'));
	expect(event).not.toHaveBeenCalled();
	expect(container.textContent + other.textContent).toBe('11');
});

it('cleans failed updates and callbacks and permits a subsequent transition', async () => {
	const count = create_library_value(0);
	let transition!: ViewTransitionController;
	let fail = true;
	function App() @{
		transition = createViewTransition();
		<ViewTransition
			onUpdate={() => {
				if (fail) throw new Error('callback');
			}}
		>
			<p>{count.value}</p>
		</ViewTransition>
	}
	setup(App);
	let handle = transition.run(() => {
		count.value++;
		throw new Error('update');
	});
	await expect(handle.rendered).rejects.toThrow('update');
	await expect(handle.finished).rejects.toThrow('update');
	expect(container.textContent).toBe('1');
	handle = transition.run(() => {
		count.value++;
	});
	await expect(handle.finished).rejects.toThrow('callback');
	expect(container.querySelector('[style]')).toBeNull();
	fail = false;
	handle = transition.run(() => {
		count.value++;
	});
	expect(await handle.ready).toBe(true);
	native.transitions[2].finish();
	await handle.finished;
});

it('cancels render observation independently using AbortSignal', async () => {
	let observer!: ReturnType<typeof createRenderObserver>;
	const pending = Promise.withResolvers<string>();
	function App() @{
		observer = createRenderObserver();
		const value = trackAsync(() => pending.promise);
		<p>{value.value}</p>
	}
	setup(App);
	const abort = new AbortController();
	const result = observer.run(() => {}, { signal: abort.signal });
	abort.abort();
	expect(await result).toBe(false);
	pending.resolve('done');
});

it('animates Activity visibility while retaining nodes and state', async () => {
	const mode = create_library_value<'visible' | 'hidden'>('visible');
	let transition!: ViewTransitionController;
	const entered = vi.fn();
	const exited = vi.fn();
	function App() @{
		transition = createViewTransition();
		<Activity {mode}>
			<ViewTransition onEnter={entered} onExit={exited}>
				<input value="draft" />
			</ViewTransition>
		</Activity>
	}
	setup(App);
	const input = container.querySelector('input')!;
	input.value = 'edited';
	let handle = transition.run(() => {
		mode.value = 'hidden';
	});
	await handle.ready;
	expect(exited).toHaveBeenCalledOnce();
	native.transitions[0].finish();
	await handle.finished;
	handle = transition.run(() => {
		mode.value = 'visible';
	});
	await handle.ready;
	expect(entered).toHaveBeenCalledOnce();
	expect(container.querySelector('input')).toBe(input);
	expect(input.value).toBe('edited');
	native.transitions[1].finish();
	await handle.finished;
});

it(
	'animates Activity inside ViewTransition and retains its nodes, component state, and effect lifecycle',
	async () => {
		const mode = create_library_value<'visible' | 'hidden'>('visible');
		let transition!: ViewTransitionController;
		const enter = vi.fn();
		const exit = vi.fn();
		const connected = vi.fn();
		const disconnected = vi.fn();
		function Panel() @{
			const count = track(0);
			effect(() => {
				connected();
				return disconnected;
			});
			<section>
				<input value="draft" />
				<button onClick={() => count.value++}>{count.value}</button>
			</section>
		}
		function App() @{
			transition = createViewTransition();
			<ViewTransition name="panel" onEnter={enter} onExit={exit}>
				<Activity {mode}>
					<Panel />
				</Activity>
			</ViewTransition>
		}
		setup(App);
		const section = container.querySelector('section')!;
		const input = container.querySelector('input')!;
		const button = container.querySelector('button')!;
		input.value = 'edited';
		button.click();
		flushSync();
		expect(button.textContent).toBe('1');
		let handle = transition.run(() => {
			mode.value = 'hidden';
		});
		expect(await handle.ready).toBe(true);
		expect(exit).toHaveBeenCalledOnce();
		expect(disconnected).toHaveBeenCalledOnce();
		expect(section.style.display).toBe('none');
		native.transitions[0].finish();
		await handle.finished;
		handle = transition.run(() => {
			mode.value = 'visible';
		});
		expect(await handle.ready).toBe(true);
		expect(enter).toHaveBeenCalledOnce();
		expect(connected).toHaveBeenCalledTimes(2);
		expect(container.querySelector('section')).toBe(section);
		expect(input.value).toBe('edited');
		expect(button.textContent).toBe('1');
		button.click();
		flushSync();
		expect(button.textContent).toBe('2');
		native.transitions[1].finish();
		await handle.finished;
		expect(section.style.getPropertyValue('view-transition-name')).toBe('');
	},
);

it('bounds suspended work and leaves late completion to ordinary rendering', async () => {
	const shown = create_library_value(false);
	const pending = Promise.withResolvers<string>();
	let transition!: ViewTransitionController;
	const entered = vi.fn();
	function Child() @{
		const data = trackAsync(() => pending.promise);
		<ViewTransition onEnter={entered}>
			<p>{data.value}</p>
		</ViewTransition>
	}
	function App() @{
		transition = createViewTransition();
		@if (shown.value) {
			<Child />
		}
	}
	setup(App);
	const handle = transition.run(() => {
		shown.value = true;
	}, { timeout: 10 });
	expect(await handle.rendered).toBe(false);
	expect(await handle.ready).toBe(false);
	await handle.finished;
	pending.resolve('late');
	await vi.waitFor(() => expect(container.textContent).toBe('late'));
	expect(entered).not.toHaveBeenCalled();
	expect(container.querySelector('[style]')).toBeNull();
});

it(
	'waits for image decoding after render completion and releases cancelled asset waits',
	async () => {
		const count = create_library_value(0);
		const decoded = Promise.withResolvers<void>();
		vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
		Object.defineProperty(HTMLImageElement.prototype, 'decode', {
			configurable: true,
			value: () => decoded.promise,
		});
		let transition!: ViewTransitionController;
		function App() @{
			transition = createViewTransition();
			<ViewTransition>
				<div>
					<img src="asset.png" />
					<span>{count.value}</span>
				</div>
			</ViewTransition>
		}
		setup(App);
		const handle = transition.run(() => {
			count.value++;
		});
		expect(await handle.rendered).toBe(true);
		let ready = false;
		void handle.ready.then(() => {
			ready = true;
		});
		await Promise.resolve();
		expect(ready).toBe(false);
		decoded.resolve();
		expect(await handle.ready).toBe(true);
		native.transitions[0].finish();
		await handle.finished;
		Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
	},
);

it('handles async update rejection, unmount, and losing a callback owner', async () => {
	const count = create_library_value(0);
	const visible = create_library_value(true);
	let transition!: ViewTransitionController;
	const cleanup = vi.fn();
	function App() @{
		transition = createViewTransition();
		@if (visible.value) {
			<ViewTransition onUpdate={() => cleanup}>
				<p>{count.value}</p>
			</ViewTransition>
		}
	}
	const dispose = setup(App);
	let handle = transition.run(async () => {
		await Promise.resolve();
		count.value++;
		throw new Error('async');
	});
	await expect(handle.rendered).rejects.toThrow('async');
	await expect(handle.finished).rejects.toThrow('async');
	handle = transition.run(() => {
		count.value++;
	});
	await handle.ready;
	flushSync(() => {
		visible.value = false;
	});
	expect(cleanup).toHaveBeenCalledOnce();
	dispose();
	await handle.finished;
	expect(cleanup).toHaveBeenCalledOnce();
	const update = vi.fn();
	expect(await transition.run(update).rendered).toBe(false);
	expect(update).not.toHaveBeenCalled();
});

it('isolates callback cleanup failures from the renderer', async () => {
	const count = create_library_value(0);
	const visible = create_library_value(true);
	let transition!: ViewTransitionController;
	function App() @{
		transition = createViewTransition();
		@if (visible.value) {
			<ViewTransition
				onUpdate={() => () => {
					throw new Error('cleanup');
				}}
			>
				<p>{count.value}</p>
			</ViewTransition>
		}
	}
	setup(App);
	const handle = transition.run(() => {
		count.value++;
	});
	await handle.ready;
	expect(
		() => flushSync(() => {
			visible.value = false;
		}),
	).not.toThrow();
	await expect(handle.finished).rejects.toThrow('cleanup');
	expect(container.querySelector('p')).toBeNull();
});

it(
	'supports partial native implementations and synchronous start failures without repeating updates',
	async () => {
		const count = create_library_value(0);
		let transition!: ViewTransitionController;
		const callback = vi.fn();
		function App() @{
			transition = createViewTransition();
			<ViewTransition update={{ forward: 'slide' }} onUpdate={callback}>
				<p>{count.value}</p>
			</ViewTransition>
		}
		setup(App);
		const start = document.startViewTransition;
		Object.defineProperty(document, 'startViewTransition', {
			configurable: true,
			value: (update: () => Promise<void>) => {
				const native = start(update);
				Reflect.deleteProperty(native, 'types');
				return native;
			},
		});
		let handle = transition.run(() => {
			count.value++;
		}, { types: ['forward'] });
		await handle.ready;
		expect(callback.mock.calls[0][1]).toEqual(['forward']);
		native.transitions[0].finish();
		await handle.finished;
		Object.defineProperty(document, 'startViewTransition', {
			configurable: true,
			value: () => {
				throw new Error('unavailable');
			},
		});
		handle = transition.run(() => {
			count.value++;
		});
		await handle.finished;
		expect(container.textContent).toBe('2');
		expect(await handle.ready).toBe(false);
	},
);

it('does not pair shared boundaries outside the viewport', async () => {
	const detail = create_library_value(false);
	let transition!: ViewTransitionController;
	const shared = vi.fn();
	function App() @{
		transition = createViewTransition();
		@if (detail.value) {
			<ViewTransition name="photo" onShare={shared}>
				<p>new</p>
			</ViewTransition>
		} @else {
			<ViewTransition name="photo" onShare={shared}>
				<p>old</p>
			</ViewTransition>
		}
	}
	setup(App);
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
		{
			x: 0,
			y: -200,
			top: -200,
			bottom: -100,
			left: 0,
			right: 100,
			width: 100,
			height: 100,
		} as DOMRect,
	);
	const handle = transition.run(() => {
		detail.value = true;
	});
	await handle.ready;
	expect(shared).not.toHaveBeenCalled();
	native.transitions[0].finish();
	await handle.finished;
});

it(
	'reads live names and styling props per transition and suppresses disabled shared pairs',
	async () => {
		const detail = create_library_value(false);
		const name = create_library_value('before');
		const classes = create_library_value('first');
		const count = create_library_value(0);
		let transition!: ViewTransitionController;
		const shared = vi.fn();
		function App() @{
			transition = createViewTransition();
			<>
				<ViewTransition {name} update={classes}>
					<p>{count.value}</p>
				</ViewTransition>
				@if (detail.value) {
					<ViewTransition name="photo" share="none" onShare={shared}>
						<b>new</b>
					</ViewTransition>
				} @else {
					<ViewTransition name="photo" onShare={shared}>
						<b>old</b>
					</ViewTransition>
				}
			</>
		}
		setup(App);
		name.value = 'after';
		classes.value = 'second';
		const handle = transition.run(() => {
			count.value++;
			detail.value = true;
		});
		await handle.ready;
		expect(
			native.transitions[0].new.some(
				(entry: any[]) => entry[1] === 'after' && entry[2] === 'second',
			),
		).toBe(true);
		expect(shared).not.toHaveBeenCalled();
		expect(native.transitions[0].new.some((entry: any[]) => entry[1] === 'photo')).toBe(false);
		native.transitions[0].finish();
		await handle.finished;
	},
);

it(
	'keeps automatic names unique across roots and disabled controllers cannot interrupt another root',
	async () => {
		const count = create_library_value(0);
		const controllers: ViewTransitionController[] = [];
		function App() @{
			controllers.push(createViewTransition());
			<ViewTransition>
				<p>{count.value}</p>
			</ViewTransition>
		}
		setup(App);
		const other = document.createElement('div');
		document.body.append(other);
		const unmount = mount(App, { target: other });
		disposers.push(() => {
			unmount();
			other.remove();
		});
		flushSync();
		controllers[0].dispose();
		const handle = controllers[1].run(() => {
			count.value++;
		});
		await handle.ready;
		const names = native.transitions[0].new.filter((entry: any[]) => entry[0].tagName === 'P').map(
			(entry: any[]) => entry[1],
		);
		expect(names).toHaveLength(2);
		expect(new Set(names).size).toBe(2);
		await controllers[0].run(() => {}).finished;
		expect(native.transitions[0].skipTransition).not.toHaveBeenCalled();
		native.transitions[0].finish();
		await handle.finished;
	},
);

it('does not repeat the updater when native transition types reject a value', async () => {
	const count = create_library_value(0);
	let transition!: ViewTransitionController;
	function App() @{
		transition = createViewTransition();
		<ViewTransition>
			<p>{count.value}</p>
		</ViewTransition>
	}
	setup(App);
	const start = document.startViewTransition;
	Object.defineProperty(document, 'startViewTransition', {
		configurable: true,
		value: (update: () => Promise<void>) => {
			const native = start(update);
			native.types.add = () => {
				throw new Error('invalid type');
			};
			return native;
		},
	});
	const update = vi.fn(() => {
		count.value++;
	});
	const handle = transition.run(update, { types: [''] });
	await handle.finished;
	expect(update).toHaveBeenCalledOnce();
	expect(container.textContent).toBe('1');
	expect(await handle.ready).toBe(false);
});

it('ignores stale async results after a newer transition reveals content', async () => {
	const revision = create_library_value(0);
	const stale = Promise.withResolvers<string>();
	const latest = Promise.withResolvers<string>();
	let transition!: ViewTransitionController;
	function App() @{
		transition = createViewTransition();
		const value = trackAsync(
			() => revision.value === 1
				? stale.promise
				: revision.value === 2
					? latest.promise
					: Promise.resolve('initial'),
		);
		<ViewTransition>
			<p>{value.value}</p>
		</ViewTransition>
	}
	setup(App);
	await vi.waitFor(() => expect(container.textContent).toBe('initial'));
	const first = transition.run(
		() => flushSync(() => {
			revision.value = 1;
		}),
	);
	await Promise.resolve();
	flushSync();
	const second = transition.run(() => {
		revision.value = 2;
	});
	latest.resolve('latest');
	expect(await first.rendered).toBe(false);
	await second.ready;
	expect(container.textContent).toBe('latest');
	stale.resolve('obsolete');
	await Promise.resolve();
	flushSync();
	await Promise.resolve();
	expect(container.textContent).toBe('latest');
	native.transitions.at(-1).finish();
	await second.finished;
	expect(container.querySelector('[style]')).toBeNull();
});

it('keeps empty and bare-text output transparent without taking element snapshots', async () => {
	const value = create_library_value('text');
	let transition!: ViewTransitionController;
	function App() @{
		transition = createViewTransition();
		<>
			<ViewTransition />
			<ViewTransition>{value.value}</ViewTransition>
		</>
	}
	setup(App);
	const handle = transition.run(() => {
		value.value = 'changed';
	});
	await handle.finished;
	expect(container.textContent).toBe('changed');
	expect(container.children).toHaveLength(0);
	expect(await handle.ready).toBe(false);
});

it('runs cleanup immediately when a callback removes its own boundary', async () => {
	const shown = create_library_value(false);
	let transition!: ViewTransitionController;
	const cleanup = vi.fn();
	function App() @{
		transition = createViewTransition();
		@if (shown.value) {
			<ViewTransition
				onEnter={() => {
					flushSync(() => {
						shown.value = false;
					});
					return cleanup;
				}}
			>
				<p>temporary</p>
			</ViewTransition>
		}
	}
	setup(App);
	const handle = transition.run(() => {
		shown.value = true;
	});
	await handle.ready;
	expect(cleanup).toHaveBeenCalledOnce();
	native.transitions[0].finish();
	await handle.finished;
	expect(cleanup).toHaveBeenCalledOnce();
});

it.each(['root', 'none', 'bad name', 'ripple-vt-user'])(
	'diagnoses invalid/reserved name %s while rendering normally',
	async (name) => {
		const count = create_library_value(0);
		let transition!: ViewTransitionController;
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		function App() @{
			transition = createViewTransition();
			<ViewTransition {name}>
				<p>{count.value}</p>
			</ViewTransition>
		}
		setup(App);
		const handle = transition.run(() => {
			count.value++;
		});
		await handle.finished;
		expect(container.textContent).toBe('1');
		expect(await handle.ready).toBe(false);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid or reserved name'));
	},
);

it('releases font readiness on the snapshot deadline without delaying rendered', async () => {
	const count = create_library_value(0);
	const fonts = Promise.withResolvers<FontFaceSet>();
	const descriptor = Object.getOwnPropertyDescriptor(document, 'fonts');
	Object.defineProperty(document, 'fonts', {
		configurable: true,
		value: { status: 'loading', ready: fonts.promise },
	});
	disposers.push(() => {
		if (descriptor) Object.defineProperty(document, 'fonts', descriptor);
		else Reflect.deleteProperty(document, 'fonts');
	});
	let transition!: ViewTransitionController;
	function App() @{
		transition = createViewTransition();
		<ViewTransition>
			<p>{count.value}</p>
		</ViewTransition>
	}
	setup(App);
	const handle = transition.run(() => {
		count.value++;
	}, { timeout: 10 });
	expect(await handle.rendered).toBe(true);
	expect(await handle.ready).toBe(false);
	await handle.finished;
	expect(container.textContent).toBe('1');
	expect(container.querySelector('[style]')).toBeNull();
	fonts.resolve(document.fonts);
});

it(
	'automatically animates pending-to-content when ViewTransition wraps the try boundary',
	async () => {
		const pending = Promise.withResolvers<string>();
		const updated = vi.fn();
		function Content() @{
			const value = trackAsync(() => pending.promise);
			<p class="content">{value.value}</p>
		}
		function App() @{
			<ViewTransition name="async-content" update="reveal" onUpdate={updated}>
				@try {
					<Content />
				} @pending {
					<p class="loading">loading</p>
				}
			</ViewTransition>
		}
		setup(App);
		await vi.waitFor(() => expect(container.textContent).toBe('loading'));
		expect(native.start).not.toHaveBeenCalled();
		const loading = container.querySelector('.loading');
		pending.resolve('ready');
		await vi.waitFor(() => expect(updated).toHaveBeenCalledOnce());
		expect(container.textContent).toBe('ready');
		expect(native.start).toHaveBeenCalledOnce();
		expect(
			native.transitions[0].old.some(
				(entry: any[]) => entry[0] === loading && entry[1] === 'async-content',
			),
		).toBe(true);
		expect(
			native.transitions[0].new.some(
				(entry: any[]) =>
					entry[0].className === 'content' && entry[1] === 'async-content' && entry[2] === 'reveal',
			),
		).toBe(true);
		native.transitions[0].finish();
	},
);

it('coalesces simultaneous automatic reveals into one native transition', async () => {
	const first = Promise.withResolvers<string>();
	const second = Promise.withResolvers<string>();
	const updated = vi.fn();
	function Content({ promise }: { promise: Promise<string> }) @{
		const value = trackAsync(() => promise);
		<p>{value.value}</p>
	}
	function App() @{
		<>
			<ViewTransition onUpdate={updated}>
				@try {
					<Content promise={first.promise} />
				} @pending {
					<p>first loading</p>
				}
			</ViewTransition>
			<ViewTransition onUpdate={updated}>
				@try {
					<Content promise={second.promise} />
				} @pending {
					<p>second loading</p>
				}
			</ViewTransition>
		</>
	}
	setup(App);
	await vi.waitFor(() => expect(container.textContent).toContain('second loading'));
	first.resolve('first ready');
	second.resolve('second ready');
	await vi.waitFor(() => expect(updated).toHaveBeenCalledTimes(2));
	expect(native.start).toHaveBeenCalledOnce();
	expect(container.textContent).toBe('first readysecond ready');
	native.transitions[0].finish();
});

it('joins an explicit transition while it waits for the wrapped async boundary', async () => {
	const pending = Promise.withResolvers<string>();
	let transition!: ViewTransitionController;
	const updated = vi.fn();
	function Content() @{
		const value = trackAsync(() => pending.promise);
		<p>{value.value}</p>
	}
	function App() @{
		transition = createViewTransition();
		<ViewTransition onUpdate={updated}>
			@try {
				<Content />
			} @pending {
				<p>loading</p>
			}
		</ViewTransition>
	}
	setup(App);
	await vi.waitFor(() => expect(container.textContent).toBe('loading'));
	const handle = transition.run(() => {}, { types: ['explicit'] });
	await Promise.resolve();
	pending.resolve('ready');
	expect(await handle.ready).toBe(true);
	expect(native.start).toHaveBeenCalledOnce();
	expect(updated.mock.calls[0][1]).toEqual(['explicit']);
	native.transitions[0].finish();
	await handle.finished;
});

it('automatically animates a later reveal after an explicit transition times out', async () => {
	const pending = Promise.withResolvers<string>();
	let transition!: ViewTransitionController;
	const updated = vi.fn();
	function Content() @{
		const value = trackAsync(() => pending.promise);
		<p>{value.value}</p>
	}
	function App() @{
		transition = createViewTransition();
		<ViewTransition onUpdate={updated}>
			@try {
				<Content />
			} @pending {
				<p>loading</p>
			}
		</ViewTransition>
	}
	setup(App);
	await vi.waitFor(() => expect(container.textContent).toBe('loading'));
	const handle = transition.run(() => {}, { timeout: 10, types: ['expired'] });
	await handle.finished;
	expect(await handle.rendered).toBe(false);
	pending.resolve('late');
	await vi.waitFor(() => expect(updated).toHaveBeenCalledOnce());
	expect(container.textContent).toBe('late');
	expect(native.start).toHaveBeenCalledTimes(2);
	expect(updated.mock.calls[0][1]).toEqual([]);
	native.transitions[1].finish();
});

it.each(['unsupported', 'reduced', 'hidden'])(
	'reveals normally without automatic animation when %s',
	async (mode) => {
		const pending = Promise.withResolvers<string>();
		function Content() @{
			const value = trackAsync(() => pending.promise);
			<p>{value.value}</p>
		}
		function Wrapped() @{
			<ViewTransition>
				@try {
					<Content />
				} @pending {
					<p>loading</p>
				}
			</ViewTransition>
		}
		function App() @{
			<Activity mode={mode === 'hidden' ? 'hidden' : 'visible'}>
				<Wrapped />
			</Activity>
		}
		setup(App);
		await Promise.resolve();
		flushSync();
		if (mode === 'unsupported') Reflect.deleteProperty(document, 'startViewTransition');
		if (mode === 'reduced') vi.stubGlobal('matchMedia', () => ({ matches: true }));
		pending.resolve('ready');
		await vi.waitFor(() => expect(container.textContent).toBe('ready'));
		expect(native.start).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	},
);

it(
	'commits a queued automatic reveal if an explicit transition supersedes it before capture',
	async () => {
		const pending = Promise.withResolvers<string>();
		let transition!: ViewTransitionController;
		function Content() @{
			const value = trackAsync(() => pending.promise);
			<p>{value.value}</p>
		}
		function App() @{
			transition = createViewTransition();
			<ViewTransition>
				@try {
					<Content />
				} @pending {
					<p>loading</p>
				}
			</ViewTransition>
		}
		setup(App);
		await vi.waitFor(() => expect(container.textContent).toBe('loading'));
		const deferred: Array<() => Promise<void>> = [];
		const start = document.startViewTransition;
		Object.defineProperty(document, 'startViewTransition', {
			configurable: true,
			value: (update: () => Promise<void>) => start(
				() => new Promise<void>((resolve, reject) => {
					deferred.push(() => update().then(resolve, reject));
				}),
			),
		});
		pending.resolve('ready');
		await vi.waitFor(() => expect(deferred).toHaveLength(1));
		expect(container.textContent).toBe('loading');
		const next = transition.run(() => {});
		expect(container.textContent).toBe('ready');
		await vi.waitFor(() => expect(deferred).toHaveLength(2));
		await deferred[1]();
		await next.finished;
		await deferred[0]();
		expect(container.textContent).toBe('ready');
	},
);

it(
	'does not revive an unmounted pending branch when a delayed native callback finally runs',
	async () => {
		const pending = Promise.withResolvers<string>();
		function Content() @{
			const value = trackAsync(() => pending.promise);
			<p>{value.value}</p>
		}
		function App() @{
			<ViewTransition>
				@try {
					<Content />
				} @pending {
					<p>loading</p>
				}
			</ViewTransition>
		}
		const unmount = setup(App);
		await vi.waitFor(() => expect(container.textContent).toBe('loading'));
		let release!: () => Promise<void>;
		const start = document.startViewTransition;
		Object.defineProperty(document, 'startViewTransition', {
			configurable: true,
			value: (update: () => Promise<void>) => start(
				() => new Promise<void>((resolve, reject) => {
					release = () => update().then(resolve, reject);
				}),
			),
		});
		pending.resolve('ready');
		await vi.waitFor(() => expect(release).toBeTypeOf('function'));
		unmount();
		await release();
		expect(container.textContent).toBe('');
		expect(container.childNodes).toHaveLength(0);
	},
);

it(
	'rejects an obsolete queued reveal after the same try boundary starts a newer request',
	async () => {
		const first = Promise.withResolvers<string>();
		const second = Promise.withResolvers<string>();
		const revision = create_library_value(0);
		const updated = vi.fn();
		function Content() @{
			const value = trackAsync(() => revision.value === 0 ? first.promise : second.promise);
			<p>{value.value}</p>
		}
		function App() @{
			<ViewTransition onUpdate={updated}>
				@try {
					<Content />
				} @pending {
					<p>loading</p>
				}
			</ViewTransition>
		}
		setup(App);
		await vi.waitFor(() => expect(container.textContent).toBe('loading'));
		let release!: () => Promise<void>;
		const start = document.startViewTransition;
		Object.defineProperty(document, 'startViewTransition', {
			configurable: true,
			value: (update: () => Promise<void>) => start(
				() => new Promise<void>((resolve, reject) => {
					release = () => update().then(resolve, reject);
				}),
			),
		});
		first.resolve('obsolete');
		await vi.waitFor(() => expect(release).toBeTypeOf('function'));
		flushSync(() => {
			revision.value = 1;
		});
		const commit = release();
		await Promise.resolve();
		expect(container.textContent).toBe('loading');
		second.resolve('latest');
		await commit;
		await vi.waitFor(() => expect(updated).toHaveBeenCalledOnce());
		expect(container.textContent).toBe('latest');
		expect(native.start).toHaveBeenCalledOnce();
		native.transitions[0].finish();
	},
);

it('routes an automatic animation callback failure to the owning catch boundary', async () => {
	const pending = Promise.withResolvers<string>();
	function Content() @{
		const value = trackAsync(() => pending.promise);
		<p>{value.value}</p>
	}
	function App() @{
		@try {
			<ViewTransition
				onUpdate={() => {
					throw new Error('animation failed');
				}}
			>
				@try {
					<Content />
				} @pending {
					<p>loading</p>
				}
			</ViewTransition>
		} @catch (error: Error) {
			<p>{error.message}</p>
		}
	}
	setup(App);
	await vi.waitFor(() => expect(container.textContent).toBe('loading'));
	pending.resolve('ready');
	await vi.waitFor(() => expect(container.textContent).toBe('animation failed'));
	expect(container.querySelector('[style]')).toBeNull();
});

it(
	'refreshes only explicit names for native document navigation and restores styles afterwards',
	async () => {
		const name = create_library_value('initial');
		const callback = vi.fn();
		function App() @{
			<>
				<ViewTransition {name} share="zoom" onShare={callback}>
					<p id="named" style="color:red">named</p>
				</ViewTransition>
				<ViewTransition onShare={callback}>
					<p id="automatic">automatic</p>
				</ViewTransition>
			</>
		}
		setup(App);
		name.value = 'photo';
		for (const type of ['pageswap', 'pagereveal']) {
			const ready = Promise.withResolvers<void>();
			const finished = Promise.withResolvers<void>();
			const event = new Event(type);
			Object.defineProperty(event, 'viewTransition', {
				value: {
					ready: ready.promise,
					finished: finished.promise,
					types: new Set(),
					skipTransition: vi.fn(),
				},
			});
			window.dispatchEvent(event);
			expect(
				container.querySelector<HTMLElement>('#named')!.style.getPropertyValue(
					'view-transition-name',
				),
			).toBe('photo');
			expect(
				container.querySelector<HTMLElement>('#named')!.style.getPropertyValue(
					'view-transition-class',
				),
			).toBe('zoom');
			expect(
				container.querySelector<HTMLElement>('#automatic')!.style.getPropertyValue(
					'view-transition-name',
				),
			).toBe('');
			ready.resolve();
			finished.resolve();
			await Promise.resolve();
			expect(container.querySelector<HTMLElement>('#named')!.style.color).toBe('red');
			expect(
				container.querySelector<HTMLElement>('#named')!.style.getPropertyValue(
					'view-transition-name',
				),
			).toBe('');
		}
		expect(callback).not.toHaveBeenCalled();
		expect(native.start).not.toHaveBeenCalled();
	},
);
