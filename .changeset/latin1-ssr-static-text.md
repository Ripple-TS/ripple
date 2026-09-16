---
'@tsrx/ripple': patch
'ripple': patch
---

Faster buffered server rendering. Static text and attribute values are emitted with characters above U+00FF as numeric character references (raw-text elements such as `<script>` excluded), so a server response stays a one-byte string whenever its dynamic data is Latin-1 too: a single static em dash no longer widens the whole body to two bytes per character, which halved the flatten, byte-length and UTF-8 encode cost of a page. The runtime text escaper checks for `&` and `<` with two single-character searches instead of a regex test.
