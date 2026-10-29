import { ViewTransition, createViewTransition, trackAsync } from 'ripple';

it(
	'is deterministic, transparent, and does not invoke animation callbacks on the server',
	async () => {
		const callback = vi.fn();
		function App() @{
			<ViewTransition name="photo" enter="enter" onEnter={callback}>
				<h1>heading</h1>
				<ViewTransition>
					<p>body</p>
				</ViewTransition>
			</ViewTransition>
		}
		const first = await render(App);
		expect((await render(App)).body).toBe(first.body);
		expect(first.body).toContain('view-transition-name:photo');
		expect(first.body).not.toContain('view-transition-class:enter');
		expect(callback).not.toHaveBeenCalled();
	},
);

it('preserves async server output and has a browser-free controller', async () => {
	function App() @{
		const value = trackAsync(() => Promise.resolve('ready'));
		<ViewTransition>
			<p>{value.value}</p>
		</ViewTransition>
	}
	expect((await render(App)).body).toContain('ready');
	const transition = createViewTransition();
	const update = vi.fn();
	const handle = transition.run(update);
	expect(await handle.rendered).toBe(false);
	expect(await handle.ready).toBe(false);
	await handle.finished;
	expect(update).toHaveBeenCalledOnce();
	transition.dispose();
	await transition.run(update).finished;
	expect(update).toHaveBeenCalledOnce();
});

it(
	'emits explicit names and shared classes before hydration while preserving nested names and authored styles',
	async () => {
		const title = 'quoted " style="not-an-attribute';
		function App() @{
			<ViewTransition name="outer" share="zoom">
				<span {title} style="color:red">
					<strong>nested</strong>
				</span>
				<ViewTransition name="inner" share="shrink">
					<b style="color:blue">inner</b>
				</ViewTransition>
				<i>last</i>
				<p style="view-transition-name:authored;color:green">authored</p>
			</ViewTransition>
		}
		const { document } = parseHtml((await render(App)).body);
		expect(document.querySelector('span')!.getAttribute('title')).toBe(title);
		expect(document.querySelector('span')!.getAttribute('style')).toBe(
			'color:red;view-transition-name:outer;view-transition-class:zoom',
		);
		expect(document.querySelector('strong')!.getAttribute('style')).toBeNull();
		expect(document.querySelector('b')!.getAttribute('style')).toBe(
			'color:blue;view-transition-name:inner;view-transition-class:shrink',
		);
		expect(document.querySelector('i')!.getAttribute('style')).toBe(
			'view-transition-name:outer--ripple-2;view-transition-class:zoom',
		);
		expect(document.querySelector('p')!.getAttribute('style')).toBe(
			'view-transition-name:authored;color:green',
		);
	},
);

it(
	'leaves automatic names out of HTML and excludes disabled or invalid explicit names',
	async () => {
		const invalidName = 'bad"name';
		function App() @{
			<>
				<ViewTransition>
					<p class="auto">auto</p>
				</ViewTransition>
				<ViewTransition name="disabled" share="none">
					<p class="none">none</p>
				</ViewTransition>
				<ViewTransition name={invalidName}>
					<p class="invalid">invalid</p>
				</ViewTransition>
			</>
		}
		const { document } = parseHtml((await render(App)).body);
		expect(document.querySelector('.auto')!.getAttribute('style')).toBeNull();
		expect(document.querySelector('.invalid')!.getAttribute('style')).toBeNull();
		expect(document.querySelector('.none')!.getAttribute('style')).toBe(
			'view-transition-name:none',
		);
	},
);
