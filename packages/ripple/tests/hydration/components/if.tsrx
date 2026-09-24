import { track } from 'ripple';

// If block components for hydration testing

export function IfTruthy() @{
	const show = true;
	@if (show) {
		<div class="shown">{'Visible'}</div>
	}
}

export function IfFalsy() @{
	const show = false;
	@if (show) {
		<div class="shown">{'Visible'}</div>
	}
}

export function IfElse() @{
	const isLoggedIn = true;
	@if (isLoggedIn) {
		<div class="logged-in">{'Welcome back!'}</div>
	} @else {
		<div class="logged-out">{'Please log in'}</div>
	}
}

export function ReactiveIf() @{
	const show = track(true);
	<>
		<button
			class="toggle"
			onClick={() => {
				show.value = !show.value;
			}}
		>{'Toggle'}</button>
		@if (show.value) {
			<div class="content">{'Content visible'}</div>
		}
	</>
}

export function ReactiveIfElse() @{
	const isOn = track(false);
	<>
		<button
			class="toggle"
			onClick={() => {
				isOn.value = !isOn.value;
			}}
		>{'Toggle'}</button>
		@if (isOn.value) {
			<div class="on">{'ON'}</div>
		} @else {
			<div class="off">{'OFF'}</div>
		}
	</>
}

export function NestedIf() @{
	const outer = track(true);
	const inner = track(true);
	<>
		<button
			class="outer-toggle"
			onClick={() => {
				outer.value = !outer.value;
			}}
		>{'Outer'}</button>
		<button
			class="inner-toggle"
			onClick={() => {
				inner.value = !inner.value;
			}}
		>{'Inner'}</button>
		@if (outer.value) {
			<div class="outer-content">
				{'Outer'}
				@if (inner.value) {
					<span class="inner-content">{'Inner'}</span>
				}
			</div>
		}
	</>
}

export function IfElseIfChain() @{
	const status = track<'loading' | 'success' | 'error'>('loading');
	<div>
		<button
			class="success"
			onClick={() => {
				status.value = 'success';
			}}
		>{'Success'}</button>
		<button
			class="error"
			onClick={() => {
				status.value = 'error';
			}}
		>{'Error'}</button>
		<button
			class="loading"
			onClick={() => {
				status.value = 'loading';
			}}
		>{'Loading'}</button>
		@if (status.value === 'loading') {
			<div class="state">{'Loading...'}</div>
		} @else if (status.value === 'success') {
			<div class="state">{'Success!'}</div>
		} @else {
			<div class="state">{'Error occurred'}</div>
		}
	</div>
}

export function IfBranchDeclarations() @{
	const show = track(true);
	const label = track('outer');
	<>
		<button class="branch-toggle" onClick={() => (show.value = !show.value)}>{'Toggle'}</button>
		@if (show.value) {
			const label = 'inner';
			const styles = <style>
				.styled {
					color: red;
				}
			</style>;
			<span class={styles.styled}>{label}</span>
		} @else {
			<span class="plain">{label.value}</span>
		}
	</>
}
