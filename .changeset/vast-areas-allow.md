---
'@tsrx/core': patch
---

Parser fix for <tsrx> - cleans up the pending token context for }, ), ], plus the callback-return case:
parenthesized: content={(<tsrx>...</tsrx>)}
passed as a call arg: content={wrap(<tsrx>...</tsrx>)}
used as an object property: content={{ child: <tsrx>...</tsrx> }}
