import { createContext, memo, useContext } from 'octane';

// The 2-deep memo chain every wall row mounts:
//
//   memo(Row) → 3 host elements + memo(Inner) → host element + Leaf (context consumer)
//
// Row takes 5 props — id / label / value (primitives read off the module-level
// item arrays), wall ('A' | 'B' literal), onSelect (module-level handler) —
// all reference-stable across parent re-renders, so tryMemoBail's
// shallowEqualProps bails unless an op deliberately changed the row's item.
// Leaf reads the per-wall theme context, so a provider bump must cross BOTH
// bailed memo boundaries (Row, then Inner) via refreshContextConsumers without
// re-running either body — the window.__renders probes prove it.
//
// One context object PER WALL: a context's $$version is global to the context
// OBJECT (not per provider), so a single shared context would let wall A's
// provider bumps stale-stamp wall B's memo boundaries and contaminate wall B's
// next op with a spurious 1000-leaf refresh. Two objects keep every op's work
// confined to the wall it targets.

export const ThemeA = createContext('t0');
export const ThemeB = createContext('t0');

// The context consumer. Deliberately NOT memo'd — it is the endpoint the
// context-refresh walk must re-run (1000 of these per ctx op).
function Leaf(props) @{
	window.__renders['leaf' + props.wall]++;
	const theme = useContext(props.wall === 'A' ? ThemeA : ThemeB);
	<span class="leaf">{theme as string}</span>
}

// The nested memo boundary INSIDE Row — a memo'd pure indirection wrapping the
// consumer. On a ctx bump it must bail (its props didn't change) while the
// refresh walk descends through it to Leaf.
function InnerImpl(props) @{
	window.__renders['inner' + props.wall]++;
	<span class="inner">
		{props.value as string}
		<Leaf wall={props.wall} />
	</span>
}
const Inner = memo(InnerImpl);

function RowImpl(props) @{
	window.__renders['row' + props.wall]++;
	<div class="item">
		<span class="id" onClick={props.onSelect}>{props.id as string}</span>
		<span class="label">{props.label as string}</span>
		<Inner value={props.value} wall={props.wall} />
	</div>
}
export const Row = memo(RowImpl);
