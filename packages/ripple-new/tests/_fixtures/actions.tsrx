import { useActionState, useFormStatus, useOptimistic, useState } from 'ripple-new';

// useActionState wired to <form action={formAction}>. The action receives
// (previousState, formData) and its resolved value becomes the new state.
export function ActionForm(props) @{
	const [state, formAction, isPending] = useActionState(props.action, props.initial);
	<form action={formAction}>
		<input id="field" name="name" />
		<button id="submit" type="submit">{'submit'}</button>
		<span id="state">
			{String(state) as string}
		</span>
		<span id="pending">
			{(isPending ? 'pending' : 'idle') as string}
		</span>
	</form>
}

// useFormStatus read from a CHILD component of the form.
function StatusReader() @{
	const status = useFormStatus();
	<span id="status">
		{(status.pending ? 'pending:' + status.method : 'idle') as string}
	</span>
}

export function FormWithStatus(props) @{
	const [, formAction] = useActionState(props.action, null);
	<form action={formAction}>
		<input name="q" />
		<StatusReader />
		<button id="submit" type="submit">{'go'}</button>
	</form>
}

// RAW <form action={fn}> (not useActionState) + a useFormStatus child. Used to
// verify a SYNCHRONOUSLY-throwing action still clears the form's pending status.
export function RawFormWithStatus(props) @{
	<form action={props.action}>
		<StatusReader />
		<button id="submit" type="submit">{'go'}</button>
	</form>
}

// useFormStatus + a self re-render trigger — used to verify the hook re-resolves
// its ancestor <form> on each render (so a form that appears later is picked up).
function StatusProbeInner(props) @{
	const [, setN] = useState(0);
	const status = useFormStatus();
	props.expose(() => setN((n) => n + 1));
	<span id="probe">
		{(status.pending ? 'pending' : 'idle') as string}
	</span>
}
// The probe is a CHILD so it has real block markers — the test inserts a <form>
// as an ancestor of #wrap, which becomes the probe's nearest ancestor form.
export function StatusProbe(props) @{
	<div id="wrap">
		<StatusProbeInner expose={props.expose} />
	</div>
}

// useFormStatus called in the SAME component that renders the form must NOT see
// that form (React parity) — it has no ancestor form, so it stays idle.
export function SelfFormStatus(props) @{
	const status = useFormStatus();
	props.expose(status);
	<form action={props.action}>
		<span id="self">
			{(status.pending ? 'pending' : 'idle') as string}
		</span>
		<button id="submit" type="submit">{'go'}</button>
	</form>
}

// useOptimistic: optimisticState shows the pending value during the action, then
// converges to the real committed state.
export function OptimisticForm(props) @{
	const [items, setItems] = useState(props.initial);
	const [optimistic, addOptimistic] = useOptimistic(items, (cur, v) => [...cur, v + '?']);
	const [, formAction] = useActionState(async (prev, fd) => {
		const v = String(fd.get('item'));
		addOptimistic(v);
		await props.action();
		setItems((cur) => [...cur, v]);
		return prev;
	}, null);
	<form action={formAction}>
		<input id="field" name="item" />
		<span id="list">
			{optimistic.join(',') as string}
		</span>
		<button id="add" type="submit">{'add'}</button>
	</form>
}

// useOptimistic with addOptimistic called OUTSIDE any transition (a bare click).
// React shows the optimistic value only briefly; it must NOT stay stuck.
export function BareOptimistic(props) @{
	const [items] = useState(props.initial);
	const [optimistic, addOptimistic] = useOptimistic(items, (cur, v) => [...cur, v]);
	<div>
		<span id="list">
			{optimistic.join(',') as string}
		</span>
		<button id="add" onClick={() => addOptimistic('x')}>{'add'}</button>
	</div>
}

// Direct dispatch: formAction(payload) called outside a <form>.
export function DirectAction(props) @{
	const [state, formAction, isPending] = useActionState(props.action, props.initial);
	<div>
		<button id="run" onClick={() => formAction(props.payload)}>{'run'}</button>
		<span id="state">
			{String(state) as string}
		</span>
		<span id="pending">
			{(isPending ? 'pending' : 'idle') as string}
		</span>
	</div>
}

// Raw <form action={fn}> (no useActionState): auto-resets uncontrolled fields on
// success.
export function RawForm(props) @{
	<form action={props.action}>
		<input id="field" name="field" />
		<button id="submit" type="submit">{'go'}</button>
	</form>
}
