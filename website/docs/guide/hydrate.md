# Deferred hydration

`Hydrate` keeps initial server HTML visible and styled while postponing the setup, bindings, event handlers, and effects of its children. Import the component from `ripple` and its strategies from `ripple/hydration`.

```tsrx
import { Hydrate } from 'ripple';
import { visible, interaction } from 'ripple/hydration';

export function ProductPage() @{
	<>
		<Hydrate when={visible({ rootMargin: '600px' })}>
			<Reviews />
		</Hydrate>
		<Hydrate when={interaction({ events: ['focusin', 'click'] })}>
			<Editor />
		</Hydrate>
	</>
}
```

`when` is required. A boundary hydrates once. `mount()` and later client navigation render normally for every strategy, including `never()`. They do not call `onHydrated` or evaluate strategy factories. Deferred hydration reduces initialization work; it does **not** split code or defer downloading child JavaScript. `split`, `prefetch`, chunk-loading fallbacks, and custom procedural strategies are outside this API.

## Strategies and compatibility

The strategy contract is pinned to [TanStack Router commit `da2adec76dbe6c0da6d6a0d5640f7b9388217f45`](https://github.com/TanStack/router/tree/da2adec76dbe6c0da6d6a0d5640f7b9388217f45/packages/start-client-core/src/hydration), rather than the changing experimental API. All helpers are safe to import and construct on the server. SSR renders children for every strategy and never calls a factory or condition getter.

| Strategy                             | Pinned defaults and behavior                                                                  | Ripple adaptation / unavailable API                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load()`                             | Eligible as the application hydrates                                                          | Opens after the synchronous sibling walk, before Activity background tasks                                                                                       |
| `idle({ timeout })`                  | `requestIdleCallback`, default timeout **2000 ms**                                            | A timer at the same timeout when idle callbacks are unavailable; does not use Activity's `postTask` queue                                                        |
| `visible({ rootMargin, threshold })` | Margin **`600px`**, threshold **`0`**; accepts a number or readonly array                     | Shared observers watch actual root elements, including SVG and table rows. Empty/text-only output and missing `IntersectionObserver` become immediately eligible |
| `interaction({ events })`            | Defaults to **`pointerenter`, `focusin`, `pointerdown`, `click`**; a string or readonly array | Duplicates and empty names are removed. An empty array has no own intent trigger, but descendant intent can still open its ancestors                             |
| `media(query)`                       | Opens for an initial or later match; an empty query stays waiting                             | Missing `matchMedia` makes nonempty queries eligible; uses `addEventListener` / `removeEventListener`                                                            |
| `condition(booleanOrGetter)`         | Opens when true                                                                               | A getter subscribes to Ripple state while waiting. A boolean is a snapshot                                                                                       |
| `never()`                            | Initial server HTML stays static                                                              | No automatic trigger, descendant intent, or children replacement opens it. An explicit change of `when` can select another policy                                |

Supported interaction events are `auxclick`, `click`, `contextmenu`, `dblclick`, `focusin`, `keydown`, `keyup`, `mousedown`, `mouseenter`, `mouseover`, `mouseup`, `pointerdown`, `pointerenter`, `pointerover`, and `pointerup`.

| Cross-cutting behavior              | Compatibility                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Initial SSR vs client-only mounting | Only an initial server range is deferred; later mounts render normally                                                      |
| Nesting                             | Parents initialize first. Descendant interaction intent can open waiting ancestors; a `never()` ancestor stops it           |
| Changes while waiting               | Equivalent strategy options reuse subscriptions; changed options replace them and invalidate queued callbacks               |
| Completion                          | Once hydrated, strategy changes cannot pause or rehydrate the subtree                                                       |
| Updates requiring early hydration   | Replacement of the boundary's reactive `children` value opens an eligible boundary; see the Ripple-specific rules below     |
| Event delivery                      | Ripple initializes synchronously in capture and continues the original native event, instead of scheduling synthetic replay |
| Styles and downloads                | Existing SSR/Vite CSS delivery remains active; all statically imported child code still downloads                           |

## Reactive policies and factories

Use a getter when a condition reads reactive state:

```tsrx
import { Hydrate, track } from 'ripple';
import { condition, idle, visible } from 'ripple/hydration';

export function OptionalPanel() @{
	const enabled = track(false);
	<>
		<button onClick={() => enabled.value = true}>Enable panel</button>
		<Hydrate when={condition(() => enabled.value)}>
			<Panel />
		</Hydrate>
	</>
}

export function BrowserPolicy() {
	return <Hydrate when={() => document.visibilityState === 'visible' ? visible() : idle()}>
		<Panel />
	</Hydrate>;
}
```

A factory runs only during client hydration and must return a strategy synchronously. Promises are invalid. Factories may read Ripple reactive values; changing those values reevaluates the policy while waiting. A tracked/derived `when` also works. As with other Ripple props, passing `condition(enabled.value)` supplies a snapshot unless the surrounding reactive prop supplies a new strategy.

Subscriptions compare option values, not factory or strategy object identity. Recreating `() => visible({ rootMargin: '600px' })` does not disconnect a matching observer. A false condition that replaces a still-queued true condition cancels that request. All trigger subscriptions are removed on hydration or destruction; factories/getters stop being tracked afterward.

## Updates and retained DOM

Ripple component bodies do not rerender when a store changes. Consequently, changes to a tracked prop or a store provided through context do not, by themselves, open an unevaluated subtree. Its dependencies have not been read yet. When the gate opens, children initialize under their original owner/context with **current** values, and serialized async dependencies changed while waiting are recomputed.

A changed directly tracked `children` value is an external replacement of the retained output. That replacement requires early hydration even if the strategy is still waiting. `never()` is the exception: it keeps the initial HTML static. Computed children remain unevaluated until activation; changes inside their getter do not open the gate. To make a particular shared update open the gate immediately, include that state in `condition()` or the policy factory.

Live form edits are adopted by bindings before their first write. Changed conditional branches recover within their existing comment range, preserving edited sibling inputs and unaffected DOM. Other structural mismatches rebuild the affected retained boundary; removed controls have their ordinary replacement lifetime. Destroying a waiting boundary removes its retained HTML without initializing its children.

Hydrate uses one comment pair and no layout wrapper. Empty output, text, fragments, SVG, and table content keep their original geometry. Deferred conditionals put branch identity in their existing opening comments; they do not add placeholders. Root-specific async data and transport remain available after the initial hydration walk, including streamed pending/catch content.

## Interaction and nesting

Intent handling is installed on the hydration root. Server comment metadata lets it discover unresolved nested policies without evaluating children. It opens the necessary ancestors first, including a still-uninitialized Activity, then the eligible target. Browser-only nested factories are evaluated after their ancestors initialize; their resulting policy, including `never()`, is respected.

Interaction opens synchronously during capture, including when another trigger has already queued that boundary. The original event continues to newly attached capture, target, and delegated handlers exactly once. Buttons, links, checkbox toggles, form submission, keyboard payload, focus, `preventDefault()`, and propagation retain native behavior. Non-bubbling enter events also use capture. There is no synthetic replay queue, and no promise to reconstruct a trusted event later. If recovery or failure removes the original target, the event's remaining propagation and default action are canceled rather than transferred to a replacement node. Events before the application installs its root listeners are not buffered; native browser behavior still applies.

An unresolved parent normally delays its descendants' policy setup. A nested interaction can make ancestors eligible early, but a `never()` ancestor keeps every descendant static. A child factory whose policy was unknown on the server may require its ancestors to initialize before that policy can be determined.

## Completion, errors, and Activity

`onHydrated?: () => void` runs once after successful synchronous adoption/attachment, with the boundary's owner restored, before queued refs and user effects flush. It does not wait for nested gates or pending async work. It does not run for SSR, client-only mounts, destruction before activation, or failed hydration. A locally recovered subtree counts as successful attachment.

Factories, condition getters, trigger setup, child setup, and `onHydrated` errors use Ripple's owning `@try` / `@catch` boundary; uncaught errors propagate normally. There is no separate `onError` API.

`Activity` controls ongoing visibility and effect lifetime. `Hydrate` controls initial hydration eligibility. Activity background preparation never opens a nested Hydrate gate by itself. If Hydrate opens inside an inactive Activity, internal rendering and bindings initialize, but user effects stay inactive until the Activity becomes visible.

See the [implementation coverage checklist](https://github.com/Ripple-TS/ripple/blob/main/packages/ripple/tests/hydration/hydrate-plan.md) and the [browser test instructions](https://github.com/Ripple-TS/ripple/blob/main/packages/ripple/tests/browser/README.md) for the pinned contract's validation.
