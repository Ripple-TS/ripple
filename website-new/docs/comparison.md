---
title: Comparison to other frameworks
---

# Comparison to other frameworks

## vs React

- No wrapper components for control flow - returned templates support inline `if`, `for`, and `switch`
- Built-in reactivity with `track()` and `&[]` lazy destructuring instead of useState/useEffect
- Scoped CSS without CSS-in-JS libraries
- No virtual DOM - fine-grained reactivity

## vs Svelte

- TypeScript-first approach
- JSX-like syntax instead of HTML templates
- Multiple components per file
- Similar reactivity concepts but different syntax

## vs Solid

- Components are ordinary functions that return TSRX
- Built-in collections (RippleArray, RippleSet)
- Returned templates support statement-style control flow
