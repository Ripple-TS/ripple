# Content Security Policy

Applications own CSP headers, nonce generation, policy selection and caching.
Ripple forwards a response nonce to its generated streaming scripts and scoped
styles. The [router SSR guide](https://github.com/Ripple-TS/ripple/blob/main/packages/tanstack-router/docs/ssr.md#strict-content-security-policy)
covers that production contract. The contracts below add explicit support for
Trusted Types, static hashes, reviewed third-party scripts and Vite development.
They do not authorize arbitrary application HTML.

## Runnable examples

The [SSR example](https://github.com/Ripple-TS/ripple/tree/main/packages/tanstack-router/examples/ssr)
contains the source, policies and browser tests for these contracts:

```sh
pnpm --filter @ripple-ts/router-ssr-example build
pnpm --filter @ripple-ts/router-ssr-example start
# http://127.0.0.1:3000/app/security/trusted-types
# http://127.0.0.1:3000/app/security/trusted-types?stream=1
# http://127.0.0.1:3000/app/security/static

pnpm --filter @ripple-ts/router-ssr-example dev:csp
# http://127.0.0.1:3001/app/security/dev
```

The first two pages use a fresh response nonce plus Trusted Types enforcement.
The static page serves HTML and its hash policy saved together at build time.
Their controls exercise hydration, reactive HTML, SVG/MathML, deferred data and
an explicitly trusted external script with cleanup. The example's content
allowlist demonstrates a trust boundary; it is not a sanitizer for user input.

## Trusted Types

A nonce authorizes script execution; it does not make a string safe for an HTML
or script sink. Add these directives to a nonce policy, using your own names:

```text
require-trusted-types-for 'script'; trusted-types app-templates app-content
```

Configure an application-owned policy before mounting or hydrating:

```js
import { setTrustedTypesPolicy } from 'ripple/csp';

if (window.trustedTypes) {
  const policy = window.trustedTypes.createPolicy('app-templates', {
    createHTML(value, sink) {
      if (sink === 'template') return value;
      // Application HTML and rich-text snapshots need their own review.
      throw new TypeError(`Unapproved HTML sink: ${sink}`);
    },
  });
  setTrustedTypesPolicy(policy);
}
```

Ripple never creates a policy, including a `default` policy. A missing callback
leaves the value unchanged, so the browser rejects a string under enforcement.
`setTrustedTypesPolicy(null)` clears the browser configuration; server calls are
no-ops. Configuration belongs to the browser realm, shared by its Ripple roots,
and must not contain request state on the server.

Native `TrustedHTML`, `TrustedScript` and `TrustedScriptURL` values pass through
unchanged. In particular, `innerHTML`, `<Fragment innerHTML={value} />`, attribute
spreads and `bindInnerHTML` preserve trusted values. SVG and MathML fragments are
parsed in namespace elements without stringifying the trusted value to add
wrappers. Direct DOM properties such as `iframe.srcdoc` remain browser sinks:
provide the appropriate native trusted value yourself.

The optional callbacks receive these provenance labels:

| Callback                           | Label              | Input                                                                   |
| ---------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `createHTML`                       | `template`         | Compiler-generated template markup, including template elements         |
| `createHTML`                       | `html`             | Application `innerHTML` and fragment HTML                               |
| `createHTML`                       | `content-editable` | Server rich-text snapshots reparsed for hydration/stream reconciliation |
| `createScript`                     | `template`         | Static script text copied from a compiled template                      |
| `createScript`                     | `script`           | Application script text, including script `innerHTML`                   |
| `createScriptURL`                  | `template`         | Script URLs copied from a parsed template                               |
| `createScriptURL`                  | `script`           | Application script `src`                                                |
| `createScript` / `createScriptURL` | `route`            | TanStack Router-managed script content/URLs                             |

Treat compiler templates as trusted application code. Sanitize untrusted content
**before SSR as well as before creating client trusted values**. The labels are
not sanitizers. Approving an entire template does not authorize application HTML
passed later through `innerHTML`. Rich-text snapshots can contain application
content; only approve `content-editable` when that content was already reviewed
or sanitize it consistently. Native trusted values are not serialized as trusted
objects by SSR: recreate them from your application policy on the client.

`createTrustedHTML`, `createTrustedScript` and `createTrustedScriptURL` from
`ripple/csp` expose the same conversion contract for integrations. Without a
configured callback they do not confer trust. Use an explicit script/URL
allowlist or your application's sanitizer, not an identity policy for arbitrary
input. Type declarations import native Trusted Types from `trusted-types/lib`
without augmenting the browser DOM globally.

### Streaming and hydration

Stream patches move parser-created template nodes; their normal path does not
parse strings. Rich-text reconciliation can reparse a server snapshot before
hydration. For that case install the policy in a **blocking script in the head,
before streaming starts**. The early bootstrap can assign the policy to
`window.__RIPPLE_TRUSTED_TYPES__`, the same slot used by
`setTrustedTypesPolicy()`. `security-policy.js` and `security-server.js` demonstrate
this ordering. A deferred module that only runs after the document finishes is
too late for pre-hydration snapshots.

Hydration normally adopts existing nodes, but mismatches, client navigation and
later updates can parse templates. Install the policy even when the initial
page happens to hydrate without touching a protected sink. Router assets use the
same callbacks; third-party runtime code must implement its own Trusted Types
contract. String event-handler attributes, arbitrary script-loading libraries,
and Vite/HMR with Trusted Types enforcement are outside this contract.

## Static hashes and cached documents

Use `prerender()` to settle deferred values before publishing. Ripple emits inert
hydration records, but no executable stream bootstrap or completion patches in
this mode. Root IDs in inert records can vary between renders; the saved page is
reused as a complete artifact. Applications must keep their own executable
output deterministic and free of per-request data.

`getCspHashes()` from `ripple/server` hashes the **final inline contents without
surrounding tags** and returns quoted SHA-256 CSP tokens:

```js
const hashes = await getCspHashes({
  scripts: [bootstrap],
  styles: [css],
});
const policy = `script-src ${hashes.scripts.join(' ')} 'strict-dynamic'; ` +
  `style-src 'self' ${hashes.styles.join(' ')}; object-src 'none'; base-uri 'none'`;
```

It normalizes HTML line endings and NUL characters, uses UTF-8, removes duplicate
sources and preserves first-seen order. It does not parse HTML, discover scripts,
serialize safe script bodies or build a complete policy. Hash every inline script
and style you intend to authorize **after** minification, escaping and other
transforms. Do not allow a later CDN transform to change their text. Publish HTML
and headers atomically, and cache/revalidate the pair together.

The example hashes a small classic bootstrap that creates the external module
entry. `strict-dynamic` authorizes its script dependencies; external stylesheet
links are authorized by `style-src 'self'`. The returned scoped CSS is hashed for
its initial inline style, and extracted CSS supplies later client styles. Inline
style attributes still require their own policy and are blocked by the example.
No nonce is baked into the static build.

**Live streaming is not supported by this static hash contract.** Completion
scripts contain request-specific boundary IDs and late output is unknown when
headers are sent. Use nonce streaming, or fully materialize the response and
hash all final executable/style output before sending anything. Deferred values
that settle during `prerender()` are supported. Personalized router transport,
unknown future inline scripts/styles and rewriting a cached document without
updating its header are not covered by the example.

## Third-party scripts

With `strict-dynamic`, an authorized loader can load further non-parser-inserted
scripts. Host allowlists do not constrain those descendants in supporting
browsers. Keep URLs and executable content behind an explicit application trust
boundary, and use Trusted Types URL validation when enforcing Trusted Types.
Do not feed query parameters or unreviewed route data to a trusted loader.

`security-vendor.js` shows a fixed reviewed URL, load handling, removal of its
listener/script element and the vendor's cleanup callback when the component
unmounts. Disposal before loading prevents initialization. Removing a script
cannot undo executed code or guarantee cancellation of an in-flight download;
libraries must provide cleanup for their listeners, timers and globals. Review
any URLs, workers, frames, styles, `eval` or HTML sinks used by the library too.
Ripple cannot promise compatibility with every vendor under a strict policy.

Router head/body assets are trusted route configuration. Their existing
ownership/deduplication rules still apply. Nonces are not copied onto arbitrary
HTML, and parser-inserted scripts lacking authorization remain blocked even when
served from the same origin.

## Development and HMR

`dev.js` is a separate development server. Vite's `html.cspNonce` is a placeholder
replaced with a fresh nonce after `transformIndexHtml()` for each response. The
same nonce reaches the Vite client, application entry, nonce metadata and CSS HMR
styles. The header permits the exact local WebSocket endpoint in `connect-src`;
configure the matching `wss:` endpoint when using HTTPS or a proxy. HTML is not
cached. Do not copy a development nonce into production assets.

The tested policy supports source modules, dependency optimization, JavaScript
HMR and scoped/external CSS HMR without `unsafe-inline` or `unsafe-eval`.
`server.hmr.overlay` is disabled: Vite's error overlay has its own HTML and inline
style behavior, outside this strict policy. Errors remain in the browser console
and terminal. Development with Trusted Types, enabling the overlay under this
policy, and tooling/plugins that require additional sinks or origins are
unsupported combinations. See [Vite's CSP documentation](https://vite.dev/guide/features.html#content-security-policy-csp).

## Browser validation

Run `pnpm --filter @ripple-ts/tanstack-router test:browser` after installing the
Playwright Chromium, Firefox and WebKit engines. The release gate runs the same
matrix against installed package tarballs. Tests capture `securitypolicyviolation`
with enforcement enabled, including missing/wrong authorization, modified inline
contents and raw Trusted Types sink controls; they never use `bypassCSP`.

Nonce/hash CSP and HMR run in all three engines. Trusted Types positive paths run
in all three too, but native rejection checks run only where `window.trustedTypes`
is available. A browser that ignores Trusted Types directives still enforces its
ordinary CSP; it does **not** provide Trusted Types protection. This is feature
detection, not a polyfill or a blanket browser-version guarantee. See the
[Trusted Types specification](https://w3c.github.io/trusted-types/dist/spec/).
