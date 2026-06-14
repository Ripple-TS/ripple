// Fuzz fixture: keyed-list reconciliation oracle.
// FuzzList is re-rendered with random `props.items` permutations; the
// harness asserts the resulting DOM matches a from-scratch render and
// that the keyed slot bookkeeping stays internally consistent.

export function FuzzList(props) @{
	<div id="list">
		@for (const item of props.items; key item.id) {
			<span class="row" data-k={item.id as number}>
				{item.label as string}
			</span>
		}
	</div>
}

// Stress variant: nested content per item — exercises moveBlockBefore's
// range walk (start/body/end nodes per Block) under reorderings.
export function FuzzListNested(props) @{
	<div id="list">
		@for (const item of props.items; key item.id) {
			<span class="row" data-k={item.id as number}>
				<b>
					{item.label as string}
				</b>
				<i>
					{item.tag as string}
				</i>
			</span>
		}
	</div>
}
