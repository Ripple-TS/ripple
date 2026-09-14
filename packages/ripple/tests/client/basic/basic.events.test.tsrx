import { describe, it, expect } from 'vitest';
import { flushSync, track } from 'ripple';

describe('basic client > events', () => {
	it('renders with different event types', () => {
		function Basic() @{
			const focusCount = track(0);
			const clickCount = track(0);
			<>
				<button
					onFocus={() => {
						focusCount.value++;
					}}
					onClick={() => {
						clickCount.value++;
					}}
				>{'Test Button'}</button>
				<div class="focus-count">{focusCount.value}</div>
				<div class="click-count">{clickCount.value}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const focusDiv = container.querySelector('.focus-count');
		const clickDiv = container.querySelector('.click-count');

		button.dispatchEvent(new Event('focus'));
		flushSync();
		expect(focusDiv.textContent).toBe('1');

		button.click();
		flushSync();
		expect(clickDiv.textContent).toBe('1');
	});

	it('renders with capture events', () => {
		function Basic() @{
			const captureClicks = track(0);
			const bubbleClicks = track(0);
			<>
				<div
					onClick={{
						handleEvent: () => {
							captureClicks.value++;
						},
						capture: true,
					}}
				>
					<button
						onClick={() => {
							bubbleClicks.value++;
						}}
					>{'Click me'}</button>
					<div class="capture-count">{captureClicks.value}</div>
					<div class="bubble-count">{bubbleClicks.value}</div>
				</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');
		const captureDiv = container.querySelector('.capture-count');
		const bubbleDiv = container.querySelector('.bubble-count');

		button.click();
		flushSync();

		expect(captureDiv.textContent).toBe('1');
		expect(bubbleDiv.textContent).toBe('1');
	});

	it('renders with event listeners in spread props', () => {
		function Basic() @{
			const count = track(0);
			const minus = {
				onClick() {
					count.value--;
				},
			};
			const plus = {
				onClick() {
					count.value++;
				},
			};
			<div>
				<button {...minus} class="minus">{'-'}</button>
				<span class="count">{count.value}</span>
				<button {...plus} class="plus">{'+'}</button>
			</div>
		}

		render(Basic);

		const minusButton = container.querySelector('.minus');
		const plusButton = container.querySelector('.plus');
		const countSpan = container.querySelector('.count');

		expect(countSpan.textContent).toBe('0');

		// Test that the buttons don't have string onclick attributes
		expect(minusButton.getAttribute('onclick')).toBe(null);
		expect(plusButton.getAttribute('onclick')).toBe(null);

		// Test that the event handlers work
		minusButton.click();
		flushSync();
		expect(countSpan.textContent).toBe('-1');

		plusButton.click();
		flushSync();
		expect(countSpan.textContent).toBe('0');

		plusButton.click();
		flushSync();
		expect(countSpan.textContent).toBe('1');
	});

	it('removes event listeners from spread props when they are replaced by another prop', () => {
		function Basic() @{
			const enabled = track(true);
			const count = track(0);
			<>
				<button
					class="target"
					{...(enabled.value ? { onClick: () => count.value++ } : { title: 'disabled' })}
				>{'target'}</button>
				<button class="toggle" onClick={() => (enabled.value = false)}>{'toggle'}</button>
				<span class="count">{count.value}</span>
			</>
		}

		render(Basic);

		const target = container.querySelector('.target');
		const toggle = container.querySelector('.toggle');
		const count = container.querySelector('.count');

		target.click();
		flushSync();
		expect(count.textContent).toBe('1');

		toggle.click();
		flushSync();
		expect(target.getAttribute('title')).toBe('disabled');
		target.click();
		flushSync();
		expect(count.textContent).toBe('1');
	});

	it('handles both delegated and non-delegated events in spread props', () => {
		function Basic() @{
			const clickCount = track(0);
			const focusCount = track(0);
			const mixedHandler = {
				onClick() {
					// Delegated event
					clickCount.value++;
				},
				onFocus() {
					// Non-delegated event
					focusCount.value++;
				},
			};
			<div>
				<button {...mixedHandler} class="mixed-button">{'Test'}</button>
				<span class="click-count">{clickCount.value}</span>
				<span class="focus-count">{focusCount.value}</span>
			</div>
		}

		render(Basic);

		const button = container.querySelector('.mixed-button');
		const clickSpan = container.querySelector('.click-count');
		const focusSpan = container.querySelector('.focus-count');

		expect(clickSpan.textContent).toBe('0');
		expect(focusSpan.textContent).toBe('0');

		// Test delegated event (click)
		button.click();
		flushSync();
		expect(clickSpan.textContent).toBe('1');

		// Test non-delegated event (focus)
		button.dispatchEvent(new Event('focus'));
		flushSync();
		expect(focusSpan.textContent).toBe('1');
	});

	it('renders with complex event handling and state updates', () => {
		function Basic() @{
			const counter = track(0);
			const history = track<string[]>([]);
			const isEven = track(true);
			const handleIncrement = () => {
				counter.value++;
				history.value = [...history.value, `Inc to ${counter.value}`];
				isEven.value = counter.value % 2 === 0;
			};
			const handleDecrement = () => {
				counter.value--;
				history.value = [...history.value, `Dec to ${counter.value}`];
				isEven.value = counter.value % 2 === 0;
			};
			const handleReset = () => {
				counter.value = 0;
				history.value = [...history.value, 'Reset'];
				isEven.value = true;
			};
			<>
				<div class="counter">{counter.value}</div>
				<div class="parity">
					{isEven.value ? 'Even' : 'Odd'}
				</div>
				<div class="history-count">{history.value.length}</div>
				<button class="inc-btn" onClick={handleIncrement}>{'+'}</button>
				<button class="dec-btn" onClick={handleDecrement}>{'-'}</button>
				<button class="reset-btn" onClick={handleReset}>{'Reset'}</button>
			</>
		}

		render(Basic);

		const counterDiv = container.querySelector('.counter');
		const parityDiv = container.querySelector('.parity');
		const historyDiv = container.querySelector('.history-count');
		const incBtn = container.querySelector('.inc-btn');
		const decBtn = container.querySelector('.dec-btn');
		const resetBtn = container.querySelector('.reset-btn');

		expect(counterDiv.textContent).toBe('0');
		expect(parityDiv.textContent).toBe('Even');
		expect(historyDiv.textContent).toBe('0');

		incBtn.click();
		flushSync();

		expect(counterDiv.textContent).toBe('1');
		expect(parityDiv.textContent).toBe('Odd');
		expect(historyDiv.textContent).toBe('1');

		incBtn.click();
		flushSync();

		expect(counterDiv.textContent).toBe('2');
		expect(parityDiv.textContent).toBe('Even');
		expect(historyDiv.textContent).toBe('2');

		decBtn.click();
		flushSync();

		expect(counterDiv.textContent).toBe('1');
		expect(parityDiv.textContent).toBe('Odd');
		expect(historyDiv.textContent).toBe('3');

		resetBtn.click();
		flushSync();

		expect(counterDiv.textContent).toBe('0');
		expect(parityDiv.textContent).toBe('Even');
		expect(historyDiv.textContent).toBe('4');
	});
});
