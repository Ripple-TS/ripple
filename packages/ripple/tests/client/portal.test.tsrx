import { Portal, flushSync, track } from 'ripple';

describe('Portal', () => {
	afterEach(() => {
		// Clean up any leftover portal content from document.body
		const portals = document.body.querySelectorAll('.test-portal');
		portals.forEach((el) => el.remove());
	});

	it('renders portal content to target element', () => {
		const target = document.createElement('div');
		document.body.appendChild(target);

		function TestPortal() @{
			<Portal {target}>
				<div class="test-portal">{'Portal works!'}</div>
			</Portal>
		}

		render(TestPortal);

		// Portal content should be in the target, not in container
		expect(container.querySelector('.test-portal')).toBeNull();
		expect(target.querySelector('.test-portal')).toBeTruthy();
		expect(target.querySelector('.test-portal').textContent).toBe('Portal works!');

		document.body.removeChild(target);
	});

	it('renders portal content to document.body', () => {
		function TestPortal() @{
			<Portal target={document.body}>
				<div class="test-portal">{'In document.body!'}</div>
			</Portal>
		}

		render(TestPortal);

		// Should not be in container
		expect(container.querySelector('.test-portal')).toBeNull();

		// Should be in document.body
		expect(document.body.querySelector('.test-portal')).toBeTruthy();
		expect(document.body.querySelector('.test-portal').textContent).toBe('In document.body!');
	});

	it('cleans up portal content when destroyed via conditional rendering', () => {
		function TestPortal() @{
			let &[open] = track(true);
			<>
				@if (open) {
					<Portal target={document.body}>
						<div class="test-portal">{'Conditional content'}</div>
					</Portal>
				}
				<button onClick={() => (open = false)}>{'Close'}</button>
			</>
		}

		render(TestPortal);

		// Initially portal content should be present
		expect(document.body.querySelector('.test-portal')).toBeTruthy();

		// Click close button to destroy portal
		container.querySelector('button').click();
		flushSync();

		// Portal content should be cleaned up
		expect(document.body.querySelector('.test-portal')).toBeNull();
	});

	it('opens and closes portal via conditional rendering', () => {
		function TestPortal() @{
			let &[open] = track(false);
			<>
				@if (open) {
					<Portal target={document.body}>
						<div class="test-portal">
							{'Content'}
							<button onClick={() => (open = false)}>{'Close'}</button>
						</div>
					</Portal>
				}
				@if (!open) {
					<button onClick={() => (open = true)}>{'Open'}</button>
				}
			</>
		}

		render(TestPortal);

		// Open the portal
		container.querySelector('button').click();
		flushSync();
		expect(document.body.querySelector('.test-portal')).toBeTruthy();

		// Close the portal - this should work without errors
		expect(() => {
			document.body.querySelector('button').click();
			flushSync();
		}).not.toThrow();

		// Portal content should be cleaned up
		expect(document.body.querySelector('.test-portal')).toBeNull();
	});

	it('handles multiple portals simultaneously', () => {
		const target1 = document.createElement('div');
		const target2 = document.createElement('div');
		target1.id = 'multi-target1';
		target2.id = 'multi-target2';
		document.body.appendChild(target1);
		document.body.appendChild(target2);

		function TestMultiPortal() @{
			<>
				<Portal target={target1}>
					<div class="test-portal">{'Portal 1 content'}</div>
				</Portal>
				<Portal target={target2}>
					<div class="test-portal">{'Portal 2 content'}</div>
				</Portal>
			</>
		}

		render(TestMultiPortal);

		// Both portals should render in their respective targets
		expect(target1.querySelector('.test-portal')).toBeTruthy();
		expect(target1.querySelector('.test-portal').textContent).toBe('Portal 1 content');

		expect(target2.querySelector('.test-portal')).toBeTruthy();
		expect(target2.querySelector('.test-portal').textContent).toBe('Portal 2 content');

		document.body.removeChild(target1);
		document.body.removeChild(target2);
	});

	it(
		'two portals sharing the same target: closing one does not break click delegation for the other',
		() => {
			// Regression test: handle_root_events used to have no ref-counting per
			// target. When two Portals both targeted document.body (e.g. a Modal
			// and a SideSheet), closing/unmounting the first Portal would tear
			// down the shared delegated event listeners for *all* portals on that
			// target, silently breaking clicks inside any portal still open.
			function TestSharedTargetPortals() @{
				let &[modalOpen] = track(true);
				let &[sheetOpen] = track(true);
				let &[sheetClicks] = track(0);
				<>
					@if (modalOpen) {
						<Portal target={document.body}>
							<div class="test-portal test-modal">
								<button
									class="close-modal"
									onClick={() => (modalOpen = false)}
								>{'Close modal'}</button>
							</div>
						</Portal>
					}
					@if (sheetOpen) {
						<Portal target={document.body}>
							<div class="test-portal test-sheet">
								<span class="sheet-clicks">{String(sheetClicks)}</span>
								<button
									class="sheet-btn"
									onClick={() => {
										sheetClicks++;
									}}
								>{'Sheet button'}</button>
							</div>
						</Portal>
					}
				</>
			}

			render(TestSharedTargetPortals);

			expect(document.body.querySelector('.close-modal')).toBeTruthy();
			expect(document.body.querySelector('.sheet-btn')).toBeTruthy();

			// Close the modal portal - its cleanup must not tear down the shared
			// document.body event delegation that the still-open sheet portal relies on.
			document.body.querySelector('.close-modal').click();
			flushSync();

			expect(document.body.querySelector('.close-modal')).toBeNull();
			const sheetBtn = document.body.querySelector('.sheet-btn');
			expect(sheetBtn).toBeTruthy();
			expect(document.body.querySelector('.sheet-clicks').textContent).toBe('0');

			sheetBtn.click();
			flushSync();

			// This is the actual regression check: before the fix, the shared
			// document.body listener was removed when the modal portal's cleanup
			// ran, so this click would never reach the handler and the count
			// would stay at 0.
			expect(document.body.querySelector('.sheet-clicks').textContent).toBe('1');
		},
	);

	it('retargets portal when target changes and keeps click delegation working', () => {
		const target1 = document.createElement('div');
		const target2 = document.createElement('div');
		document.body.appendChild(target1);
		document.body.appendChild(target2);

		function TestRetargetPortal() @{
			let &[useSecond] = track(false);
			let &[clicks] = track(0);
			<>
				<button class="swap" onClick={() => (useSecond = true)}>{'Swap'}</button>
				<Portal target={useSecond ? target2 : target1}>
					<div class="test-portal">
						<span class="clicks">{String(clicks)}</span>
						<button class="portal-btn" onClick={() => clicks++}>{'Click'}</button>
					</div>
				</Portal>
			</>
		}

		render(TestRetargetPortal);

		expect(target1.querySelector('.portal-btn')).toBeTruthy();
		target1.querySelector('.portal-btn').click();
		flushSync();
		expect(target1.querySelector('.clicks').textContent).toBe('1');

		container.querySelector('.swap').click();
		flushSync();

		// Content moved to the new target, and delegation must follow it there.
		expect(target1.querySelector('.portal-btn')).toBeNull();
		expect(target2.querySelector('.portal-btn')).toBeTruthy();

		target2.querySelector('.portal-btn').click();
		flushSync();
		expect(target2.querySelector('.clicks').textContent).toBe('2');

		document.body.removeChild(target1);
		document.body.removeChild(target2);
	});

	it('handles portal with reactive content', () => {
		function TestReactivePortal() @{
			let &[count] = track(0);
			<Portal target={document.body}>
				<div class="test-portal">
					{'Count: '}
					{String(count)}
					<button onClick={() => count++}>{'Increment'}</button>
				</div>
			</Portal>
		}

		render(TestReactivePortal);

		const portalElement = document.body.querySelector('.test-portal');
		expect(portalElement).toBeTruthy();
		expect(portalElement.textContent).toContain('Count: 0');

		// Click increment button
		portalElement.querySelector('button').click();
		flushSync();

		expect(portalElement.textContent).toContain('Count: 1');
	});
});
