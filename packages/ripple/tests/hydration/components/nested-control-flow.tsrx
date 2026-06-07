// Granular components for isolating nested control flow hydration issues.
// Each component tests one specific combination of for / if / switch.

// ── for + if (2 items shown, 1 hidden) ────────────────────────────────────────
export function ForIf() @{
	const items = [
		{ id: 1, show: true, label: 'One' },
		{ id: 2, show: true, label: 'Two' },
		{ id: 3, show: false, label: 'Three' },
	];
	<ul class="for-if">
		@for (const item of items; key item.id) {
			@if (item.show) {
				<li class={`item item-${item.id}`}>{item.label}</li>
			}
		}
	</ul>
}

// ── for + switch (3 items, alternating cases) ─────────────────────────────────
export function ForSwitch() @{
	const items = [
		{ id: 1, kind: 'a' },
		{ id: 2, kind: 'b' },
		{ id: 3, kind: 'a' },
	];
	<ul class="for-switch">
		@for (const item of items; key item.id) {
			@switch (item.kind) {
				@case 'a': {
					<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
				}
				@default: {
					<li class={`item item-${item.id} kind-b`}>{`B-${item.id}`}</li>
				}
			}
		}
	</ul>
}

// ── if + switch (no for loop) ─────────────────────────────────────────────────
export function IfSwitch() @{
	const show = true;
	const kind = 'a';
	<div class="if-switch">
		@if (show) {
			@switch (kind) {
				@case 'a': {
					<p class="case-a">Case A</p>
				}
				@default: {
					<p class="case-default">{'Default'}</p>
				}
			}
		}
	</div>
}

// ── if + switch where if is false ─────────────────────────────────────────────
export function IfSwitchHidden() @{
	const show = false;
	const kind = 'a';
	<div class="if-switch-hidden">
		@if (show) {
			@switch (kind) {
				@case 'a': {
					<p class="case-a">Case A</p>
				}
				@default: {
					<p class="case-default">{'Default'}</p>
				}
			}
		}
		<p class="after">{'after'}</p>
	</div>
}

// ── for + if + switch, single item (no inter-item cursor advance needed) ───────
export function ForIfSwitchSingle() @{
	const items = [
		{ id: 1, kind: 'a', show: true },
	];
	<ul class="for-if-switch-single">
		@for (const item of items; key item.id) {
			@if (item.show) {
				@switch (item.kind) {
					@case 'a': {
						<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
					}
					@default: {
						<li class={`item item-${item.id} kind-default`}>{`D-${item.id}`}</li>
					}
				}
			}
		}
	</ul>
}

// ── for + if + switch, two items shown (the cursor-advance regression) ─────────
export function ForIfSwitchMulti() @{
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true },
	];
	<ul class="for-if-switch-multi">
		@for (const item of items; key item.id) {
			@if (item.show) {
				@switch (item.kind) {
					@case 'a': {
						<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
					}
					@default: {
						<li class={`item item-${item.id} kind-b`}>{`B-${item.id}`}</li>
					}
				}
			}
		}
	</ul>
}

// ── for + if + switch, last item hidden (if=false path between items) ──────────
export function ForIfSwitchWithDisabled() @{
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: false },
		{ id: 3, kind: 'a', show: true },
	];
	<ul class="for-if-switch-disabled">
		@for (const item of items; key item.id) {
			@if (item.show) {
				@switch (item.kind) {
					@case 'a': {
						<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
					}
					@default: {
						<li class={`item item-${item.id} kind-b`}>{`B-${item.id}`}</li>
					}
				}
			}
		}
	</ul>
}

// ── switch + try (no for/if) ──────────────────────────────────────────────────
export function SwitchTry() @{
	const kind = 'a';
	<div class="switch-try">
		@switch (kind) {
			@case 'a': {
				@try {
					<p class="resolved-a">{'A resolved'}</p>
				} @pending {
					<p class="pending-a">{'A pending'}</p>
				}
			}
			@default: {
				<p class="default">{'Default'}</p>
			}
		}
	</div>
}

// ── for + switch + try (no if) ────────────────────────────────────────────────
export function ForSwitchTry() @{
	const items = [
		{ id: 1, kind: 'a' },
		{ id: 2, kind: 'b' },
	];
	<ul class="for-switch-try">
		@for (const item of items; key item.id) {
			@switch (item.kind) {
				@case 'a': {
					@try {
						<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
					} @pending {
						<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
					}
				}
				@default: {
					@try {
						<li class={`item item-${item.id} kind-b`}>{`B-${item.id}`}</li>
					} @pending {
						<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
					}
				}
			}
		}
	</ul>
}

// ── for + if + try (no switch) ────────────────────────────────────────────────
export function ForIfTry() @{
	const items = [
		{ id: 1, show: true },
		{ id: 2, show: true },
	];
	<ul class="for-if-try">
		@for (const item of items; key item.id) {
			@if (item.show) {
				@try {
					<li class={`item item-${item.id}`}>{`item-${item.id}`}</li>
				} @pending {
					<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
				}
			}
		}
	</ul>
}

// ── for + if + switch + try, single item ─────────────────────────────────────
export function ForIfSwitchTrySingle() @{
	const items = [
		{ id: 1, kind: 'a', show: true },
	];
	<ul class="for-if-switch-try-single">
		@for (const item of items; key item.id) {
			@if (item.show) {
				@switch (item.kind) {
					@case 'a': {
						@try {
							<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
						} @pending {
							<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
						}
					}
					@default: {
						@try {
							<li class={`item item-${item.id} kind-default`}>{`D-${item.id}`}</li>
						} @pending {
							<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
						}
					}
				}
			}
		}
	</ul>
}

// ── for + if + switch + try, multiple items (matches MixedControlFlowStatic) ──
export function ForIfSwitchTryMulti() @{
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true },
	];
	<ul class="for-if-switch-try-multi">
		@for (const item of items; key item.id) {
			@if (item.show) {
				@switch (item.kind) {
					@case 'a': {
						@try {
							<li class={`item item-${item.id} kind-a`}>{`A-${item.id}`}</li>
						} @pending {
							<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
						}
					}
					@default: {
						@try {
							<li class={`item item-${item.id} kind-b`}>{`B-${item.id}`}</li>
						} @pending {
							<li class={`pending pending-${item.id}`}>{`pending ${item.id}`}</li>
						}
					}
				}
			}
		}
	</ul>
}
