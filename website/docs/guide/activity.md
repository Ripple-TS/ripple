# Activity

`Activity` keeps a subtree's DOM and component state while hiding it and disconnecting its user effects.

```tsrx
import { Activity, track } from 'ripple';

export function Panels() @{
	const mode = track<'visible' | 'hidden'>('visible');
	<>
		<button onClick={() => mode.value = mode.value === 'visible' ? 'hidden' : 'visible'}>
			Toggle panel
		</button>
		<Activity {mode}>
			<input placeholder="Your draft survives hiding" />
		</Activity>
	</>
}
```

`mode` defaults to `'visible'`. It accepts a literal or a tracked/derived value. Like other Ripple props, `mode={mode.value}` passes a snapshot; pass the tracked value itself for updates. For computed modes, use `track<'visible' | 'hidden'>(() => active.value ? 'visible' : 'hidden')`. Activity works through aliases and dynamic components without compiler recognition.

## Effects and retained DOM

Hiding calls existing user-effect cleanups once, including cleanup of nested effects and subscriptions created by those effects. Cleanup runs inside out within an effect's owned work. Unmounting while hidden does not call those cleanups again. Showing schedules each surviving effect once with current state, even when it has no dependencies or its dependencies did not change. The normal render/effect flush ordering applies; dependency updates in the same batch coalesce with that restart. Hiding again before setup executes prevents it from running.

New user effects start inactive while hidden. An inner Activity remains inactive while any outer Activity is hidden. Showing an outer Activity does not show an explicitly hidden inner Activity or clear an async suspension.

Render updates, form bindings, refs and their internal subscriptions remain active. Refs keep pointing at retained nodes; ref callbacks reconnect only when the node's normal lifetime requires it. Put work that should disconnect, such as a subscription or observer, in `effect()` rather than a ref callback. Head content remains active and is removed with its normal owner.

Activity adds comment markers, not a layout element. It hides root elements with `display: none !important` and temporarily blanks root text nodes. Existing display values and priorities are restored; reactive style and text changes made while hidden are retained. Multiple roots, table rows, SVG and client portal content are supported. Portal content follows the Activity that owns it.

Restarting an effect can repeat uncached network requests. Resource lifetime, cancellation and caching remain the resource author's responsibility.

## Hydration

Server rendering includes the subtree and range markers. Hidden content is hidden in the server HTML. During root hydration, Activity retains its range and postpones child initialization so ordinary siblings initialize first.

Visible ranges are hydrated urgently after that synchronous walk. Hidden ranges use `scheduler.postTask` with background priority, with a cancellable timer fallback when the API is unavailable. Each task prepares at most one boundary; nested boundaries are discovered parent first and scheduled separately. Showing a queued Activity promotes its hydration. Preparation never runs hidden user effects, and a successfully prepared boundary is not hydrated again.

Deferred work retains its component context, namespace, root-specific async values and transport. Inputs edited before hydration keep their live values. Current reactive inputs reconcile against the retained server content; a structural mismatch recovers within that boundary. Removing a queued boundary cancels its work without initializing its children.

Scheduling yields between boundaries, not within one boundary. A large boundary can still create a long task. Timer fallback yields a browser task but has no equivalent background priority, and neither scheduler guarantees a paint after every boundary. Deferring hydration does not split or defer downloading JavaScript.

The internal range lifecycle is independent of Activity visibility so other hydration policies can reuse it. Activity does not implement the separate `Hydrate` strategy API.
