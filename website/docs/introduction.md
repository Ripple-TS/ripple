---
title: Introduction
---

# Introduction

Ripple is an elegant, compiler-driven language and UI framework built on a superset of TypeScript.

It features its own JSX-like templating language, allowing a declarative blend of structure and control flow. This makes applications easier for both humans and AI to reason about, while delivering a developer experience that ultimately results in a better user experience.

Ripple was created by Dominic Gannaway ([@trueadm](https://github.com/trueadm)), who has previously worked on React, Svelte, Lexical, and Inferno.

<Code>

```ripple
import { track } from 'ripple'

export component App() {
  <div class="container">
    <h1>{"Welcome to Ripple!"}</h1>

    <div>
      let count = track(0);

      <button onClick={() => @count--}>{"-"}</button>
      <span class="count">{@count}</span>
      <button onClick={() => @count++}>{"+"}</button>
    </div>
  </div>

  <style>
    .container {
      text-align: center;
      font-family: "Arial", sans-serif;
    }

    button {
      height: 2rem;
      width: 2rem;
      margin: 1rem;
    }
  </style>
}
```

</Code>

::: info Prerequisites

The rest of the documentation assumes basic familiarity with HTML, CSS, and
JavaScript. If you are totally new to frontend development, it might not be the
best idea to jump right into a framework as your first step - grasp the basics
and then come back! You can check your knowledge level with these overviews for
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/A_re-introduction_to_JavaScript),
[HTML](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML)
and [CSS](https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps) if
needed. Prior experience with other frameworks is helpful but not required.
:::

## Features

- **Reactive Primitives**: Built-in reactivity with `track` and `@` reactive syntax on primitives
- **Reactive Objects**: You can create fully reactive arrays/objects using shorthand syntax `#[]` `#{}`
- **Component-Based Architecture**: Clean, reusable components with props and children
- **Template Syntax**: Familiar templating with Ripple-specific enhancements
- **Performance**: Fine-grain rendering, with industry-leading performance, bundle-size and memory usage
- **TypeScript Support**: Full TypeScript integration with type checking
- **VSCode Integration**: Rich editor support with diagnostics, syntax highlighting, and IntelliSense
- **Prettier Support**: Full Prettier formatting support for `.ripple` modules
- **ESLint Support**: linting support for `.ripple` modules

## Server-Side Rendering

Ripple supports server-side rendering (SSR) with full hydration support. See the [Application Guide](/docs/guide/application) for details on using `mount()` for client-side rendering and `hydrate()` for SSR hydration.
