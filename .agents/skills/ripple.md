# Ripple Framework Skill

This skill provides knowledge about the Ripple TypeScript UI framework.

## What is Ripple?

Ripple is a TypeScript UI framework combining React, Solid, and Svelte concepts.
It uses `.ripple` files with full TypeScript support.

## Key Concepts

### Components

```ripple
component Button(props: { text: string; onClick: () => void }) {
  <button onClick={props.onClick}>{props.text}</button>
}
```

### Reactivity

```ripple
import { track } from 'ripple';

component Counter() {
  let count = track(0);
  let double = track(() => @count * 2);

  <div>
    <p>
      {'Count: '}
      {@count}
    </p>
    <button onClick={() => @count++}>{'Increment'}</button>
  </div>
}
```

- `track(value)` creates a reactive variable
- `@variable` reads/writes the tracked value
- Text must be wrapped in expressions: `{"string"}` not bare text

### Reactive Collections

- `#[]` - TrackedArray (fully reactive array)
- `#{}` - TrackedObject (shallow reactive object)
- `#Map()` - TrackedMap
- `#Set()` - TrackedSet

### Control Flow

```ripple
// Conditionals
if (condition) {
  <span>{'Visible'}</span>
}

// Loops
for (const item of items; key item.id) {
  <li>{item.text}</li>
}

// Error boundaries
try {
  <RiskyComponent />
} catch (e) {
  <div>
    {'Error: '}
    {e.message}
  </div>
}
```

## Project Structure

- `packages/ripple/src/compiler/` - Compiler (parse → analyze → transform)
- `packages/ripple/src/runtime/` - Runtime (client/server)
- `packages/language-server/` - LSP via Volar
- `packages/vscode-plugin/` - VS Code extension

## Commands

```bash
pnpm install        # Install dependencies (pnpm required)
pnpm test           # Run all tests
pnpm format         # Format with Prettier
pnpm format:check   # Check formatting
```

## Code Style

- **snake_case** for variables and functions
- **SCREAMING_SNAKE_CASE** for constants
- **JavaScript with JSDoc** for internal code (not TypeScript)
- **pnpm** required (not npm or yarn)

## Documentation

See `website/public/llms.txt` for comprehensive Ripple documentation.
