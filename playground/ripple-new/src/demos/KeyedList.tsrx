import { useState, useCallback } from 'ripple-new';

// Keyed @for reconciliation — proves rows survive reorders / prepends.
// Exercises the source-order anchor work: rows render BETWEEN the input
// (above) and the action bar (below) without colliding with siblings.
export function KeyedList() @{
	const [items, setItems] = useState([
		{ id: 1, label: 'apple' },
		{ id: 2, label: 'banana' },
		{ id: 3, label: 'cherry' },
	]);
	const [draft, setDraft] = useState('');

	const append = useCallback(() => {
		if (!draft) return;
		setItems((xs) => [...xs, { id: Date.now(), label: draft }]);
		setDraft('');
	}, [draft]);
	const prepend = useCallback(() => {
		if (!draft) return;
		setItems((xs) => [{ id: Date.now(), label: draft }, ...xs]);
		setDraft('');
	}, [draft]);
	const reverse = useCallback(() => setItems((xs) => [...xs].reverse()), []);
	const clear = useCallback(() => setItems([]), []);
	const remove = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

	<div>
		<h2 class="demo-title">{'Keyed list'}</h2>
		<p
			class="demo-blurb"
		>{'@for with `key item.id`. Reorder / prepend / append — each row keeps its identity.'}</p>
		<div class="row">
			<input
				class="txt"
				value={draft}
				onInput={(e) => setDraft(e.target.value)}
				placeholder="new item"
			/>
			<button class="btn" onClick={prepend}>{'prepend'}</button>
			<button class="btn" onClick={append}>{'append'}</button>
			<button class="btn" onClick={reverse}>{'reverse'}</button>
			<button class="btn" onClick={clear}>{'clear'}</button>
		</div>
		<ul class="list">
			@for (const item of items; key item.id) {
				<li>
					<span>
						{item.label as string}
					</span>
					<button class="btn" onClick={() => remove(item.id)}>{'×'}</button>
				</li>
			} @empty {
				<li>
					<span>{'(empty — add an item above)'}</span>
					<span></span>
				</li>
			}
		</ul>
	</div>
}
