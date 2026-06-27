// Hydration repro: an @if body whose only child is a fragment containing
// control-flow siblings (@for / @if). The fragment is lowered to a nested
// tsrx_element rendered via an expression container, which introduces client
// placeholder `<!>` nodes that the SSR markup has no dedicated marker for — so
// the hydration cursor must still line up with the server's control-flow
// boundary comments.

// @for + trailing element sibling inside the fragment.
export function IfFragmentForElement() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	const hasLoaded = true;
	<div class="feed-c">
		@if (hasLoaded) {
			<>
				@for (const muze of muzes; key muze.muzeId) {
					<p class="muze">{muze.muzeId}</p>
				}
				<span class="after">{'after'}</span>
			</>
		}
	</div>
}

// @for + @if + @if siblings inside the fragment (the originally reported shape).
export function IfFragmentForIfIf() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	const hasLoaded = true;
	<div class="feed">
		@if (hasLoaded) {
			<>
				@for (const muze of muzes; key muze.muzeId) {
					<p class="muze">{muze.muzeId}</p>
				}
				@if (muzes.length > 0) {
					<span class="has-items">{'has items'}</span>
				}
				@if (muzes.length === 0) {
					<span class="empty">{'empty'}</span>
				}
			</>
		}
	</div>
}

// Control variant that already worked: fragment of plain elements (no control
// flow). Guards against a regression in the simple case.
export function IfFragmentElements() @{
	const hasLoaded = true;
	<div class="feed-b">
		@if (hasLoaded) {
			<>
				<p class="muze">{'b'}</p>
				<p class="muze">{'c'}</p>
			</>
		}
	</div>
}

// Regression guard: a COMPONENT-body fragment containing control flow must keep
// working WITHOUT an extra block marker — it reuses the component's own
// boundary, so the control_flow_branch_body marker must NOT be emitted here.
export function ComponentBodyFragmentControlFlow() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	<>
		@for (const muze of muzes; key muze.muzeId) {
			<p class="muze">{muze.muzeId}</p>
		}
		<span class="after">{'after'}</span>
	</>
}

// Component-body fragment whose first child is a `@{}` code block that renders
// control flow. The code block lowers to a render_expression(tsrx_element) on
// the client and emits its own SSR marker; hydration must keep the code block's
// boundary aligned.
export function ComponentBodyCodeBlockControlFlow() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	<>
		@{
			const rows = muzes;
			@for (const muze of rows; key muze.muzeId) {
				<p class="muze">{muze.muzeId}</p>
			}
		}
		<span class="after">{'after'}</span>
	</>
}

// @if branch fragment whose first child is a `@{}` code block that renders
// control flow. The fragment is a control-flow branch body, so it is bracketed
// via the control_flow_branch_body flag.
export function IfCodeBlockControlFlow() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	const hasLoaded = true;
	<div class="feed-f">
		@if (hasLoaded) {
			<>
				@{
					const rows = muzes;
					@for (const muze of rows; key muze.muzeId) {
						<p class="muze">{muze.muzeId}</p>
					}
				}
				<span class="after">{'after'}</span>
			</>
		}
	</div>
}

// @else branch whose body is a fragment of control-flow siblings.
export function IfElseFragment() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	const hasLoaded = false;
	<div class="feed-d">
		@if (hasLoaded) {
			<span class="loading">{'loading'}</span>
		} @else {
			<>
				@for (const muze of muzes; key muze.muzeId) {
					<p class="muze">{muze.muzeId}</p>
				}
				<span class="after">{'after'}</span>
			</>
		}
	</div>
}

// Fragment-in-element nested inside a control-flow branch: the inner `<>` is a
// child of <section>, not the direct branch body.
export function IfDivFragment() @{
	const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
	const hasLoaded = true;
	<div class="feed-e">
		@if (hasLoaded) {
			<section>
				<>
					@for (const muze of muzes; key muze.muzeId) {
						<p class="muze">{muze.muzeId}</p>
					}
					<span class="after">{'after'}</span>
				</>
			</section>
		}
	</div>
}
