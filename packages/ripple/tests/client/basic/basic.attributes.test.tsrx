import { describe, it, expect } from 'vitest';
import { RippleArray, RippleObject, flushSync, track } from 'ripple';

describe('basic client > attribute rendering', () => {
	it('render static attributes', () => {
		function Basic() @{
			<div class="foo" id="bar" style="color: red;">{'Hello World'}</div>
		}

		render(Basic);

		expect(container).toMatchSnapshot();
	});

	it('render dynamic class attribute', () => {
		function Basic() @{
			const active = track(false);
			<>
				<button
					onClick={() => {
						active.value = !active.value;
					}}
				>{'Toggle'}</button>
				<div class={active.value ? 'active' : 'inactive'}>{'Dynamic Class'}</div>
				<style>
					.active {
						color: green;
					}
				</style>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(Array.from(div.classList).some((className) => className.startsWith('tsrx-'))).toBe(true);
		expect(div.classList.contains('inactive')).toBe(true);

		button.click();
		flushSync();
		expect(div.classList.contains('active')).toBe(true);

		button.click();
		flushSync();

		expect(div.classList.contains('inactive')).toBe(true);
	});

	it('render class attribute with array, nested array, nested object', () => {
		function Basic() @{
			<>
				<div
					class={[
						'foo',
						'bar',
						true && 'baz',
						false && 'aaa',
						null && 'bbb',
						[
							'ccc',
							'ddd',
							{ eee: true, fff: false },
						],
					]}
				>{'Class Array'}</div>
				<style>
					.foo {
						color: red;
					}
				</style>
			</>
		}

		render(Basic);

		const div = container.querySelector('div');

		expect(Array.from(div.classList).some((className) => className.startsWith('tsrx-'))).toBe(true);
		expect(div.classList.contains('foo')).toBe(true);
		expect(div.classList.contains('bar')).toBe(true);
		expect(div.classList.contains('baz')).toBe(true);
		expect(div.classList.contains('aaa')).toBe(false);
		expect(div.classList.contains('bbb')).toBe(false);
		expect(div.classList.contains('ccc')).toBe(true);
		expect(div.classList.contains('ddd')).toBe(true);
		expect(div.classList.contains('eee')).toBe(true);
		expect(div.classList.contains('fff')).toBe(false);
	});

	it('render dynamic class object', () => {
		function Basic() @{
			const active = track(false);
			<>
				<button
					onClick={() => {
						active.value = !active.value;
					}}
				>{'Toggle'}</button>
				<div class={{ active: active.value, inactive: !active.value }}>{'Dynamic Class'}</div>
				<style>
					.active {
						color: green;
					}
				</style>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(Array.from(div.classList).some((className) => className.startsWith('tsrx-'))).toBe(true);
		expect(div.classList.contains('inactive')).toBe(true);
		expect(div.classList.contains('active')).toBe(false);

		button.click();
		flushSync();
		expect(div.classList.contains('inactive')).toBe(false);
		expect(div.classList.contains('active')).toBe(true);

		button.click();
		flushSync();

		expect(div.classList.contains('inactive')).toBe(true);
		expect(div.classList.contains('active')).toBe(false);
	});

	it('applies scoped ripple class to multiple elements with dynamic class expressions', () => {
		function Basic() @{
			const selected = track(1);
			<>
				<div class={selected.value === 0 ? 'selected' : ''}>{`div 1`}</div>
				<div class={selected.value === 0 ? 'selected' : ''}>{`div 2`}</div>
				<style>
					div {
						background: green;
						color: white;
					}
					div.selected {
						background: indigo;
					}
				</style>
			</>
		}

		render(Basic);

		const divs = container.querySelectorAll('div');

		divs.forEach((div) => {
			expect(Array.from(div.classList).some((className) => className.startsWith('tsrx-'))).toBe(
				true,
			);
		});
	});

	it('render dynamic id attribute', () => {
		function Basic() @{
			const count = track(0);
			<>
				<button
					onClick={() => {
						count.value++;
					}}
				>{'Increment'}</button>
				<div id={`item-${count.value}`}>{'Dynamic ID'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.id).toBe('item-0');

		button.click();
		flushSync();

		expect(div.id).toBe('item-1');

		button.click();
		flushSync();

		expect(div.id).toBe('item-2');
	});

	it('render dynamic style attribute', () => {
		function Basic() @{
			const color = track('red');
			<>
				<button
					onClick={() => {
						color.value = color.value === 'red' ? 'blue' : 'red';
					}}
				>{'Change Color'}</button>
				<div style={`color: ${color.value}; font-weight: bold;`}>{'Dynamic Style'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.style.color).toBe('red');
		expect(div.style.fontWeight).toBe('bold');

		button.click();
		flushSync();

		expect(div.style.color).toBe('blue');
		expect(div.style.fontWeight).toBe('bold');
	});

	it('render style attribute as dynamic object', () => {
		function Basic() @{
			const color = track('red');
			<>
				<button
					onClick={() => {
						color.value = color.value === 'red' ? 'blue' : 'red';
					}}
				>{'Change Color'}</button>
				<div style={{ color: color.value, fontWeight: 'bold' }}>{'Dynamic Style'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.style.color).toBe('red');
		expect(div.style.fontWeight).toBe('bold');

		button.click();
		flushSync();

		expect(div.style.color).toBe('blue');
		expect(div.style.fontWeight).toBe('bold');
	});

	it('omits undefined styles and removes and restores conditional values', () => {
		function Basic() @{
			const active = track(false);
			<>
				<button onClick={() => (active.value = !active.value)}>Toggle</button>
				<div
					style={{
						width: active.value ? '400px' : undefined,
						'--scale': active.value ? 2 : undefined,
						margin: 0,
						opacity: 0,
						'--literal': 'undefined',
					}}
				/>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		for (const active of [false, true, false, true]) {
			expect(div.style.width).toBe(active ? '400px' : '');
			expect(div.style.getPropertyValue('--scale')).toBe(active ? '2' : '');
			expect(div.style.margin).toBe('0px');
			expect(div.style.opacity).toBe('0');
			expect(div.style.getPropertyValue('--literal')).toBe('undefined');
			button.click();
			flushSync();
		}
	});

	it('render tracked variable as style attribute', () => {
		function Basic() @{
			const style = track({ color: 'red', fontWeight: 'bold' });
			function toggleColor() {
				style.value = { ...style.value, color: style.value.color === 'red' ? 'blue' : 'red' };
			}
			<>
				<button onClick={toggleColor}>{'Change Color'}</button>
				<div style={style.value}>{'Dynamic Style'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.style.color).toBe('red');
		expect(div.style.fontWeight).toBe('bold');

		button.click();
		flushSync();

		expect(div.style.color).toBe('blue');
		expect(div.style.fontWeight).toBe('bold');
	});

	it('render tracked object as style attribute', () => {
		function Basic() @{
			let style = new RippleObject({ color: 'red', fontWeight: 'bold' });
			function toggleColor() {
				style.color = style.color === 'red' ? 'blue' : 'red';
			}
			<>
				<button onClick={toggleColor}>{'Change Color'}</button>
				<div style={{ color: style.color, fontWeight: style.fontWeight }}>{'Dynamic Style'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.style.color).toBe('red');
		expect(div.style.fontWeight).toBe('bold');

		button.click();
		flushSync();

		expect(div.style.color).toBe('blue');
		expect(div.style.fontWeight).toBe('bold');
	});

	it('render spread attributes with style and class', () => {
		function Basic() @{
			const attributes = {
				style: { color: 'red', fontWeight: 'bold' },
				class: ['foo', false && 'bar'],
			};
			<div {...attributes}>{'Attributes with style and class'}</div>
		}

		render(Basic);

		const div = container.querySelector('div');

		expect(div.style.color).toBe('red');
		expect(div.style.fontWeight).toBe('bold');

		expect(div.classList.contains('foo')).toBe(true);
		expect(div.classList.contains('bar')).toBe(false);
	});

	it('render spread props without duplication', () => {
		function App() @{
			const checkBoxProp = { name: 'car' };
			<div>
				<input {...checkBoxProp} type="checkbox" id="vehicle1" value="Bike" />
			</div>
		}

		render(App);

		const input = container.querySelector('input');
		const html = container.innerHTML;

		expect(input.getAttribute('name')).toBe('car');
		expect(input.getAttribute('type')).toBe('checkbox');
		expect(input.getAttribute('id')).toBe('vehicle1');
		expect(input.getAttribute('value')).toBe('Bike');

		expect(html).not.toContain('type="checkbox"type="checkbox"');
		expect(html).not.toContain('value="Bike"value="Bike"');

		expect(container).toMatchSnapshot();
	});

	it('render dynamic boolean attributes', () => {
		function Basic() @{
			const disabled = track(false);
			const checked = track(false);
			<>
				<button
					onClick={() => {
						disabled.value = !disabled.value;
						checked.value = !checked.value;
					}}
				>{'Toggle'}</button>
				<input type="checkbox" disabled={disabled.value} checked={checked.value} />
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const input = container.querySelector('input');

		expect(input.disabled).toBe(false);
		expect(input.checked).toBe(false);

		button.click();
		flushSync();

		expect(input.disabled).toBe(true);
		expect(input.checked).toBe(true);
	});

	it('render multiple dynamic attributes', () => {
		function Basic() @{
			const theme = track('light');
			const size = track('medium');
			<>
				<button
					onClick={() => {
						theme.value = theme.value === 'light' ? 'dark' : 'light';
						size.value = size.value === 'medium' ? 'large' : 'medium';
					}}
				>{'Toggle Theme & Size'}</button>
				<div
					class={`theme-${theme.value} size-${size.value}`}
					data-theme={theme.value}
					data-size={size.value}
				>{'Multiple Dynamic Attributes'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.className).toBe('theme-light size-medium');
		expect(div.getAttribute('data-theme')).toBe('light');
		expect(div.getAttribute('data-size')).toBe('medium');

		button.click();
		flushSync();

		expect(div.className).toBe('theme-dark size-large');
		expect(div.getAttribute('data-theme')).toBe('dark');
		expect(div.getAttribute('data-size')).toBe('large');
	});

	it('render conditional attributes', () => {
		function Basic() @{
			const showTitle = track(false);
			const showAria = track(false);
			<>
				<button
					onClick={() => {
						showTitle.value = !showTitle.value;
						showAria.value = !showAria.value;
					}}
				>{'Toggle Attributes'}</button>
				<div
					title={showTitle.value ? 'This is a title' : undefined}
					aria-label={showAria.value ? 'Accessible label' : undefined}
				>{'Conditional Attributes'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.hasAttribute('title')).toBe(false);
		expect(div.hasAttribute('aria-label')).toBe(false);

		button.click();
		flushSync();

		expect(div.getAttribute('title')).toBe('This is a title');
		expect(div.getAttribute('aria-label')).toBe('Accessible label');

		button.click();
		flushSync();

		expect(div.hasAttribute('title')).toBe(false);
		expect(div.hasAttribute('aria-label')).toBe(false);
	});

	it('render spread attributes', () => {
		function Basic() @{
			const attrs = track<TestAttributes>({
				class: 'initial',
				id: 'test-1',
			});
			<>
				<button
					onClick={() => {
						attrs.value = {
							class: 'updated',
							id: 'test-2',
							'data-extra': 'value',
						};
					}}
				>{'Update Attributes'}</button>
				<div {...attrs.value}>{'Spread Attributes'}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const div = container.querySelector('div');

		expect(div.className).toBe('initial');
		expect(div.id).toBe('test-1');
		expect(div.hasAttribute('data-extra')).toBe(false);

		button.click();
		flushSync();

		expect(div.className).toBe('updated');
		expect(div.id).toBe('test-2');
		expect(div.getAttribute('data-extra')).toBe('value');
	});

	it('renders with reactive attributes with nested reactive attributes', () => {
		function App() @{
			const value = track('parent-class');
			const nested = track('nested-class');
			<>
				<p class={value.value}>{'Colored parent value'}</p>
				<div>
					<p class={nested.value}>{'Colored nested value'}</p>
				</div>
			</>
		}

		render(App);

		const paragraphs = container.querySelectorAll('p');

		expect(paragraphs[0].className).toBe('parent-class');
		expect(paragraphs[1].className).toBe('nested-class');
	});

	it('handles boolean attributes with no prop value provides', () => {
		function App() @{
			<div class="container">
				<button onClick={() => console.log('clicked!')} disabled>{'Button'}</button>
				<input type="checkbox" checked />
			</div>
		}

		render(App);
		expect(container).toMatchSnapshot();
	});

	it('handles boolean props correctly', () => {
		function App() @{
			<>
				<div data-disabled />
				<Child isDisabled />
			</>
		}

		function Child({ isDisabled }: { isDisabled: boolean }) @{
			<input disabled={isDisabled} />
		}

		render(App);
		expect(container).toMatchSnapshot();
	});

	it('handles reactive event handler changes', () => {
		function Basic() @{
			const count = track(0);
			const mode = track<'increment' | 'decrement'>('increment');
			const incrementHandler = () => {
				count.value++;
			};
			const decrementHandler = () => {
				count.value--;
			};
			<>
				<button
					onClick={() => {
						mode.value = mode.value === 'increment' ? 'decrement' : 'increment';
					}}
					class="toggle-mode"
				>{'Toggle Mode'}</button>
				<button
					onClick={mode.value === 'increment' ? incrementHandler : decrementHandler}
					class="action"
				>
					{mode.value === 'increment' ? '+' : '-'}
				</button>
				<div class="count">{count.value}</div>
			</>
		}

		render(Basic);

		const toggleBtn = container.querySelector('.toggle-mode');
		const actionBtn = container.querySelector('.action');
		const countDiv = container.querySelector('.count');

		expect(actionBtn.textContent).toBe('+');
		expect(countDiv.textContent).toBe('0');

		actionBtn.click();
		flushSync();
		expect(countDiv.textContent).toBe('1');

		actionBtn.click();
		flushSync();
		expect(countDiv.textContent).toBe('2');

		toggleBtn.click();
		flushSync();
		expect(actionBtn.textContent).toBe('-');

		actionBtn.click();
		flushSync();
		expect(countDiv.textContent).toBe('1');

		actionBtn.click();
		flushSync();
		expect(countDiv.textContent).toBe('0');
	});

	it('handles events with capture option', () => {
		function Basic() @{
			let captureOrder: RippleArray<string> = new RippleArray();
			const handleCaptureClick = {
				handleEvent() {
					captureOrder.push('capture');
				},
				capture: true,
			};
			const handleBubbleClick = () => {
				captureOrder.push('bubble');
			};
			<div onClick={handleCaptureClick} class="outer">
				<button onClick={handleBubbleClick} class="inner">{'Click'}</button>
				<div class="order">{captureOrder.join(' -> ')}</div>
			</div>
		}

		render(Basic);

		const button = container.querySelector('.inner');
		const orderDiv = container.querySelector('.order');

		expect(orderDiv.textContent).toBe('');

		// Test that capture fires before bubble
		button.click();
		flushSync();
		expect(orderDiv.textContent).toBe('capture -> bubble');
	});

	it('handles events with Capture suffix in the name', () => {
		function Basic() @{
			let captureOrder: RippleArray<string> = new RippleArray();
			const handleCaptureClick = () => {
				captureOrder.push('capture');
			};
			const handleBubbleClick = () => {
				captureOrder.push('bubble');
			};
			<div onClickCapture={handleCaptureClick} class="outer">
				<button onClick={handleBubbleClick} class="inner">{'Click'}</button>
				<div class="order">{captureOrder.join(' -> ')}</div>
			</div>
		}

		render(Basic);

		const button = container.querySelector('.inner');
		const orderDiv = container.querySelector('.order');

		expect(orderDiv.textContent).toBe('');

		// Test that capture fires before bubble
		button.click();
		flushSync();
		expect(orderDiv.textContent).toBe('capture -> bubble');
	});

	it('handles custom events with customName option', () => {
		function Basic() @{
			const customEventCount = track(0);
			const handleCustom = {
				handleEvent(event: CustomEvent) {
					customEventCount.value += event.detail.value;
				},
				customName: 'MyCustomEvent',
			};
			<div>
				<div onMyCustomEvent={handleCustom} class="custom-target">{'Custom'}</div>
				<div class="custom-count">{customEventCount.value}</div>
			</div>
		}

		render(Basic);

		const customTarget = container.querySelector('.custom-target');
		const customCountDiv = container.querySelector('.custom-count');

		expect(customCountDiv.textContent).toBe('0');

		const customEvent = new CustomEvent('MyCustomEvent', { bubbles: true, detail: { value: 5 } });
		customTarget.dispatchEvent(customEvent);
		flushSync();
		expect(customCountDiv.textContent).toBe('5');

		const customEvent2 = new CustomEvent('MyCustomEvent', { bubbles: true, detail: { value: 3 } });
		customTarget.dispatchEvent(customEvent2);
		flushSync();
		expect(customCountDiv.textContent).toBe('8');
	});

	it('handles events with delegated: false option to bypass delegation', () => {
		function Basic() @{
			const delegatedCount = track(0);
			const nonDelegatedCount = track(0);
			const delegatedHandler = () => {
				delegatedCount.value++;
			};
			const nonDelegatedHandler = {
				handleEvent() {
					nonDelegatedCount.value++;
				},
				delegated: false,
			};
			<div>
				<button onClick={delegatedHandler} class="delegated-btn">{'Delegated'}</button>
				<button onClick={nonDelegatedHandler} class="non-delegated-btn">{'Non-Delegated'}</button>
				<div class="delegated-count">{delegatedCount.value}</div>
				<div class="non-delegated-count">{nonDelegatedCount.value}</div>
			</div>
		}

		render(Basic);

		const delegatedBtn = container.querySelector('.delegated-btn');
		const nonDelegatedBtn = container.querySelector('.non-delegated-btn');

		// Check that delegated event has __click property set on the element
		expect(delegatedBtn.__click).toBeDefined();
		expect(typeof delegatedBtn.__click).toBe('function');

		// Check that non-delegated event does NOT have __click property (it's attached directly)
		expect(nonDelegatedBtn.__click).toBeUndefined();

		// Verify both handlers work correctly
		delegatedBtn.click();
		flushSync();
		expect(container.querySelector('.delegated-count').textContent).toBe('1');

		nonDelegatedBtn.click();
		flushSync();
		expect(container.querySelector('.non-delegated-count').textContent).toBe('1');
	});

	it('measures effect of delegated vs non-delegated events', () => {
		const delegatedClicks: number[] = [];
		const nonDelegatedClicks: number[] = [];

		function Basic() @{
			const makeDelegatedHandler = (id: number) => () => {
				delegatedClicks.push(id);
			};
			const makeNonDelegatedHandler = (id: number) => ({
				handleEvent() {
					nonDelegatedClicks.push(id);
				},
				delegated: false,
			});
			const buttonIds = [0, 1, 2, 3, 4];
			<div>
				<div class="delegated-buttons">
					@for (const i of buttonIds) {
						<button onClick={makeDelegatedHandler(i)} class={`delegated-${i}`}>{`D${i}`}</button>
					}
				</div>
				<div class="non-delegated-buttons">
					@for (const i of buttonIds) {
						<button
							onClick={makeNonDelegatedHandler(i)}
							class={`non-delegated-${i}`}
						>{`ND${i}`}</button>
					}
				</div>
			</div>
		}

		render(Basic);

		// Test delegated buttons
		for (let i = 0; i < 5; i++) {
			const btn = container.querySelector(`.delegated-${i}`);
			btn.click();
			flushSync();
		}

		expect(delegatedClicks).toEqual([0, 1, 2, 3, 4]);

		// Test non-delegated buttons
		for (let i = 0; i < 5; i++) {
			const btn = container.querySelector(`.non-delegated-${i}`);
			btn.click();
			flushSync();
		}

		expect(nonDelegatedClicks).toEqual([0, 1, 2, 3, 4]);

		// Verify both can be called in mixed order
		delegatedClicks.length = 0;
		nonDelegatedClicks.length = 0;

		container.querySelector('.delegated-2').click();
		container.querySelector('.non-delegated-1').click();
		container.querySelector('.delegated-0').click();
		container.querySelector('.non-delegated-3').click();
		flushSync();

		expect(delegatedClicks).toEqual([2, 0]);
		expect(nonDelegatedClicks).toEqual([1, 3]);
	});

	it('handles events defined as function directly vs as object', () => {
		function Basic() @{
			const functionCount = track(0);
			const objectCount = track(0);
			const functionHandler = () => {
				functionCount.value++;
			};
			const objectHandler = {
				handleEvent() {
					objectCount.value++;
				},
			};
			<div>
				<button onClick={functionHandler} class="function-btn">{'Function'}</button>
				<button onClick={objectHandler} class="object-btn">{'Object'}</button>
				<div class="function-count">{functionCount.value}</div>
				<div class="object-count">{objectCount.value}</div>
			</div>
		}

		render(Basic);

		const functionBtn = container.querySelector('.function-btn');
		const objectBtn = container.querySelector('.object-btn');
		const functionCountDiv = container.querySelector('.function-count');
		const objectCountDiv = container.querySelector('.object-count');

		expect(functionCountDiv.textContent).toBe('0');
		expect(objectCountDiv.textContent).toBe('0');

		functionBtn.click();
		flushSync();
		expect(functionCountDiv.textContent).toBe('1');

		objectBtn.click();
		flushSync();
		expect(objectCountDiv.textContent).toBe('1');

		// Test multiple clicks
		functionBtn.click();
		functionBtn.click();
		flushSync();
		expect(functionCountDiv.textContent).toBe('3');

		objectBtn.click();
		objectBtn.click();
		flushSync();
		expect(objectCountDiv.textContent).toBe('3');
	});

	it('handles passive event option', () => {
		function Basic() @{
			const passiveDefaultPrevented = track<boolean | null>(null);
			const nonPassiveDefaultPrevented = track<boolean | null>(null);
			const passiveHandler = {
				handleEvent(event: Event) {
					event.preventDefault();
					// In passive listeners, preventDefault() is ignored
					passiveDefaultPrevented.value = event.defaultPrevented;
				},
				passive: true,
				delegated: false, // Need to ensure it's not delegated to test passive properly
			};
			const nonPassiveHandler = {
				handleEvent(event: Event) {
					event.preventDefault();
					// In non-passive listeners, preventDefault() works
					nonPassiveDefaultPrevented.value = event.defaultPrevented;
				},
				delegated: false,
			};
			<div>
				<div onWheel={passiveHandler} class="passive-target">{'Passive'}</div>
				<div onWheel={nonPassiveHandler} class="non-passive-target">{'Non-Passive'}</div>
				<div class="passive-result">
					{passiveDefaultPrevented.value === null
						? 'not-tested'
						: passiveDefaultPrevented.value
							? 'prevented'
							: 'not-prevented'}
				</div>
				<div class="non-passive-result">
					{nonPassiveDefaultPrevented.value === null
						? 'not-tested'
						: nonPassiveDefaultPrevented.value
							? 'prevented'
							: 'not-prevented'}
				</div>
			</div>
		}

		render(Basic);

		const passiveTarget = container.querySelector('.passive-target');
		const nonPassiveTarget = container.querySelector('.non-passive-target');
		const passiveResultDiv = container.querySelector('.passive-result');
		const nonPassiveResultDiv = container.querySelector('.non-passive-result');

		expect(passiveResultDiv.textContent).toBe('not-tested');
		expect(nonPassiveResultDiv.textContent).toBe('not-tested');

		// Test passive event - preventDefault should be ignored, defaultPrevented stays false
		passiveTarget.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true }));
		flushSync();
		expect(passiveResultDiv.textContent).toBe('not-prevented');

		// Test non-passive event - preventDefault should work, defaultPrevented becomes true
		nonPassiveTarget.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true }));
		flushSync();
		expect(nonPassiveResultDiv.textContent).toBe('prevented');
	});

	it('handles once option to fire event only once', () => {
		function Basic() @{
			const onceCount = track(0);
			const regularCount = track(0);
			const onceHandler = {
				handleEvent() {
					onceCount.value++;
				},
				once: true,
			};
			const regularHandler = () => {
				regularCount.value++;
			};
			<div>
				<button onClick={onceHandler} class="once-btn">{'Once'}</button>
				<button onClick={regularHandler} class="regular-btn">{'Regular'}</button>
				<div class="once-count">{onceCount.value}</div>
				<div class="regular-count">{regularCount.value}</div>
			</div>
		}

		render(Basic);

		const onceBtn = container.querySelector('.once-btn');
		const regularBtn = container.querySelector('.regular-btn');
		const onceCountDiv = container.querySelector('.once-count');
		const regularCountDiv = container.querySelector('.regular-count');

		expect(onceCountDiv.textContent).toBe('0');
		expect(regularCountDiv.textContent).toBe('0');

		onceBtn.click();
		flushSync();
		expect(onceCountDiv.textContent).toBe('1');

		// Second click should not increment because of once: true
		onceBtn.click();
		flushSync();
		expect(onceCountDiv.textContent).toBe('1');

		// Regular handler should work multiple times
		regularBtn.click();
		flushSync();
		expect(regularCountDiv.textContent).toBe('1');

		regularBtn.click();
		flushSync();
		expect(regularCountDiv.textContent).toBe('2');
	});
});
