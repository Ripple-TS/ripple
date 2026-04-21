---
"@tsrx/ripple": patch
---

Fix a hydration edge case where sibling traversal after nested DOM children (such as <pre><code>{html ...}</code></pre> chains) could leave the hydrate pointer on the wrong node and throw a hydration error during client hydration. Added hydration regression coverage for the website-like code-block sibling pattern.
