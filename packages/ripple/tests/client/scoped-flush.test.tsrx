import { flushSync, track, Context } from 'ripple';

describe('scoped flush', () => {
	// Scoped descent must not change observable behaviour: a tracked shared across
	// sibling subtrees via a module-level variable (escaping its owner subtree)
	// must still update its out-of-subtree subscriber.
	it('updates a sibling subtree that reads a module-smuggled tracked', () => {
		let shared = null;
		let bump = null;

		function Producer() @{
			let &[v, vT] = track(0);
			shared = vT;
			bump = () => {
				v += 1;
			};
			<div class="producer">{'producer'}</div>
		}

		function Consumer() @{
			<div class="consumer">
				{shared ? shared.value : -1}
			</div>
		}

		function App() @{
			<>
				<Producer />
				<Consumer />
			</>
		}

		render(App);

		expect(container.querySelector('.consumer').textContent).toBe('0');

		flushSync(() => bump());

		expect(container.querySelector('.consumer').textContent).toBe('1');

		flushSync(() => bump());

		expect(container.querySelector('.consumer').textContent).toBe('2');
	});

	// The common, scope-safe case: a Context-provided tracked read at many leaves.
	// A root update must fan out to all leaves; a scoped update must reach only the
	// targeted subtree's leaf and leave the others untouched.
	it('fans out a root update and scopes a nested update', () => {
		const Ctx = new Context(null);
		let bumpRoot = null;
		let bumpLeftLocal = null;

		function Leaf(props) @{
			const rootT = Ctx.get();
			<span class={'leaf-' + props.id}>
				{rootT ? rootT.value : -1}
			</span>
		}

		function Branch(props) @{
			let &[local, localT] = track(0);
			if (props.side === 'L') {
				bumpLeftLocal = () => {
					local += 1;
				};
			}
			<div class={'branch-' + props.side}>
				<Leaf id={props.side + '0'} />
				<Leaf id={props.side + '1'} />
			</div>
		}

		function App() @{
			let &[root, rootT] = track(0);
			Ctx.set(rootT);
			bumpRoot = () => {
				root += 1;
			};
			<div>
				<Branch side="L" />
				<Branch side="R" />
			</div>
		}

		render(App);

		const leaves = () => ['L0', 'L1', 'R0', 'R1'].map(
			(id) => container.querySelector('.leaf-' + id).textContent,
		);

		expect(leaves()).toEqual(['0', '0', '0', '0']);

		flushSync(() => bumpRoot());
		expect(leaves()).toEqual(['1', '1', '1', '1']);

		flushSync(() => bumpLeftLocal());
		// Local bump touches no Context value, so leaf text is unchanged, but the
		// update must flush without error and not disturb sibling subtrees.
		expect(leaves()).toEqual(['1', '1', '1', '1']);

		flushSync(() => bumpRoot());
		expect(leaves()).toEqual(['2', '2', '2', '2']);
	});
});
