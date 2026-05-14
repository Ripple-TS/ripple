---
"@tsrx/core": patch
"ripple": patch
---

Improve JSX event handler typings to infer specific DOM event types.
Improve all JSX types for much improved typescript support.
Mark self-closing JSX tokens as completion-capable so empty attribute positions can surface editor completions.
Fix no intellisense on dom attributes when <style> blocks were present
Share scoped CSS selector metadata across TSRX targets so class-name definitions work outside Ripple too. CMD+click now jumps to class definitions for all tsrx platforms.
