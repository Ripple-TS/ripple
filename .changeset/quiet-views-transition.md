---
'ripple': patch
'@tsrx/ripple': patch
'@ripple-ts/tanstack-router': patch
---

Add transparent ViewTransition boundaries and scoped createViewTransition controllers with shared-element naming, typed CSS classes, animation callbacks, bounded async rendering coordination, SSR/hydration support, and browser/reduced-motion fallbacks. Allow render observations to be cancelled with an AbortSignal. Add optional RouterProvider coordination that replaces TanStack's native transition wrapper.

Support automatic pending-to-content animation inside ViewTransition and CSS-driven cross-document transitions with explicit SSR names. Cover both Activity nesting orders and preserve explicit visibility animations during deferred hydration. Shorten Activity hidden-text markers to `rt:`.

Scope transition selectors inside their native arguments, with explicit global selectors and portable style maps. Preserve browser-default `auto` and disabling `none` behavior across all styling props and transition-type maps. Preserve updater errors when pending reveals are queued.
