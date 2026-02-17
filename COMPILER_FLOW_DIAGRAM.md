# Ripple Compiler Flow for Tracked Values

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRACKED VALUE SYNTAX                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ CREATING tracked values:                                     │
│     let count = track(0);              // In components          │
│     this.#val = tracked(0, block);     // In classes            │
│                                                                  │
│  ✅ READING tracked values:                                      │
│     @count                             // Read identifier        │
│     @obj.property                      // Read property          │
│     @(expression)                      // Unbox expression       │
│     {<at>count}                            // In JSX                 │
│                                                                  │
│  ✅ WRITING tracked values:                                      │
│     @count = 5;                        // Direct assignment      │
│     @count++;                          // Increment              │
│     @obj.x = 10;                       // Property assignment    │
│                                                                  │
│  ❌ NOT VALID:                                                   │
│     let x = @0;                        // Can't create with @    │
│     this.count = @5;                   // Can't create with @    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Compiler Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                          SOURCE CODE                              │
│                                                                   │
│   component Counter() {                                           │
│       let count = track(0);                                       │
│       <button onclick={() => @count++}>{@count}</button>          │
│   }                                                               │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│               PHASE 1: PARSE (1-parse/index.js)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Lexer:                                                           │
│    • Recognizes '@' character (code 64)                           │
│    • Identifies '@count' as tracked identifier                    │
│    • Returns token: { type: 'name', value: '@count' }            │
│                                                                   │
│  Parser:                                                          │
│    • parseIdent() → marks node.tracked = true                     │
│    • Stores source_name: '@count', name: 'count'                  │
│    • Detects track() as CallExpression                            │
│                                                                   │
│  Output AST:                                                      │
│    {                                                              │
│      type: 'Component',                                           │
│      body: [                                                      │
│        {                                                          │
│          type: 'VariableDeclaration',                             │
│          declarations: [{                                         │
│            id: { type: 'Identifier', name: 'count' },             │
│            init: {                                                │
│              type: 'CallExpression',                              │
│              callee: { type: 'Identifier', name: 'track' },       │
│              arguments: [{ type: 'Literal', value: 0 }]           │
│            }                                                      │
│          }]                                                       │
│        },                                                         │
│        {                                                          │
│          type: 'Element',                                         │
│          children: [                                              │
│            {                                                      │
│              type: 'JSXExpressionContainer',                      │
│              expression: {                                        │
│                type: 'Identifier',                                │
│                name: 'count',                                     │
│                tracked: true  ← MARKED HERE                       │
│              }                                                    │
│            }                                                      │
│          ]                                                        │
│        }                                                          │
│      ]                                                            │
│    }                                                              │
│                                                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│            PHASE 2: ANALYZE (2-analyze/index.js)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Scope Creation:                                                  │
│    • Creates component scope                                      │
│    • Adds 'count' binding: { kind: 'normal', node: ... }         │
│                                                                   │
│  CallExpression Visitor:                                          │
│    • Detects is_ripple_track_call(track)                          │
│    • Marks parent function.metadata.tracked = true                │
│                                                                   │
│  Identifier Visitor:                                              │
│    • Sees @count reference (node.tracked = true)                  │
│    • Marks function.metadata.tracked = true                       │
│    • Validates binding exists in scope                            │
│                                                                   │
│  Output Metadata:                                                 │
│    {                                                              │
│      Component: {                                                 │
│        metadata: {                                                │
│          tracked: true,  ← Uses reactive values                   │
│          path: [...]                                              │
│        },                                                         │
│        scope: {                                                   │
│          bindings: Map {                                          │
│            'count' => { kind: 'normal', node: ... }               │
│          }                                                        │
│        }                                                          │
│      }                                                            │
│    }                                                              │
│                                                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│      PHASE 3: TRANSFORM (3-transform/client/index.js)             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CallExpression Visitor (track call):                             │
│    Input:  track(0)                                               │
│    Output: track(0, void 0, void 0, __block)                      │
│            └─────┬──────┘                                         │
│                  Add __block parameter for lifecycle              │
│                                                                   │
│  Identifier Visitor (@count):                                     │
│    Input:  @count                                                 │
│    Check:  node.tracked === true                                  │
│    Output: _$_.get(count)                                         │
│                                                                   │
│  UpdateExpression Visitor (@count++):                             │
│    Input:  @count++                                               │
│    Check:  node.argument.tracked === true                         │
│    Output: _$_.set(count, _$_.get(count) + 1)                     │
│                                                                   │
│  Final JavaScript:                                                │
│    export function Counter(__anchor, _, __block) {                │
│        _$_.push_component();                                      │
│                                                                   │
│        let count = track(0, void 0, void 0, __block);             │
│        var button = _$_.template('<button> </button>');           │
│        var text = _$_.child(button, true);                        │
│                                                                   │
│        _$_.on(button, 'click', () => {                            │
│            _$_.set(count, _$_.get(count) + 1);                    │
│        });                                                        │
│                                                                   │
│        _$_.render(() => {                                         │
│            _$_.set_text(text, _$_.get(count));                    │
│        });                                                        │
│                                                                   │
│        _$_.append(__anchor, button);                              │
│        _$_.pop_component();                                       │
│    }                                                              │
│                                                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                       RUNTIME EXECUTION                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  track(0, void 0, void 0, __block):                               │
│    → Creates signal with initial value 0                          │
│    → Registers with __block for cleanup                           │
│    → Returns signal object { get, set, peek }                     │
│                                                                   │
│  _$_.get(count):                                                  │
│    → Reads signal value                                           │
│    → Tracks dependency in current effect                          │
│    → Returns current value                                        │
│                                                                   │
│  _$_.set(count, newValue):                                        │
│    → Updates signal value                                         │
│    → Notifies all dependent effects                               │
│    → Triggers re-render                                           │
│                                                                   │
│  _$_.render(effect):                                              │
│    → Creates reactive effect                                      │
│    → Tracks all _$_.get() calls inside                            │
│    → Re-runs when dependencies change                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Class Handling - Current State

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLASS DECLARATION                              │
│                                                                   │
│   class Counter {                                                 │
│       count = @0;  ← ❌ NOT SUPPORTED                             │
│       constructor() {                                             │
│           this.value = @5;  ← ❌ NOT SUPPORTED                    │
│       }                                                           │
│   }                                                               │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│               PHASE 1: PARSE                                      │
│                                                                   │
│   ❌ Parser sees @0:                                              │
│      • Expects @identifier, not @literal                          │
│      • No syntax for creating tracked values with @               │
│                                                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│               PHASE 2: ANALYZE                                    │
│                                                                   │
│   ❌ No ClassDeclaration visitor:                                 │
│      • Classes treated like any other statement                   │
│      • No special handling for constructors                       │
│      • No detection of class field initializers                   │
│                                                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│               PHASE 3: TRANSFORM                                  │
│                                                                   │
│   ❌ Only printing/formatting:                                    │
│      • ClassDeclaration visitor just writes 'class ...'           │
│      • No transformation of class body                            │
│      • No injection of safe_scope() or tracked() calls            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Correct Class Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│                  WORKING CLASS PATTERN                            │
│                                                                   │
│   import { tracked } from 'ripple/internal/client/reactivity';   │
│   import { safe_scope } from 'ripple/internal/client/runtime';   │
│   import { get } from 'ripple/internal/client/signals';          │
│                                                                   │
│   class Counter {                                                 │
│       #block = safe_scope();                                      │
│       #count = tracked(0, this.#block);                           │
│                                                                   │
│       get count() {                                               │
│           return get(this.#count);                                │
│       }                                                           │
│                                                                   │
│       set count(value) {                                          │
│           this.#count(value);                                     │
│       }                                                           │
│                                                                   │
│       increment() {                                               │
│           this.count++;                                           │
│       }                                                           │
│   }                                                               │
│                                                                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
                 No compiler transformation needed!
                 This is plain JavaScript using runtime APIs.
```

## Key Files Reference

```
packages/ripple/src/compiler/
├── phases/
│   ├── 1-parse/
│   │   └── index.js (3,184 lines)
│   │       • RipplePlugin()
│   │       • readAtIdentifier() - handles @ prefix
│   │       • parseIdent() - marks tracked identifiers
│   │       • getTokenFromCode() - tokenizes @
│   │
│   ├── 2-analyze/
│   │   └── index.js
│   │       • visit_function() - tracks reactive functions
│   │       • Identifier visitor - detects @ usage
│   │       • CallExpression visitor - detects track()
│   │       • mark_as_tracked() - propagates tracking
│   │
│   └── 3-transform/
│       ├── client/
│       │   └── index.js (4,267 lines)
│       │       • CallExpression - adds __block to track()
│       │       • Identifier - converts @ to _$_.get()
│       │       • AssignmentExpression - converts to _$_.set()
│       │       • MemberExpression - handles @obj.prop
│       │
│       └── server/
│           └── index.js
│               • SSR transformations
│
├── utils.js
│   • is_ripple_track_call() - detects track() calls
│   • build_getter() - creates getter expressions
│   • build_assignment() - creates assignment expressions
│
└── scope.js
    • ScopeRoot - root scope management
    • Scope - lexical scope tracking

packages/ripple/src/runtime/
├── internal/client/
│   ├── runtime.js
│   │   • safe_scope() - creates lifecycle block
│   │   • push_component() / pop_component()
│   │
│   ├── reactivity.js
│   │   • tracked() - creates tracked value
│   │   • derived() - creates computed value
│   │
│   └── signals.js
│       • get() - reads signal value
│       • set() - updates signal value
│
├── url.js - TrackedURL class example
└── date.js - TrackedDate class example

Tests:
├── packages/ripple/tests/hydration/
│   ├── reactivity.test.js - hydration tests
│   └── compiled/
│       ├── client/reactivity.js - compiled output examples
│       └── server/reactivity.js - SSR output examples
│
└── packages/eslint-plugin/tests/rules/
    ├── unbox-tracked-values.test.ts
    └── no-module-scope-track.test.ts
```
