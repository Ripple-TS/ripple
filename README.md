<a href="https://ripplejs.com">
  <picture>
    <source media="(min-width: 768px)" srcset="assets/ripple-desktop.png">
    <img src="assets/ripple-mobile.png" alt="Ripple - the elegant TypeScript UI framework" />
  </picture>
</a>

[![CI](https://github.com/Ripple-TS/ripple/actions/workflows/ci.yml/badge.svg)](https://github.com/Ripple-TS/ripple/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-7289da?logo=discord&logoColor=white)](https://discord.gg/JBF2ySrh2W)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/Ripple-TS/ripple/tree/main/templates/basic)

# Ripple TS

Ripple is a TypeScript UI framework that combines the best parts of React, Solid,
and Svelte. Created by [@trueadm](https://github.com/trueadm), who has contributed
to [Inferno](https://github.com/infernojs/inferno),
[React](https://github.com/facebook/react),
[Lexical](https://github.com/facebook/lexical), and
[Svelte 5](https://github.com/sveltejs/svelte).

**Key Philosophy:** Ripple is TS-first with `.tsrx` as its default UI file
extension. Components are ordinary TypeScript functions that return native TSRX
expressions, so setup code stays familiar while template bodies can use inline
control flow.

> **`.tsrx` is also a standalone language:** the same source can now compile to
> React, Solid, or Ripple via [TSRX](https://tsrx.dev) — a TypeScript language
> extension that treats Ripple as one of several target runtimes. If you want the
> authoring ergonomics without committing to Ripple's runtime, start there.

📚 **[Ripple Docs](https://www.ripple-ts.com/docs)** | 🎮
**[Ripple Playground](https://www.ripple-ts.com/playground)** | 🧩
**[TSRX Website](https://tsrx.dev)**

## Features

- ⚡ **Fine-grained Reactivity**: `track` with lazy destructuring for a unique
  reactivity system
- 🔥 **Performance**: Industry-leading rendering speed, bundle size, and memory
  usage
- 📦 **Reactive Collections**: `RippleArray`, `RippleObject`, `RippleMap`,
  `RippleSet` imported from `'ripple'` with full reactivity
- 🎯 **TypeScript First**: Complete type safety with the default `.tsrx` extension
- 🛠️ **Developer Tools**: VSCode extension, Prettier, and ESLint support
- 🎨 **Scoped Styling**: Function-local CSS with automatic scoping

## 🚀 Quick Start

### Using CLI (Recommended)

```bash
npx create-ripple
cd my-app
npm install && npm run dev
```

### Using Template

```bash
npx degit Ripple-TS/ripple/templates/basic my-app
cd my-app
npm install && npm run dev
```

### Add to Existing Project

```bash
npm install ripple @ripple-ts/vite-plugin
```

> **Note:** You can use `npm`, `pnpm`, `yarn`, or `bun` package managers.

**[→ Full Installation Guide](https://www.ripple-ts.com/docs/quick-start)**

### Mounting Your App

```ts
// index.ts
import { mount } from 'ripple';
import { App } from './App.tsrx';

mount(App, {
  props: { title: 'Hello world!' },
  target: document.getElementById('root'),
});
```

## 🔧 VSCode Extension

Install the
[Ripple VSCode extension](https://marketplace.visualstudio.com/items?itemName=Ripple-TS.ripple-ts-vscode-plugin)
for:

- Syntax highlighting
- TypeScript integration
- Real-time diagnostics
- IntelliSense autocomplete

**[→ Editor Setup Guide](https://www.ripple-ts.com/docs/quick-start#vs-code)**

## Core Concepts

### Components

Define components as ordinary functions that return native TSRX:

```tsrx
function Button(props: { text: string; onClick: () => void }) {
  return <button onClick={props.onClick}>{props.text}</button>;
}

export function App() {
  return <Button text="Click me" onClick={() => console.log('Clicked!')} />;
}
```

Direct calls keep ordinary helper semantics. A PascalCase helper such as
`StatusCode()` or `FormatName()` is left as a normal function when called
directly; component compilation applies to functions used as components or render
entries, and to functions that return native TSRX without being directly called.

**[→ Component Guide](https://www.ripple-ts.com/docs/guide/components)**

### Reactivity

Create reactive state with `track` and use lazy destructuring (`&[]`) to access
the value directly:

```tsrx
import { track } from 'ripple';

export function App() {
  let &[count] = track(0);

  return <div>
    <p>
      "Count: "
      {count}
    </p>
    <button onClick={() => count++}>"Increment"</button>
  </div>;
}
```

You can also pass around the tracked value object from the second argument:

```tsrx
import { track } from 'ripple';

export function App() {
  let &[count, trackedCount] = track(0);

  return <>
    <div>{count}</div>
    <IncrementButton {trackedCount} />
  </>;
}
```

Alternatively, you can read and write tracked values directly using the `.value`
property on the `Tracked<V>` object:

```tsrx
import { track } from 'ripple';

export function App() {
  const count = track(0);

  return <>
    <div>{count.value}</div>
    <button onClick={() => count.value++}>"Increment"</button>
  </>;
}
```

Using `&[...]` is preferred in most cases for cleaner code, but `.value` is useful
when you need to keep the `Tracked<V>` object around — for example, when storing
tracked values in data structures or passing them as `Tracked<T>` props.

**Derived values** automatically update:

```tsrx
import { track } from 'ripple';

export function App() {
  let &[count] = track(0);
  let &[double] = track(() => count * 2);
  let &[quadruple] = track(() => double * 2);

  return <div>
    <p>
      "Count: "
      {count}
    </p>
    <p>
      "Double: "
      {double}
    </p>
    <p>
      "Quadruple: "
      {quadruple}
    </p>
    <button onClick={() => count++}>"Increment"</button>
  </div>;
}
```

**Reactive collections** with full reactivity:

```tsrx
import { RippleArray, RippleObject, RippleMap, RippleSet } from 'ripple';

export function App() {
  const items = new RippleArray(1, 2, 3); // RippleArray
  const obj = new RippleObject({ a: 1, b: 2 }); // RippleObject
  const map = new RippleMap([['k', 'v']]); // RippleMap
  const set = new RippleSet([1, 2, 3]); // RippleSet

  return <div>
    <p>
      "Items: "
      {items.join(', ')}
    </p>
    <p>
      "Object: a="
      {obj.a}
      ", b="
      {obj.b}
      ", c="
      {obj.c}
    </p>
    <button onClick={() => items.push(items.length + 1)}>"Add Item"</button>
    <button onClick={() => (obj.c = (obj.c ?? 0) + 1)}>"Increment c"</button>
  </div>;
}
```

**[→ Reactivity Guide](https://www.ripple-ts.com/docs/guide/reactivity)**

### Transporting Reactivity

Pass the tracked ref (second element) across function boundaries:

```tsrx
import { track } from 'ripple';

function createDouble(&[count]) {
  return track(() => count * 2);
}

export function App() {
  let &[count, countTracked] = track(0);
  const &[double] = createDouble(countTracked);

  return <div>
    <p>
      "Double: "
      {double}
    </p>
    <button onClick={() => count++}>"Increment"</button>
  </div>;
}
```

**[→ Transporting Reactivity Guide](https://www.ripple-ts.com/docs/guide/reactivity#transporting-reactivity)**

### Effects & Side Effects

```tsrx
import { track, effect } from 'ripple';

export function App() {
  let &[count] = track(0);

  effect(() => {
    console.log('Count changed:', count);
  });

  return <button onClick={() => count++}>"Increment"</button>;
}
```

**[→ Effects & Reactivity Guide](https://www.ripple-ts.com/docs/guide/reactivity#effects)**

### Control Flow

**Conditionals:**

```tsrx
import { track } from 'ripple';

export function App() {
  let &[condition] = track(true);

  return <div>
    if (condition) {
      <div>"True"</div>
    } else {
      <div>"False"</div>
    }
    <button onClick={() => (condition = !condition)}>"Toggle"</button>
  </div>;
}
```

**Loops:**

```tsrx
import { RippleArray } from 'ripple';

export function App() {
  const items = new RippleArray({ id: 1, name: 'Item 1' }, {
    id: 2,
    name: 'Item 2',
  }, { id: 3, name: 'Item 3' });

  return <div>
    for (const item of items; index i; key item.id) {
      <div>
        {item.name}
        " (index: "
        {i}
        ")"
      </div>
    }
    <button
      onClick={() => items.push({
        id: items.length + 1,
        name: `Item ${items.length + 1}`,
      })}
    >
      "Add Item"
    </button>
  </div>;
}
```

**Error Boundaries:**

```tsrx
function ComponentThatMayFail(props: { shouldFail: boolean }) {
  if (props.shouldFail) {
    throw new Error('Component failed!');
  }

  return <div>"Component working fine"</div>;
}

import { track } from 'ripple';

export function App() {
  let &[shouldFail] = track(false);

  return <div>
    try {
      <ComponentThatMayFail {shouldFail} />
    } catch (e) {
      <div>
        "Error: "
        {e.message}
      </div>
    }
    <button onClick={() => (shouldFail = !shouldFail)}>"Toggle Error"</button>
  </div>;
}
```

**[→ Control Flow Guide](https://www.ripple-ts.com/docs/guide/control-flow)**

### DOM Refs

Capture DOM elements with the `ref={fn}` syntax:

```tsrx
export function App() {
  return <div ref={(node) => console.log(node)}>"Hello"</div>;
}
```

**[→ DOM Refs Guide](https://www.ripple-ts.com/docs/guide/dom-refs)**

### Events

Use React-style event handlers:

```tsrx
import { track } from 'ripple';

export function App() {
  let &[value] = track('');

  return <div>
    <button onClick={() => console.log('Clicked')}>"Click"</button>
    <input onInput={(e) => (value = e.target.value)} />
    <p>
      "You typed: "
      {value}
    </p>
  </div>;
}
```

**[→ Events Guide](https://www.ripple-ts.com/docs/guide/events)**

### Styling

**Scoped CSS:**

```tsrx
export function App() {
  return <>
    <div class="container">"Content"</div>
    <style>
      .container {
        padding: 1rem;
        background: lightblue;
        border-radius: 8px;
      }
    </style>
  </>;
}
```

**Dynamic styles:**

```tsrx
import { track } from 'ripple';

export function App() {
  let &[color] = track('red');

  return <div>
    <div style={{ color, fontWeight: 'bold' }}>"Styled text"</div>
    <button onClick={() => (color = color === 'red' ? 'blue' : 'red')}>
      "Toggle Color"
    </button>
  </div>;
}
```

**[→ Styling Guide](https://www.ripple-ts.com/docs/guide/styling)**

## Advanced Features

### Context API

Share state across the component tree:

```tsrx
import { Context, track } from 'ripple';

const ThemeContext = new Context();

function Child() {
  const &[theme] = ThemeContext.get();
  return <div>
    "Theme: "
    {theme}
  </div>;
}

export function App() {
  let &[theme, themeTracked] = track('light');

  ThemeContext.set(themeTracked);

  return <div>
    <Child />
    <button onClick={() => (theme = theme === 'light' ? 'dark' : 'light')}>
      "Toggle Theme"
    </button>
  </div>;
}
```

**[→ State Management Guide](https://www.ripple-ts.com/docs/guide/state-management#context)**

### Portals

Render content outside the component hierarchy:

```tsrx
import { Portal, track } from 'ripple';

export function App() {
  let &[showModal] = track(false);

  return <div>
    <button onClick={() => (showModal = !showModal)}>"Toggle Modal"</button>

    if (showModal) {
      <Portal target={document.body}>
        <div class="modal">
          <p>"Modal content"</p>
          <button onClick={() => (showModal = false)}>"Close"</button>
        </div>
      </Portal>
    }
  </div>;
}
```

**[→ Portal & Component Guide](https://www.ripple-ts.com/docs/guide/components#portal-component)**

## Resources

- 📚 **[Full Documentation](https://www.ripple-ts.com/docs)** - Complete guide and
  API reference
- 🎮 **[Interactive Playground](https://www.ripple-ts.com/playground)** - Try
  Ripple in your browser
- 🧩 **[TSRX Website](https://tsrx.dev)** - Author `.tsrx` once, compile to React,
  Solid, or Ripple
- 🐛 **[GitHub Issues](https://github.com/Ripple-TS/ripple/issues)** - Report bugs
  or request features
- 💬 **[Discord Community](https://discord.gg/JBF2ySrh2W)** - Get help and discuss
  Ripple
- 📦 **[npm Package](https://www.npmjs.com/package/ripple)** - Install from npm

## Contributing

Contributions are welcome! Please see our
[contributing guidelines](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) for details.
