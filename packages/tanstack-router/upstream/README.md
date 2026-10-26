# Upstream baseline and test mapping

Source: [TanStack/router](https://github.com/TanStack/router), commit
`da2adec76dbe6c0da6d6a0d5640f7b9388217f45` (October 25, 2026). Registry metadata
was reconfirmed October 26, 2026:

| Package                              | Version    |
| ------------------------------------ | ---------- |
| `@tanstack/router-core`              | `1.171.39` |
| `@tanstack/history`                  | `1.162.5`  |
| `@tanstack/solid-router` (reference) | `1.170.43` |
| `solid-js` (reference)               | `1.9.10`   |

The published Solid adapter depends on the same core/history versions and peers
with Solid `^1.9.10`. The reference version is recorded here, not installed into
the Ripple package or its typechecking graph.

`tests.json` inventories all files in `packages/solid-router/tests`, including
support fixtures, with SHA-256 checksums. It records each live `test`/`it`
declaration's source line, suite/title, and modifiers. Commented-out source is not
counted. A parameterized declaration is a family, not a count of expanded runtime
cases; dynamic titles remain source expressions. Test files without declarations
fail the inventory validation and must be investigated.

A test's stable lookup at this pinned baseline is `file:line`. Its mapping is
`file.overrides[line]` when present, otherwise `file.mapping`. **Every declaration
inherits an explicit status and reason**; no absence is interpreted as passing.

- `deferred`: not ported; record milestone and reason.
- `ported`: record Ripple test paths relative to this package, and preserve
  assertions unless an intentional difference is documented.
- `inapplicable`: explain the framework-specific behavior or excluded feature.

Milestone 2 ports the six render-acknowledgement tests, two provider-remount
tests, the first three retained-pending regressions, and the cached-preload
zero-update regression. Remaining cases stay explicitly deferred. Independent
store and native view-transition tests add Ripple-specific coverage; they do not
count as translated upstream cases. Solid's eager-memo execution counts need a
separate audit because Ripple readers are lazy. Upstream `skip`, `todo`, and
conditional modifiers remain visible independently of the Ripple mapping; upstream
skips do not become automatic exclusions.

Regenerate from a clean checkout at the pinned commit:

```sh
pnpm --filter @ripple-ts/tanstack-router upstream:inventory /path/to/TanStack-router
pnpm exec prettier --write packages/tanstack-router/upstream/tests.json
```

The generator reads local source, performs no network calls, preserves existing
mappings, and rejects a different commit or changed tracked test sources. When
upgrading, review changed/added/deleted test families and migrate their mappings
explicitly before changing the pin. The broader upgrade audit and React-only test
comparison are milestone 4 work. Preserve the upstream notice in `NOTICE` when
porting source or tests.
