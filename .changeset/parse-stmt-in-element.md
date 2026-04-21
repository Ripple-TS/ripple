---
'@tsrx/core': patch
---

Fix parser crash when a JS statement inside an element template body has no trailing whitespace before the closing tag (e.g. `<ul>var a = "123"</ul>`). The tokenizer previously misread `</` as a less-than operator followed by a regexp.
