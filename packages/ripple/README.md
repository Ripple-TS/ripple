<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ripple-TS/ripple/master/assets/ripple-dark.png">
  <img src="https://raw.githubusercontent.com/Ripple-TS/ripple/master/assets/ripple-light.png" alt="Ripple - the elegant TypeScript UI framework" />
</picture>

# What is Ripple?

[![npm version](https://img.shields.io/npm/v/ripple?logo=npm)](https://www.npmjs.com/package/ripple)
[![npm downloads](https://img.shields.io/npm/dm/ripple?logo=npm&label=downloads)](https://www.npmjs.com/package/ripple)

Ripple is an elegant TypeScript UI framework. To find out more, view
[Ripple's Github README](https://github.com/Ripple-TS/ripple).

See the [CSP guide](https://ripple-ts.com/docs/guide/content-security-policy) for
nonce rendering, the application-owned `ripple/csp` Trusted Types contract,
`getCspHashes()` for prerendered output, and runnable browser-tested examples.

Use `Activity` to retain hidden panels and their component state while
disconnecting user effects. Pass a tracked or derived `mode` for reactive
visibility; it defaults to `'visible'`. Hidden server-rendered panels hydrate one
boundary per background task, and activation promotes queued work. See the
[Activity guide](https://ripple-ts.com/docs/guide/activity) for lifecycle, refs,
portals, and scheduling details.

Use `Hydrate` with `load`, `idle`, `visible`, `interaction`, `media`, `condition`,
or `never` from `ripple/hydration` to defer initialization of visible server HTML.
`when` is mandatory; factories are synchronous and client-only. Boundaries open
once, preserve their owner/context and live input edits, and compose with
Activity. Client-only mounts render normally, even for `never()`. This does not
split code or reduce JavaScript downloads. See the
[Hydrate guide](https://ripple-ts.com/docs/guide/hydrate) for defaults, reactive
policies, early-update rules, nesting, events, and completion timing.
