---
'@tsrx/ripple': patch
'ripple': patch
---

Cheaper text-only elements and typed loop items. An element whose only child is a typed text expression (`<td>{row.name}</td>`) is cloned without a placeholder text node and written through the element (`set_text_content`): the first write creates the text node with `textContent`, later writes update it in place, and hydration adopts the server-rendered text with no cursor descent, which removes a DOM read and a text node per cell from every list row. A keyed `@for` key callback reads the item directly instead of unwrapping it. Type inference now follows a binding's declared type through property writes (`items.value = next` no longer hides `track<Row[]>()` from the loop item) and through array and tuple indexing (`row.queries[0].elapsed`), so those reads lower to direct text updates in one render block per row.
