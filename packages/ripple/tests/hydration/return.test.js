import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/return.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/return.js';

describe('hydration > return statements', () => {
	describe('basic returns', () => {
		it('hydrates direct return - skips content after return', async () => {
			await hydrateComponent(ServerComponents.DirectReturn, ClientComponents.DirectReturn);
			expect(container.querySelector('.before')?.textContent).toBe('before');
			expect(container.querySelector('.after')).toBeNull();
		});

		it('hydrates conditional return - condition true skips rest', async () => {
			await hydrateComponent(
				ServerComponents.ConditionalReturnTrue,
				ClientComponents.ConditionalReturnTrue,
			);
			expect(container.querySelector('.guard')?.textContent).toBe('guard hit');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates conditional return - condition false shows rest', async () => {
			await hydrateComponent(
				ServerComponents.ConditionalReturnFalse,
				ClientComponents.ConditionalReturnFalse,
			);
			expect(container.querySelector('.guard')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');
		});

		it('hydrates content before and after return guard', async () => {
			await hydrateComponent(
				ServerComponents.ContentBeforeAfterReturn,
				ClientComponents.ContentBeforeAfterReturn,
			);
			expect(container.querySelector('.before')?.textContent).toBe('before');
			expect(container.querySelector('.guard')?.textContent).toBe('guard');
			expect(container.querySelector('.after')).toBeNull();
		});

		it('hydrates multiple elements after guard when condition is false', async () => {
			await hydrateComponent(
				ServerComponents.MultipleElementsAfterGuard,
				ClientComponents.MultipleElementsAfterGuard,
			);
			expect(container.querySelector('.guard')).toBeNull();
			expect(container.querySelector('.first')?.textContent).toBe('first');
			expect(container.querySelector('.second')?.textContent).toBe('second');
		});
	});

	describe('multiple sequential returns', () => {
		it('hydrates multiple returns - first hits', async () => {
			await hydrateComponent(
				ServerComponents.MultipleReturnsFirstHits,
				ClientComponents.MultipleReturnsFirstHits,
			);
			expect(container.querySelector('.first')?.textContent).toBe('first guard');
			expect(container.querySelector('.second')).toBeNull();
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates multiple returns - second hits', async () => {
			await hydrateComponent(
				ServerComponents.MultipleReturnsSecondHits,
				ClientComponents.MultipleReturnsSecondHits,
			);
			expect(container.querySelector('.first')).toBeNull();
			expect(container.querySelector('.second')?.textContent).toBe('second guard');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates multiple returns - none hit', async () => {
			await hydrateComponent(
				ServerComponents.MultipleReturnsNoneHit,
				ClientComponents.MultipleReturnsNoneHit,
			);
			expect(container.querySelector('.first')).toBeNull();
			expect(container.querySelector('.second')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');
		});

		it('hydrates multiple sibling returns at same level', async () => {
			await hydrateComponent(
				ServerComponents.MultipleSiblingReturns,
				ClientComponents.MultipleSiblingReturns,
			);
			expect(container.querySelector('.mode-a')).toBeNull();
			expect(container.querySelector('.mode-b')?.textContent).toBe('mode B');
			expect(container.querySelector('.mode-c')).toBeNull();
			expect(container.querySelector('.default')).toBeNull();
		});
	});

	describe('nested returns', () => {
		it('hydrates nested returns - all conditions true', async () => {
			await hydrateComponent(
				ServerComponents.NestedReturnsAllTrue,
				ClientComponents.NestedReturnsAllTrue,
			);
			expect(container.querySelector('.a')?.textContent).toBe('a is true');
			expect(container.querySelector('.b')?.textContent).toBe('b is true');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates nested returns - inner condition false', async () => {
			await hydrateComponent(
				ServerComponents.NestedReturnsInnerFalse,
				ClientComponents.NestedReturnsInnerFalse,
			);
			expect(container.querySelector('.a')?.textContent).toBe('a is true');
			expect(container.querySelector('.b')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');
		});

		it('hydrates nested returns - outer condition false', async () => {
			await hydrateComponent(
				ServerComponents.NestedReturnsOuterFalse,
				ClientComponents.NestedReturnsOuterFalse,
			);
			expect(container.querySelector('.a')).toBeNull();
			expect(container.querySelector('.b')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');
		});

		it('hydrates deeply nested returns (3 levels) - all true', async () => {
			await hydrateComponent(
				ServerComponents.DeeplyNestedReturnsAllTrue,
				ClientComponents.DeeplyNestedReturnsAllTrue,
			);
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')?.textContent).toBe('b');
			expect(container.querySelector('.c')?.textContent).toBe('c');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates deeply nested returns (3 levels) - innermost false', async () => {
			await hydrateComponent(
				ServerComponents.DeeplyNestedReturnsInnermostFalse,
				ClientComponents.DeeplyNestedReturnsInnermostFalse,
			);
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')?.textContent).toBe('b');
			expect(container.querySelector('.c')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');
		});
	});

	describe('else-if chains with returns', () => {
		it('hydrates else-if chain - first condition', async () => {
			await hydrateComponent(ServerComponents.ElseIfChainFirst, ClientComponents.ElseIfChainFirst);
			expect(container.querySelector('.one')?.textContent).toBe('one');
			expect(container.querySelector('.two')).toBeNull();
			expect(container.querySelector('.other')).toBeNull();
			expect(container.querySelector('.never')).toBeNull();
		});

		it('hydrates else-if chain - second condition', async () => {
			await hydrateComponent(
				ServerComponents.ElseIfChainSecond,
				ClientComponents.ElseIfChainSecond,
			);
			expect(container.querySelector('.one')).toBeNull();
			expect(container.querySelector('.two')?.textContent).toBe('two');
			expect(container.querySelector('.other')).toBeNull();
			expect(container.querySelector('.never')).toBeNull();
		});

		it('hydrates else-if chain - else condition', async () => {
			await hydrateComponent(ServerComponents.ElseIfChainElse, ClientComponents.ElseIfChainElse);
			expect(container.querySelector('.one')).toBeNull();
			expect(container.querySelector('.two')).toBeNull();
			expect(container.querySelector('.other')?.textContent).toBe('other');
			expect(container.querySelector('.never')).toBeNull();
		});
	});

	describe('return with else branches', () => {
		it('hydrates return with else that does not return', async () => {
			await hydrateComponent(
				ServerComponents.ReturnWithElseNoReturn,
				ClientComponents.ReturnWithElseNoReturn,
			);
			expect(container.querySelector('.true')).toBeNull();
			expect(container.querySelector('.false')?.textContent).toBe('condition false');
			expect(container.querySelector('.after')?.textContent).toBe('after if-else');
		});

		it('hydrates return with else that also returns', async () => {
			await hydrateComponent(
				ServerComponents.ReturnWithElseBothReturn,
				ClientComponents.ReturnWithElseBothReturn,
			);
			expect(container.querySelector('.true')).toBeNull();
			expect(container.querySelector('.false')?.textContent).toBe('condition false');
			expect(container.querySelector('.never')).toBeNull();
		});
	});

	describe('reactive returns', () => {
		it('hydrates and toggles reactive return (true to false)', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveReturnTrueToFalse,
				ClientComponents.ReactiveReturnTrueToFalse,
			);

			// Initially condition is true, so guard is shown, rest is hidden
			expect(container.querySelector('.guard')?.textContent).toBe('guard hit');
			expect(container.querySelector('.rest')).toBeNull();

			// Toggle condition to false
			container.querySelector('.toggle')?.click();
			flushSync();

			// Now rest should be shown
			expect(container.querySelector('.guard')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');

			// Toggle back to true
			container.querySelector('.toggle')?.click();
			flushSync();

			expect(container.querySelector('.guard')?.textContent).toBe('guard hit');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates and toggles reactive return (false to true)', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveReturnFalseToTrue,
				ClientComponents.ReactiveReturnFalseToTrue,
			);

			// Initially condition is false, so rest is shown
			expect(container.querySelector('.guard')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');

			// Toggle condition to true
			container.querySelector('.toggle')?.click();
			flushSync();

			// Now guard should be shown, rest hidden
			expect(container.querySelector('.guard')?.textContent).toBe('guard hit');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates and toggles reactive nested return', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveNestedReturn,
				ClientComponents.ReactiveNestedReturn,
			);

			// Initially a=true and b=true - shows a, b, hides rest
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')?.textContent).toBe('b');
			expect(container.querySelector('.rest')).toBeNull();

			// Toggle b to false - rest should appear
			container.querySelector('.toggle')?.click();
			flushSync();

			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');

			// Toggle b back to true
			container.querySelector('.toggle')?.click();
			flushSync();

			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')?.textContent).toBe('b');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates and cycles reactive sibling returns across all branches', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveSiblingReturns,
				ClientComponents.ReactiveSiblingReturns,
			);

			// first
			expect(container.querySelector('.first')?.textContent).toBe('first guard');
			expect(container.querySelector('.second')).toBeNull();
			expect(container.querySelector('.rest')).toBeNull();

			// second
			container.querySelector('.toggle')?.click();
			flushSync();
			expect(container.querySelector('.first')).toBeNull();
			expect(container.querySelector('.second')?.textContent).toBe('second guard');
			expect(container.querySelector('.rest')).toBeNull();

			// fallback
			container.querySelector('.toggle')?.click();
			flushSync();
			expect(container.querySelector('.first')).toBeNull();
			expect(container.querySelector('.second')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');

			// back to first
			container.querySelector('.toggle')?.click();
			flushSync();
			expect(container.querySelector('.first')?.textContent).toBe('first guard');
			expect(container.querySelector('.second')).toBeNull();
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates nested tracked returns when outer and inner conditions both change', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveOuterInnerReturns,
				ClientComponents.ReactiveOuterInnerReturns,
			);

			// a=true, b=true
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')?.textContent).toBe('b');
			expect(container.querySelector('.rest')).toBeNull();

			// b=false => no early return, rest should appear in a-on mode
			container.querySelector('.toggle-b')?.click();
			flushSync();
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('a-on rest');

			// a=false => outer block disappears, rest switches to a-off mode
			container.querySelector('.toggle-a')?.click();
			flushSync();
			expect(container.querySelector('.a')).toBeNull();
			expect(container.querySelector('.b')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('a-off rest');

			// a=true (b still false) => a returns, rest switches back to a-on mode
			container.querySelector('.toggle-a')?.click();
			flushSync();
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('a-on rest');

			// b=true => early return again, hide rest
			container.querySelector('.toggle-b')?.click();
			flushSync();
			expect(container.querySelector('.a')?.textContent).toBe('a');
			expect(container.querySelector('.b')?.textContent).toBe('b');
			expect(container.querySelector('.rest')).toBeNull();
		});

		it('hydrates reactive else-if return chain through return and non-return states', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveElseIfReturns,
				ClientComponents.ReactiveElseIfReturns,
			);

			// status=0
			expect(container.querySelector('.zero')?.textContent).toBe('zero');
			expect(container.querySelector('.one')).toBeNull();
			expect(container.querySelector('.rest')).toBeNull();
			expect(container.querySelector('.tail')).toBeNull();

			// status=1
			container.querySelector('.toggle')?.click();
			flushSync();
			expect(container.querySelector('.zero')).toBeNull();
			expect(container.querySelector('.one')?.textContent).toBe('one');
			expect(container.querySelector('.rest')).toBeNull();
			expect(container.querySelector('.tail')).toBeNull();

			// status=2
			container.querySelector('.toggle')?.click();
			flushSync();
			expect(container.querySelector('.zero')).toBeNull();
			expect(container.querySelector('.one')).toBeNull();
			expect(container.querySelector('.rest')?.textContent).toBe('rest');
			expect(container.querySelector('.tail')?.textContent).toBe('tail');

			// status=0
			container.querySelector('.toggle')?.click();
			flushSync();
			expect(container.querySelector('.zero')?.textContent).toBe('zero');
			expect(container.querySelector('.one')).toBeNull();
			expect(container.querySelector('.rest')).toBeNull();
			expect(container.querySelector('.tail')).toBeNull();
		});

		it('hydrates deeply nested independent returns and keeps trailing root siblings aligned', async () => {
			await hydrateComponent(
				ServerComponents.ReactiveDeepNestedIndependentReturns,
				ClientComponents.ReactiveDeepNestedIndependentReturns,
			);

			const expect_full_content = () => {
				expect(container.querySelector('.top')?.textContent).toBe('top');
				expect(container.querySelector('.middle')?.textContent).toBe('middle');
				expect(container.querySelector('.nest-1-a')?.textContent).toBe('nest-1-a');
				expect(container.querySelector('.nest-1-b')?.textContent).toBe('nest-1-b');
				expect(container.querySelector('.nest-2-a')?.textContent).toBe('nest-2-a');
				expect(container.querySelector('.nest-2-b')?.textContent).toBe('nest-2-b');
				expect(container.querySelector('.root-1')?.textContent).toBe('root-1');
				expect(container.querySelector('.root-2')?.textContent).toBe('root-2');
				expect(container.querySelector('.root-3')?.textContent).toBe('root-3');
				expect(container.querySelector('.root-4')?.textContent).toBe('root-4');
			};

			const expect_no_hits = () => {
				expect(container.querySelector('.hit-1')).toBeNull();
				expect(container.querySelector('.hit-2')).toBeNull();
				expect(container.querySelector('.hit-3')).toBeNull();
				expect(container.querySelector('.hit-4')).toBeNull();
			};

			expect_full_content();
			expect_no_hits();

			// C3 return: deep nested return should hide trailing root siblings
			container.querySelector('.toggle-c3')?.click();
			flushSync();
			expect(container.querySelector('.hit-3')?.textContent).toBe('hit-3');
			expect(container.querySelector('.top')?.textContent).toBe('top');
			expect(container.querySelector('.middle')?.textContent).toBe('middle');
			expect(container.querySelector('.nest-1-a')?.textContent).toBe('nest-1-a');
			expect(container.querySelector('.nest-1-b')?.textContent).toBe('nest-1-b');
			expect(container.querySelector('.nest-2-a')?.textContent).toBe('nest-2-a');
			expect(container.querySelector('.nest-2-b')).toBeNull();
			expect(container.querySelector('.root-1')).toBeNull();
			expect(container.querySelector('.root-2')).toBeNull();
			expect(container.querySelector('.root-3')).toBeNull();
			expect(container.querySelector('.root-4')).toBeNull();

			container.querySelector('.toggle-c3')?.click();
			flushSync();
			expect_full_content();
			expect_no_hits();

			// C1 return: earliest return should cut everything below top
			container.querySelector('.toggle-c1')?.click();
			flushSync();
			expect(container.querySelector('.top')?.textContent).toBe('top');
			expect(container.querySelector('.hit-1')?.textContent).toBe('hit-1');
			expect(container.querySelector('.middle')).toBeNull();
			expect(container.querySelector('.nest-1-a')).toBeNull();
			expect(container.querySelector('.nest-1-b')).toBeNull();
			expect(container.querySelector('.nest-2-a')).toBeNull();
			expect(container.querySelector('.nest-2-b')).toBeNull();
			expect(container.querySelector('.root-1')).toBeNull();
			expect(container.querySelector('.root-2')).toBeNull();
			expect(container.querySelector('.root-3')).toBeNull();
			expect(container.querySelector('.root-4')).toBeNull();

			container.querySelector('.toggle-c1')?.click();
			flushSync();
			expect_full_content();
			expect_no_hits();

			// C2 return: mid-level nested return should keep upper nested nodes, hide lower/root siblings
			container.querySelector('.toggle-c2')?.click();
			flushSync();
			expect(container.querySelector('.top')?.textContent).toBe('top');
			expect(container.querySelector('.middle')?.textContent).toBe('middle');
			expect(container.querySelector('.nest-1-a')?.textContent).toBe('nest-1-a');
			expect(container.querySelector('.hit-2')?.textContent).toBe('hit-2');
			expect(container.querySelector('.nest-1-b')).toBeNull();
			expect(container.querySelector('.nest-2-a')).toBeNull();
			expect(container.querySelector('.nest-2-b')).toBeNull();
			expect(container.querySelector('.root-1')).toBeNull();
			expect(container.querySelector('.root-2')).toBeNull();
			expect(container.querySelector('.root-3')).toBeNull();
			expect(container.querySelector('.root-4')).toBeNull();

			container.querySelector('.toggle-c2')?.click();
			flushSync();
			expect_full_content();
			expect_no_hits();

			// C4 return: deepest return should keep all nested parents but still hide root siblings
			container.querySelector('.toggle-c4')?.click();
			flushSync();
			expect(container.querySelector('.top')?.textContent).toBe('top');
			expect(container.querySelector('.middle')?.textContent).toBe('middle');
			expect(container.querySelector('.nest-1-a')?.textContent).toBe('nest-1-a');
			expect(container.querySelector('.nest-1-b')?.textContent).toBe('nest-1-b');
			expect(container.querySelector('.nest-2-a')?.textContent).toBe('nest-2-a');
			expect(container.querySelector('.nest-2-b')?.textContent).toBe('nest-2-b');
			expect(container.querySelector('.hit-4')?.textContent).toBe('hit-4');
			expect(container.querySelector('.root-1')).toBeNull();
			expect(container.querySelector('.root-2')).toBeNull();
			expect(container.querySelector('.root-3')).toBeNull();
			expect(container.querySelector('.root-4')).toBeNull();

			container.querySelector('.toggle-c4')?.click();
			flushSync();
			expect_full_content();
			expect_no_hits();
		});
	});

	describe('return in element scopes', () => {
		it('hydrates return inside nested element scope', async () => {
			await hydrateComponent(
				ServerComponents.ReturnInNestedElement,
				ClientComponents.ReturnInNestedElement,
			);
			expect(container.querySelector('.outer')).not.toBeNull();
			expect(container.querySelector('.label')?.textContent).toBe('outer');
			expect(container.querySelector('.inner')?.textContent).toBe('inner');
			expect(container.querySelector('.after')).toBeNull();
		});

		it('hydrates return with multiple elements before and after', async () => {
			await hydrateComponent(
				ServerComponents.ReturnWithMultipleElements,
				ClientComponents.ReturnWithMultipleElements,
			);
			expect(container.querySelector('.title')?.textContent).toBe('title');
			expect(container.querySelector('.desc')?.textContent).toBe('description');
			expect(container.querySelector('.guard')?.textContent).toBe('guard');
			expect(container.querySelector('.guard-span')?.textContent).toBe('guard span');
			expect(container.querySelector('.footer')).toBeNull();
			expect(container.querySelector('.nav')).toBeNull();
		});
	});

	describe('return position edge cases', () => {
		it('hydrates return at the beginning of component', async () => {
			await hydrateComponent(
				ServerComponents.ReturnAtBeginning,
				ClientComponents.ReturnAtBeginning,
			);
			expect(container.querySelector('.early')?.textContent).toBe('early exit');
			expect(container.querySelector('.never1')).toBeNull();
			expect(container.querySelector('.never2')).toBeNull();
		});

		it('hydrates return at the end of component', async () => {
			await hydrateComponent(ServerComponents.ReturnAtEnd, ClientComponents.ReturnAtEnd);
			expect(container.querySelector('.first')?.textContent).toBe('first');
			expect(container.querySelector('.second')?.textContent).toBe('second');
			expect(container.querySelector('.third')?.textContent).toBe('third');
		});
	});
});
