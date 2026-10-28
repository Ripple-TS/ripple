---
'ripple': patch
---

Add Activity to retain hidden DOM and component state, disconnect and restart user
effects, and hydrate retained server content in separate background tasks. Share
the internal deferred-range lifecycle independently of visibility policy.

Ensure scheduler failures cannot stall subsequent boundaries, render observers
wait for visible hydration while ignoring hidden Activity work, and cleared
hidden root text stays empty on reveal.
