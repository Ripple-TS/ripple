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

Ripple is a TypeScript-first UI framework built around `.tsrx` files, fine-grained
reactivity, scoped styles, and a small runtime. It pairs the authoring feel of JSX
with template-native control flow and TypeScript setup that can live right beside
the UI it feeds.

Created by [@trueadm](https://github.com/trueadm), who has contributed to
[Inferno](https://github.com/infernojs/inferno),
[React](https://github.com/facebook/react),
[Lexical](https://github.com/facebook/lexical), and
[Svelte 5](https://github.com/sveltejs/svelte).

> `.tsrx` is also a standalone language. The shared TSRX compiler stack can target
> React, Preact, Solid, Vue, and Ripple. Ripple is the runtime-focused target with
> `track()`, reactive collections, server modules, hydration, and DOM helpers.

**[Ripple Docs](https://www.ripple-ts.com/docs)** |
**[Ripple Playground](https://www.ripple-ts.com/playground)** |
**[TSRX Website](https://tsrx.dev)**

## Features

- Fine-grained reactivity with `track()` and lazy destructuring.
- Reactive `RippleArray`, `RippleObject`, `RippleMap`, and `RippleSet`.
- Template-native `@if`, `@for`, `@switch`, and `@try`.
- Local TypeScript setup with JSX statement containers (`@{...}`).
- Scoped `<style>` blocks with automatic class hashing.
- Vite, editor, Prettier, ESLint, SSR, and hydration support.

## Quick Start

### Using CLI

```bash
npx create-ripple
cd my-app
npm install
npm run dev
```

### Using Template

```bash
npx degit Ripple-TS/ripple/templates/basic my-app
cd my-app
npm install
npm run dev
```

### Add To Existing Project

```bash
npm install ripple @ripple-ts/vite-plugin
```

Use `npm`, `pnpm`, `yarn`, or `bun`, matching your project.

### Mounting

```ts
// index.ts
import { mount } from 'ripple';
import { App } from './App.tsrx';

mount(App, {
  props: { title: 'Hello world!' },
  target: document.getElementById('root'),
});
```

## Core Syntax

### Components

Components are ordinary TypeScript functions. Return a JSX element directly when
the component has one root, and use a JSX statement container (`@{...}`) when
setup statements or multiple rendered siblings belong next to the UI.

```tsrx
type ButtonProps = {
  text: string;
  onClick: () => void;
};

export function Button({ text, onClick }: ButtonProps) {
  return <button class="button" {onClick}>{text}</button>;
}

export function App() {
  return <Button text="Click me" onClick={() => console.log('Clicked!')} />;
}
```

Fragments are still useful when the component really returns multiple siblings,
such as markup plus a scoped `<style>` block.

### Local TypeScript

Plain JSX children are text, elements, comments, and `{...}` expression
containers. When a scope needs TypeScript setup before rendering, use a JSX
statement container: `@{...}`. Setup comes first and the container finishes with
exactly one output node: a JSX element, JSX fragment, or JSX control-flow
expression. If the output needs text, expression containers, or multiple siblings
after setup, wrap them in a fragment.

Text such as `x = 123` between tags is JSX text, not JavaScript, unless it is
inside a statement container.

```tsrx
import { track } from 'ripple';

export function Counter() @{
  let &[count] = track(0);
  const increment = () => count++;

  <button onClick={increment}>Count:{count}</button>
}
```

The same rule applies in nested scopes:

```tsrx
export function Cart({ items }: { items: Item[] }) @{
  <div class="cart">@{
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const discount =
      subtotal > 100 ? 0.1 : 0;

    <>
      <p>Subtotal: ${subtotal}</p>
      <p>Save: ${(subtotal * discount).toFixed(2)}</p>
    </>
  }</div>
}
```

JavaScript comments are allowed between template children and are not rendered.

### Text And Expressions

Static text is JSX text. Dynamic values use normal JSX expression containers.

```tsrx
export function Greeting({ name }: { name?: string }) @{
  @if (name) {
    <p>Hello,{name}</p>
  } @else {
    <p>Hello, stranger</p>
  }
}
```

### Control Flow

Rendered control flow uses directive-prefixed expressions:

```tsrx
import { RippleArray, track } from 'ripple';

type Item = { id: number; name: string; done?: boolean };

export function TodoList() @{
  const items = new RippleArray<Item>({ id: 1, name: 'Plan the work' }, {
    id: 2,
    name: 'Ship the work',
  });
  let &[showDone] = track(true);
  const visibleItems = () => items.filter((item) => showDone || !item.done);

  <ul>
    @for (const item of visibleItems(); index i; key item.id) {
      <li>
        {i + 1}
        .
        {item.name}
      </li>
    } @empty {
      <li>No todos to show</li>
    }
  </ul>
}
```

Use ordinary `return` for real function exits in TypeScript setup. Use `@if` for
conditional rendering; direct `return`, `continue`, and `break` statements are not
valid inside `@if` template branches.

```tsrx
export function Dashboard({ user }: { user: User | null }) @{
  if (!user) {
    return null;
  }

  <>
    <h1>Welcome,{user.name}</h1>
    <p>Here is your dashboard.</p>
  </>
}
```

`@try` supports error and pending UI:

```tsrx
export function ProfilePanel() @{
  @try {
    <UserProfile />
  } @pending {
    <p>Loading...</p>
  } @catch (error, reset) {
    <div>
      <p>Error:{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  }
}
```

### Reactivity

Create state with `track()` and lazy destructuring. Reads of lazy bindings stay
reactive, and assignments write back to the tracked value.

```tsrx
import { effect, track, type Tracked } from 'ripple';

export function Counter() @{
  let &[count, trackedCount] = track(0);
  let &[double] = track(() => count * 2);
  effect(() => {
    console.log('Count changed:', count);
  });

  <>
    <p>Count:{count}</p>
    <p>Double:{double}</p>
    <button onClick={() => count++}>Increment</button>
    <CounterValue count={trackedCount} />
  </>
}

function CounterValue({ count }: { count: Tracked<number> }) {
  return <p>Shared value:{count.value}</p>;
}
```

`Tracked<T>` objects can also be read and written through `.value`, which is
useful when passing reactive values through data structures or props.

### Reactive Collections

Use Ripple collections when collection operations should be reactive.

```tsrx
import { RippleArray, RippleMap, RippleObject, RippleSet } from 'ripple';

export function Inventory() @{
  const items = new RippleArray({ id: 1, name: 'Jacket' });
  const totals = new RippleObject({ selected: 0 });
  const prices = new RippleMap([[1, 120]]);
  const selected = new RippleSet<number>();

  <>
    <ul>
      @for (const item of items; key item.id) {
        <li>{item.name}: ${prices.get(item.id)}</li>
      }
    </ul>
    <button onClick={() => selected.add(1)}>Select first item</button>
    <p>
      Selected:
      {selected.size + totals.selected}
    </p>
  </>
}
```

### DOM Refs And Events

DOM refs use `ref`, and events use JSX-style event props.

```tsrx
import { track } from 'ripple';

export function SearchBox() @{
  let &[value] = track('');
  let input: HTMLInputElement | undefined;

  <>
    <label>
      Search
      <input
        ref={input}
        value={value}
        onInput={(event) => {
          value = event.currentTarget.value;
        }}
      />
    </label>
    <button onClick={() => input?.focus()}>Focus</button>
  </>
}
```

### Scoped Styles

`<style>` blocks are static CSS and are scoped to the template. Use CSS custom
properties for runtime values.

```tsrx
import { track } from 'ripple';

export function Notice() @{
  let &[tone] = track('rebeccapurple');

  <>
    <p class="notice" style={{ '--notice-color': tone }}>Scoped text</p>
    <button
      onClick={() => (tone = tone === 'rebeccapurple'
        ? 'tomato'
        : 'rebeccapurple')}
    >Toggle tone</button>
    <style>
      .notice {
        color: var(--notice-color);
        font-weight: 700;
      }
    </style>
  </>
}
```

Module-scope style expressions can expose scoped class names:

```tsrx
const styles = <style>
  .highlight {
    background: #e8f5e9;
  }
</style>;

export function Badge() {
  return <span class={styles.highlight}>New</span>;
}
```

### Context And Portals

```tsrx
import { Context, Portal, track, type Tracked } from 'ripple';

const ThemeContext = new Context<Tracked<string>>();

export function App() @{
  let &[theme, themeTracked] = track('light');
  ThemeContext.set(themeTracked);

  <>
    <ThemeLabel />
    <button onClick={() => (theme = theme === 'light' ? 'dark' : 'light')}>
      Toggle theme
    </button>
    <Portal target={document.body}>
      <p>Portal content</p>
    </Portal>
  </>
}

function ThemeLabel() @{
  const theme = ThemeContext.get();

  <p>Theme:{theme.value}</p>
}
```

### Server Modules

Ripple supports `module server` in `.tsrx` files for server-oriented exports.
Import from `server` inside the same file before calling the server function.

```tsrx
module server {
  export async function loadMessage() {
    return 'Loaded on the server';
  }
}

import { loadMessage } from server;
import { effect, track } from 'ripple';

export function Page() @{
  let &[message] = track('Loading...');
  effect(() => {
    loadMessage().then((next) => {
      message = next;
    });
  });

  <p>{message}</p>
}
```

## Editor Support

Install the
[Ripple VSCode extension](https://marketplace.visualstudio.com/items?itemName=Ripple-TS.ripple-ts-vscode-plugin)
for syntax highlighting, diagnostics, TypeScript integration, and completions.

## Resources

- [Full Documentation](https://www.ripple-ts.com/docs)
- [Interactive Playground](https://www.ripple-ts.com/playground)
- [TSRX Website](https://tsrx.dev)
- [GitHub Issues](https://github.com/Ripple-TS/ripple/issues)
- [Discord Community](https://discord.gg/JBF2ySrh2W)
- [npm Package](https://www.npmjs.com/package/ripple)

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) for details.
