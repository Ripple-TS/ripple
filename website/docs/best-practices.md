---
title: Best Practices in Ripple
---

<!-- TODO: Elaborate -->

# Best Practices

A summary:

1. **Reactivity**: Use `track()` with `&[]` lazy destructuring to create
   reactive variables you can read and write directly
2. **Text**: Use JSX text for static text, and `{}` for JavaScript expressions
3. **Effects**: Use `effect()` for side effects that depend on reactive values
4. **Components**: Keep components focused and type props with TypeScript
   interfaces or type aliases
5. **Styling**: Put a scoped `<style>` block beside the elements it styles, and
   assign a block to a variable to share it as a theme (`apply`) or class map
6. **Collections**: Use `RippleArray`, `RippleObject`, `RippleMap`, and
   `RippleSet` for reactive collections instead of regular mutable objects
