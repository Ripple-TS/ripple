# View transitions

`ViewTransition` animates changes using the browser's View Transition API. It adds
no wrapper element, hydration marker, or placeholder. Create a controller during
component initialization and use `run` for updates you want to animate:

```tsrx
import { ViewTransition, createViewTransition, track } from 'ripple';

export function Notice() @{
	const transition = createViewTransition();
	const shown = track(false);
	<>
		<button onClick={() => transition.run(() => { shown.value = !shown.value; })}>
			Toggle notice
		</button>
		@if (shown.value) {
			<ViewTransition enter="notice-in" exit="notice-out">
				<p>Saved</p>
			</ViewTransition>
		}
		<style>
			::view-transition-new(.notice-in) { animation: arrive 160ms ease-out; }
			::view-transition-old(.notice-out) { animation: arrive 120ms ease-in reverse; }
			@keyframes arrive {
				from { opacity: 0; transform: translateY(8px); }
				to { opacity: 1; transform: translateY(0); }
			}
			@media (prefers-reduced-motion: reduce) {
				::view-transition-group(*) { animation-duration: 0s; }
			}
		</style>
	</>
}
```

Ordinary updates, initial mounting, and hydration do not start an animation.
Replacing a visible `@pending` branch inside `ViewTransition` is an automatic
trigger, described below.
Controllers skip animation when reduced motion is requested or the browser API is
unavailable. The update still runs. These presets are application CSS; Ripple
ships no animation library.

## Props and activation

`name` is optional. Automatic names are unique across roots and remain stable for
the boundary's lifetime. Use an explicit name only to pair different boundaries.
Names must match `^-?[_a-zA-Z][\w-]*$`; CSS keywords, `root`, `auto`, `none`, the
`ripple-vt-` prefix, and the `--ripple-` suffix namespace are reserved. Invalid or
duplicate names produce development diagnostics and those boundaries are excluded
from that snapshot.

`enter`, `exit`, `update`, `share`, and `default` accept:

- `auto`: browser default animation; the default when no style is specified.
  Scoping adds only a matching class, never an animation preset or CSS animation
  declaration. Authored local or global CSS can still override browser defaults.
- `none`: disable that kind of animation and its callback. A scope class or
  wildcard rule cannot re-enable it. This applies to all five styling props.
- A space-separated list of view-transition CSS classes.
- A transition-type map, such as `{ forward: 'slide-left', back: 'slide-right', default: 'auto' }`.

Pass types with `transition.run(update, { types: ['forward'] })`. Matching map
entries are combined; any matching `none` wins. Otherwise the map's `default`
entry applies. An unresolved kind falls back to the boundary's `default` prop.
`default="none"` disables kinds that are not explicitly enabled. A shared pair is
disabled if either side resolves `share` to `none`; the new side supplies its CSS
classes for a successful pair.

Name and styling props accept tracked/derived values. Pass the value itself for
live reads (`update={classes}`); `update={classes.value}` passes the value at
component initialization, like other Ripple component props. Children are normal
Ripple children, with reactive rendering inside the boundary.

A boundary owns its top-level rendered elements, including elements returned
through components and fragments. Multiple elements receive a base name and
numbered suffixes. Empty output and bare text have no snapshot. There is no extra
element around table rows or SVG. Put text in an element when it should animate.
The innermost boundary owns a host when nested boundaries resolve to that same
host. Portal and head content should have their own boundaries inside their
rendered destination; an outer boundary does not claim detached destinations.

Selection follows these rules:

| Kind       | Selection                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enter/exit | Top-level boundary of an inserted/removed subtree. A new or removed DOM ancestor suppresses a nested enter/exit.                                                     |
| Update     | Its owned DOM changed, its root elements changed, or their measured position/size changed. Nested mutations belong to the inner boundary.                            |
| Share      | An exiting boundary and an entering boundary have the same explicit name, with both sides in the viewport. This overrides enter/exit, including deeply nested pairs. |

Showing or hiding an existing `Activity` can select enter/exit without destroying
its state. Offscreen boundaries do not form shared pairs; surviving boundaries
can still animate an update that moves them into or out of the viewport. CSS
animations, scrolling, and arbitrary external DOM changes outside `run` do not
independently activate a transition.

## Shared elements

```tsrx
import { ViewTransition, createViewTransition, track } from 'ripple';

export function Photo() @{
	const transition = createViewTransition();
	const expanded = track(false);
	<>
		<button onClick={() => transition.run(() => { expanded.value = !expanded.value; })}>
			Toggle detail
		</button>
		@if (expanded.value) {
			<article>
				<ViewTransition name="photo" share="photo-move"><h1>Mountain</h1></ViewTransition>
			</article>
		} @else {
			<aside>
				<ViewTransition name="photo" share="photo-move"><h2>Mountain</h2></ViewTransition>
			</aside>
		}
		<style>
			::view-transition-group(.photo-move) { animation-duration: 220ms; }
			::view-transition-image-pair(.photo-move) { isolation: isolate; }
			::view-transition-old(.photo-move) { animation: fade 220ms reverse; }
			::view-transition-new(.photo-move) { animation: fade 220ms; }
			@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
			@media (prefers-reduced-motion: reduce) {
				::view-transition-group(*) { animation-duration: 0s; }
			}
		</style>
	</>
}
```

## Local and global transition CSS

Inside a scoped `<style>`, transition selectors are local by default. The
compiler puts the scope hash **inside the pseudo-selector argument** and supplies
that hash as a native transition class to ViewTransition boundaries in the scope.
It does not add a wrapper or a hydration marker. For scope hash `S`:

| Authored selector                         | Compiled selector                       |
| ----------------------------------------- | --------------------------------------- |
| `::view-transition-new(.notice)`          | `::view-transition-new(.notice.S)`      |
| `::view-transition-old(.notice)`          | `::view-transition-old(.notice.S)`      |
| `::view-transition-group(*)`              | `::view-transition-group(*.S)`          |
| `::view-transition-image-pair(photo)`     | `::view-transition-image-pair(photo.S)` |
| `::view-transition-new(.fade.slide)`      | `::view-transition-new(.fade.slide.S)`  |
| `:global(::view-transition-new(.notice))` | `::view-transition-new(.notice)`        |

Names such as `photo` and transition-type keys such as `forward` are never
renamed. Different components can reuse `.notice` independently. Instances of the
same component share its CSS scope while retaining unique automatic names.
Nested scopes and applied themes follow ordinary Ripple style scoping. A style
scope does not implicitly cross a separately declared component function.

For example, `enter="notice"` resolves to transition classes `notice S`. `auto`
resolves to just `S`, so it uses the browser default animation unless a matching
rule changes it. `none` stays disabled. Dynamic strings, tracked values, spreads,
and transition-type maps use the same rules; matching `none` still wins when
several transition types match. Import aliases and namespace imports are supported.

Use `:global(...)` for intentionally shared recipes:

```tsrx
export function SharedRecipe() @{
	<>
		<style>
			:global(::view-transition-new(.shared-toast)) { animation: toast-in 160ms; }
			@keyframes -global-toast-in { from { opacity: 0; } to { opacity: 1; } }
		</style>
		<ViewTransition enter="shared-toast"><p>Saved</p></ViewTransition>
	</>
}
```

Selector scope and keyframe scope are independent. A global selector can also
reference a local keyframe. Global rules deliberately match across scopes; normal
CSS cascade rules determine which matching declarations win.

Transition pseudo-elements belong to the document, so a DOM wrapper prefix such
as `div ::view-transition-new(...)` cannot provide component scoping. The compiler
reports that usage. Document-wide targets such as `::view-transition` and
`::view-transition-new(root)` require `:global(...)` in a scoped block. Ordinary
application `.css` files use native selectors directly, without `:global`.

### Portable class maps

Transition classes also appear in assigned style maps and `<style ref>` maps,
using the existing `"scope class"` representation:

```tsrx
export function PortableNotice() @{
	const styles = <style>
		::view-transition-new(.notice) { animation: appear 160ms; }
		@keyframes appear { from { opacity: 0; } to { opacity: 1; } }
	</style>;
	<ViewTransition enter={styles.notice}><p>Saved</p></ViewTransition>
}
```

Pass these values through custom wrapper components or dynamic component calls
when the compiler cannot identify the ViewTransition import. Use `<style
apply={theme} />` to apply a theme's scope to direct ViewTransition calls. Compound
class selectors require every listed class; `styles.fade` alone does not satisfy
`.fade.slide`.

Shared-element pairing still uses the explicit `name`. The browser uses the
incoming element's classes for a matched pair, including across documents, so
its local transition CSS styles both snapshots. Use a global recipe when different
components or pages should use identical shared styles. Local class filtering
requires native `view-transition-class` support; browsers without it retain
rendering and browser-default animation fallbacks.

## Async boundaries and Activity

A `ViewTransition` around `@try` / `@pending` automatically animates the replacement
of its loading UI when the content becomes ready. No controller call is needed
for that promise-driven reveal:

```tsrx
function Panel() @{
	<ViewTransition update="auto">
		@try { <AsyncProfile /> } @pending { <p>Loading profile…</p> }
	</ViewTransition>
}
```

The same wrapper owns the loading and resolved elements, so this is an `update`.
Initial fallback display and streamed SSR adoption do not themselves animate.
This automatic trigger applies to a try boundary inside the wrapper; placing a
ViewTransition only inside the resolved branch does not opt its enclosing try
boundary into automatic reveals. Errors continue to use `@catch`; entering a
catch branch is not an automatic animation trigger.

Simultaneous reveals share one document transition. A reveal during an explicit
run joins that run; a later reveal starts a new transition with no inherited
transition types. Superseding or skipping animation never discards a ready
reveal. Automatic callback failures route to the owning error boundary.

Both `<ViewTransition><Activity /></ViewTransition>` and
`<Activity><ViewTransition /></Activity>` preserve DOM and component state.
Change Activity's mode inside `controller.run()` to animate hiding/showing.
Initial hydration remains unanimated; an explicit reveal can animate children
that were initially hidden and hydrate on demand.

## Completion, async work, and interruption

`createViewTransition()` captures the initialization scope. Place it in a common
ancestor of the async content whose rendering must complete. `run` returns:

| Member                       | Meaning                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rendered: Promise<boolean>` | The updater and visible rendering, refs, effects, and demand hydration in that scope completed. `false` means supersession, disposal, or the deadline ended the observation. |
| `ready: Promise<boolean>`    | Browser snapshots are ready and animation callbacks ran; `false` means animation was skipped.                                                                                |
| `finished: Promise<void>`    | The animation and its callback cleanups completed. Update or callback errors reject this promise.                                                                            |
| `skipTransition()`           | Skip animation while still applying the update.                                                                                                                              |

Update errors also reject `rendered`. Catch these promises when your updater can
fail. A failure does not roll back writes. Calling `dispose()` or unmounting the
controller's owner releases its work. A subsequent run supersedes the previous
run for that document, including a run from another controller/root. A superseded
updater that has not started is not called. Async callbacks that already started
must manage their own cancellation of application side effects.

An explicit controller run starts the native old snapshot before applying state,
then waits for visible async work and the final reveal. Intermediate `@pending`
UI is not a separate animation during that run. Hidden Activity work is excluded. Unrelated async work
outside the captured scope does not delay completion. Await stylesheet loading
or application preparation inside an async updater when needed:

```ts
const handle = transition.run(async () => {
	await prepareDestination();
	page.value = nextPage;
}, { types: ['forward'], timeout: 800 });
await handle.rendered; // rendering, not animation completion
await handle.finished;
```

The default total snapshot deadline is 500ms (`timeout` overrides it). Font
readiness and decoding incomplete images within participating roots are included
in that deadline. Image errors do not block rendering. Ripple does not wait for
unrelated stylesheets, background images, videos, or lazy resources elsewhere on
the page. On timeout it releases the browser snapshot. A later pending-to-content
replacement inside an enclosing ViewTransition starts its own automatic
animation; other late async updates render normally. Preload slow assets or finish
fetching before `run` when continuity matters.

`flushSync` inside the updater is included. Outside it, synchronous writes remain
ordinary writes: Ripple does not isolate or roll them back. Loading UI remains
usable after skip/timeout. Focus and input state remain on surviving DOM nodes;
removed focused elements need the application's usual focus management.

## Animation callbacks

`onEnter`, `onExit`, `onUpdate`, and `onShare` receive `(instance, types)`. One kind
fires per participating boundary. Shared pairs notify the outgoing side, matching the pinned React 19.3.0
implementation; the incoming side supplies styles. Other exits precede remaining enters, followed by updates, in
registration order. Return a cleanup for resources you create; it runs exactly
once on finish, interruption, or removal of a live callback owner. An outgoing
owner is already removed, so its cleanup belongs to the animation.

`instance.name` is the base name, and `instance.names` contains every root's name.
`instance.old`, `new`, `group`, and `imagePair` expose `animate(keyframes, options)`
and `getAnimations()`. Both return arrays of `Animation`, one per matching
pseudo-element. Canceling them does not cancel rendering:

```tsrx
<ViewTransition onEnter={(instance) => {
	const animations = instance.new.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
	return () => animations.forEach((animation) => animation.cancel());
}}><p>Saved</p></ViewTransition>
```

## SSR, browsers, and routing

Unnamed boundaries emit ordinary child markup with no animation metadata.
Explicit `name` values are written as CSS properties on root elements so a new
page can participate in a cross-document snapshot before hydration. Shared
classes are included when supplied. Neither form adds wrappers or hydration
markers. Hydration adopts existing nodes, and streamed/deferred adoption does not
itself animate. Temporary overrides during local transitions are restored after
snapshot readiness or on failure/skip, preserving the prior styles. An inactive
old snapshot may require one temporary suppression stylesheet, removed on
completion; applications with restrictive CSP must permit that stylesheet.

The browser baseline is the same-document callback form of
`document.startViewTransition`, its three lifecycle promises, and the View
Transition pseudo-element tree. Transition types and `view-transition-class` are
progressive enhancements: maps/callback types still work without native type
support; unavailable class styling falls back to browser animations. With no
native API, rendering continues and `ready` is false.

For **full-page navigation**, use the same explicit name on both pages and put
this rule in CSS loaded by both documents:

```css
@view-transition { navigation: auto; }
::view-transition-group(photo) { animation-duration: 250ms; }
```

```tsrx
<ViewTransition name="photo"><img src="/photo.jpg" alt="Mountain" /></ViewTransition>
```

A normal link between same-origin pages can then animate the old and new `photo`
elements. Ripple emits incoming names in SSR HTML and refreshes outgoing names
on `pageswap`; `pagereveal` refreshes already-initialized pages, including history
restoration. Automatically generated names stay local to a document and are not
serialized or paired across pages. `name` is optional for local updates and is
needed to establish this shared identity between different components/documents.

This cross-document support is CSS-driven. `share` (or `default`) supplies shared
classes; before hydration, a type map uses its `default` entry. For early
navigation-type styling use native CSS selectors. Component `onEnter`, `onExit`,
`onUpdate`, and `onShare` callbacks belong to same-document commits; use the
browser's page lifecycle events for cross-document JavaScript customization.
Authored native name declarations in SSR are preserved; avoid conflicting names
on a child and its ViewTransition. Browsers without cross-document support still
navigate normally. Apply your reduced-motion CSS to document transitions, since
these are started by the browser, not the controller.

There is one Ripple coordinator per document. An already active external native
transition, when exposed by `document.activeViewTransition`, makes a Ripple run
render without starting a competing animation. On older browsers that do not
expose it, do not nest independent native wrappers. Supply the controller to the
TanStack adapter so it replaces core's wrapper:

```tsrx
function App() @{
	const viewTransition = createViewTransition();
	<RouterProvider {router} {viewTransition} />
}
```

Use TanStack's `defaultViewTransition` or navigation `viewTransition` option to
activate navigation animations. `false` disables them; type arrays and type
functions are forwarded. Direct state updates can use that same controller.
Router render acknowledgment still waits for rendering, not animation completion.

The styling API follows React's documented `enter`, `exit`, `update`, `share`,
and `default` surface. Reference comparisons target React 19.3.0. Ripple uses
in-place commits, explicit controllers for state updates, automatic wrapped
pending reveals, and bounded snapshot waiting as described above. The conformance
inventory and repeatable browser/performance checks are in
[`packages/ripple/tests/view-transition`](https://github.com/Ripple-TS/ripple/tree/main/packages/ripple/tests/view-transition).
