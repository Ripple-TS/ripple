# Ripple Compiler Architecture: Tracked Values & Classes

This document explains how the Ripple compiler handles tracked values (track() calls and @ expressions), with a focus on class handling and current limitations.

---

## Table of Contents

1. [Compiler Architecture Overview](#compiler-architecture-overview)
2. [How @ Syntax Works (Parse Phase)](#how--syntax-works-parse-phase)
3. [Analysis Phase - Scope & Binding](#analysis-phase---scope--binding)
4. [Transform Phase - Client Transform](#transform-phase---client-transform)
5. [Class Handling](#class-handling)
6. [Test Files for Reactivity](#test-files-for-reactivity)
7. [Current Limitations](#current-limitations)
8. [Correct Patterns](#correct-patterns)

---

## Compiler Architecture Overview

The Ripple compiler consists of three main phases:

```
Source Code
    ↓
1. Parse Phase (packages/ripple/src/compiler/phases/1-parse/)
   - Lexical analysis & syntax tree generation
   - Custom @ syntax handling
    ↓
2. Analysis Phase (packages/ripple/src/compiler/phases/2-analyze/)
   - Scope creation & binding analysis
   - Tracked value detection
    ↓
3. Transform Phase (packages/ripple/src/compiler/phases/3-transform/)
   - Client: Transform to runtime calls
   - Server: SSR code generation
    ↓
Compiled JavaScript
```

**Key Files:**
- **Parser**: `packages/ripple/src/compiler/phases/1-parse/index.js` (3,184 lines)
- **Analyzer**: `packages/ripple/src/compiler/phases/2-analyze/index.js`
- **Client Transform**: `packages/ripple/src/compiler/phases/3-transform/client/index.js` (4,267 lines)
- **Utils**: `packages/ripple/src/compiler/utils.js` (helpers like `is_ripple_track_call`)

---

## How @ Syntax Works (Parse Phase)

### 1. Lexical Analysis - `@` Character Detection

The parser recognizes `@` (character code 64) in specific contexts:

**Location**: `packages/ripple/src/compiler/phases/1-parse/index.js`, lines 726-793

```javascript
if (code === 64) {
    // @ character
    const nextChar = this.input.charCodeAt(this.pos + 1);
    
    // Check for @( unboxing syntax
    if (nextChar === 40) {  // '(' character
        this.pos += 2;
        return this.finishToken(tt.parenL, '@(');
    }
    
    // Check if next character can start an identifier (A-Z, a-z, _, $)
    if ((nextChar >= 65 && nextChar <= 90) || 
        (nextChar >= 97 && nextChar <= 122) ||
        nextChar === 95 || nextChar === 36) {
        
        // Only in expression contexts
        if (inExpression(currentType, this, tt) || inAwait(this, tt)) {
            return this.readAtIdentifier();
        }
    }
}
```

### 2. Valid Contexts for @ Syntax

#### ✅ Reading Tracked Identifiers
```javascript
let value = @count;           // Read tracked variable
@obj.property;                // Read tracked property
```

#### ✅ JSX Expressions
```jsx
<div>{@count}</div>
<Component value={@state.name} />
```

#### ✅ Unboxing Syntax @(expression)
```javascript
let sum = @(a + b);           // Unbox computed expression
@(counter.count * 2)          // Unbox complex expression
```

#### ✅ Tracked Member Access
```javascript
obj.@[key]                    // Computed member with tracking
```

#### ❌ NOT Valid: Creating Tracked Values
```javascript
let x = @0;                   // ❌ Not valid!
this.count = @5;              // ❌ Not valid!
const obj = { prop: @10 };    // ❌ Not valid!
```

**Key insight**: The `@` prefix is **only for reading** tracked values, not creating them.

### 3. parseIdent Override

**Location**: Lines 835-844

```javascript
parseIdent(liberal) {
    const node = super.parseIdent(liberal);
    if (node.name && node.name.startsWith('@')) {
        set_tracked_name(node, node.name);  // Store original name with @
        node.tracked = true;                 // Mark as tracked
    }
    return node;
}
```

This marks identifiers like `@count` with:
- `node.name = "count"` (without @)
- `node.metadata.source_name = "@count"` (with @)
- `node.tracked = true`

---

## Analysis Phase - Scope & Binding

### 1. Scope Creation

**Location**: `packages/ripple/src/compiler/phases/2-analyze/index.js`

The analysis phase:
1. Creates scopes for functions, components, blocks
2. Tracks bindings (variables, parameters, props)
3. Marks functions as "tracked" if they use reactive values

### 2. Tracking Detection

**Location**: Lines 75-89

```javascript
function visit_function(node, context) {
    node.metadata = {
        tracked: false,
        path: [...context.path],
    };
    
    context.next({
        ...context.state,
        function_depth: (context.state.function_depth ?? 0) + 1,
    });
    
    if (node.metadata.tracked) {
        mark_as_tracked(context.path);
    }
}
```

### 3. Identifier Analysis

**Location**: Lines 619-670

```javascript
Identifier(node, context) {
    const parent = context.path.at(-1);
    
    if (is_reference(node, parent)) {
        const binding = context.state.scope.get(node.name);
        
        // Mark function as tracked if it references tracked values
        if (node.tracked || binding?.kind === 'prop') {
            const fn = get_parent_function(context.path);
            if (fn) fn.metadata.tracked = true;
        }
    }
}
```

### 4. CallExpression Analysis for track()

**Location**: Lines 1014-1076

```javascript
CallExpression(node, context) {
    const callee = node.callee;
    
    // Detect track() or Ripple.track() calls
    if (is_ripple_track_call(callee, context)) {
        const parent_function = get_parent_function(context.path);
        if (parent_function) {
            parent_function.metadata.tracked = true;
        }
    }
    
    context.next();
}
```

**Helper function** in `packages/ripple/src/compiler/utils.js`, lines 282-295:

```javascript
export function is_ripple_track_call(callee, context) {
    if (callee.type === 'Super') return false;
    
    return (
        (callee.type === 'Identifier' && 
         (callee.name === 'track' || callee.name === 'trackSplit')) ||
        (callee.type === 'MemberExpression' &&
         callee.property.name === 'track' &&
         is_ripple_import(callee, context))
    );
}
```

---

## Transform Phase - Client Transform

### 1. Overview

**Location**: `packages/ripple/src/compiler/phases/3-transform/client/index.js`

The client transform converts analyzed AST into runtime calls. Key transformations:

1. `track()` calls → Add `__block` parameter
2. `@identifier` → `_$_.get(identifier)`
3. `@obj.prop` → `_$_.get_property(obj, "prop")`
4. `@obj.prop = val` → `_$_.set_property(obj, "prop", val)`

### 2. track() Call Transform

**Location**: Lines 519-596

```javascript
CallExpression(node, context) {
    const callee = node.callee;
    
    // Handle track() calls
    if (!context.state.to_ts && is_ripple_track_call(callee, context)) {
        if (callee.type === 'Identifier' && callee.name === 'track') {
            // Pad arguments to ensure we have 3: track(value, void 0, void 0, __block)
            if (node.arguments.length === 0) {
                node.arguments.push(b.void0, b.void0, b.void0);
            } else if (node.arguments.length === 1) {
                node.arguments.push(b.void0, b.void0);
            } else if (node.arguments.length === 2) {
                node.arguments.push(b.void0);
            }
        }
        return {
            ...node,
            arguments: [
                ...node.arguments.map(arg => context.visit(arg)),
                b.id('__block')  // Add __block as final parameter
            ],
        };
    }
    
    // ... other call handling
}
```

**Example transformation:**
```javascript
// Input
let count = track(0);

// Output
let count = track(0, void 0, void 0, __block);
```

### 3. Identifier Transform (@ prefix)

**Location**: Lines 395-460

```javascript
Identifier(node, context) {
    const parent = context.path.at(-1);
    
    if (is_reference(node, parent)) {
        const binding = context.state.scope.get(node.name);
        
        // For TypeScript output, convert @identifier to member access
        if (context.state.to_ts) {
            if (node.tracked) {
                const member = b.member(
                    node,
                    b.literal('#v'),
                    true,  // computed
                    !is_inside_left_side_assignment(node)
                );
                member.tracked = true;
                return member;  // Returns: identifier['#v']
            }
        } else {
            // For JavaScript output, wrap in _$_.get()
            if (node.tracked ||
                binding?.kind === 'prop' ||
                binding?.kind === 'index') {
                
                if (node.tracked) {
                    return b.call('_$_.get', build_getter(node, context));
                }
            }
        }
    }
}
```

**Example transformations:**
```javascript
// Input
let x = @count;

// Output (JS)
let x = _$_.get(count);

// Output (TS)
let x = count['#v'];
```

### 4. Assignment Transform

**Location**: Lines 1849-1907

```javascript
AssignmentExpression(node, context) {
    const left = node.left;
    
    // Handle @obj.property = value
    if (left.type === 'MemberExpression') {
        if (left.tracked || 
            (left.property.type === 'Identifier' && left.property.tracked)) {
            
            return build_assignment(
                left,
                node.operator,
                node.right,
                context
            );
        }
    }
    
    // Handle @variable = value
    if (left.type === 'Identifier' && left.tracked) {
        if (node.operator === '=') {
            return b.call('_$_.set',
                build_getter(left, context),
                context.visit(node.right)
            );
        }
        // Handle +=, -=, etc.
        return build_assignment(left, node.operator, node.right, context);
    }
    
    return context.next();
}
```

**Example transformations:**
```javascript
// Input
@count = 5;
@count += 1;
@obj.x = 10;

// Output
_$_.set(count, 5);
_$_.set(count, _$_.get(count) + 1);
_$_.set_property(obj, "x", 10);
```

### 5. Member Expression Transform

**Location**: Lines 1712-1834

```javascript
MemberExpression(node, context) {
    if (!context.state.to_ts && node.tracked) {
        const parent = context.path.at(-1);
        
        // If part of assignment, handle differently
        if (parent?.type === 'AssignmentExpression' && 
            parent.left === node) {
            return context.next();  // Let AssignmentExpression handle it
        }
        
        // Regular read: @obj.prop → _$_.get_property(obj, "prop")
        if (node.computed) {
            return b.call('_$_.get_property',
                context.visit(node.object),
                context.visit(node.property)
            );
        } else {
            return b.call('_$_.get_property',
                context.visit(node.object),
                b.literal(node.property.name)
            );
        }
    }
    
    return context.next();
}
```

---

## Class Handling

### ⚠️ Important Finding: No Special Class Handling

After thorough analysis, I found that:

1. **No ClassDeclaration visitor** in analysis phase
2. **No special constructor handling** for tracked values
3. **ClassDeclaration/ClassExpression are only handled for printing** in transform phase

### 1. Analysis Phase - Classes Not Specially Handled

**Location**: `packages/ripple/src/compiler/phases/2-analyze/index.js`, lines 113-1380

The visitors object includes:
- ✅ `FunctionDeclaration` (line 399)
- ✅ `FunctionExpression` (line 396)
- ✅ `ArrowFunctionExpression` (line 393)
- ✅ `Component` (line 403)
- ❌ **No `ClassDeclaration` visitor**
- ❌ **No `ClassExpression` visitor**
- ❌ **No `MethodDefinition` visitor**

Classes are processed using the default `_` visitor (line 114), which only adds metadata paths but performs no special analysis.

### 2. Transform Phase - Classes Only for Printing

**Location**: `packages/ripple/src/compiler/phases/3-transform/client/index.js`

Lines 4020-4044 (ClassDeclaration):
```javascript
ClassDeclaration(node, context) {
    context.write('class ');
    if (node.id) {
        context.visit(node.id);
    }
    if (node.typeParameters) {
        context.visit(node.typeParameters);
    }
    if (node.superClass) {
        context.write(' extends ');
        context.visit(node.superClass);
    }
    // ... similar for implements clause
    context.visit(node.body);
}
```

Lines 4045-4071 (ClassExpression): Similar structure

**This is only for printing/formatting, not transformation!**

### 3. Real-World Examples - How Ripple Classes Work

#### Example 1: TrackedURL Class

**Location**: `packages/ripple/src/runtime/url.js`, lines 1-120

```javascript
import { safe_scope } from './internal/client/runtime.js';
import { tracked } from './internal/client/reactivity.js';
import { get } from './internal/client/signals.js';

export class TrackedURL extends URL {
    #block = safe_scope();
    
    // Create tracked properties in field initializers
    #protocol = tracked(super.protocol, this.#block);
    #username = tracked(super.username, this.#block);
    #password = tracked(super.password, this.#block);
    #hostname = tracked(super.hostname, this.#block);
    #port = tracked(super.port, this.#block);
    #pathname = tracked(super.pathname, this.#block);
    #search = tracked(super.search, this.#block);
    #hash = tracked(super.hash, this.#block);
    
    // Getter/setter pairs for reactive properties
    get protocol() {
        return get(this.#protocol);
    }
    
    set protocol(value) {
        super.protocol = value;
        this.#protocol(value);  // Call signal to update
    }
    
    // ... similar for other properties
}
```

**Key patterns:**
1. Use `tracked()` function, not `@` syntax
2. Store signals in private fields (`#protocol`)
3. Use getter/setter to wrap signal access
4. Call `get()` in getters, call signal as function in setters

#### Example 2: TrackedDate Class

**Location**: `packages/ripple/src/runtime/date.js`, lines 1-50

```javascript
export class TrackedDate extends Date {
    #block = safe_scope();
    #time = tracked(super.getTime(), this.#block);
    
    getTime() {
        return get(this.#time);
    }
    
    setTime(value) {
        super.setTime(value);
        this.#time(value);
        return value;
    }
    
    // ... other methods
}
```

---

## Test Files for Reactivity

### 1. Hydration Tests

**Location**: `packages/ripple/tests/hydration/reactivity.test.js`

```javascript
describe('hydration > reactivity', () => {
    it('hydrates tracked state', async () => {
        await hydrateComponent(
            ServerComponents.TrackedState, 
            ClientComponents.TrackedState
        );
        const countDiv = container.querySelector('.count');
        expect(countDiv?.textContent).toBe('0');
    });
    
    it('hydrates counter with initial value', async () => {
        await hydrateComponent(
            ServerComponents.CounterWrapper, 
            ClientComponents.CounterWrapper
        );
        expect(container.querySelector('.count')?.textContent).toBe('5');
    });
    
    it('hydrates computed values', async () => { /* ... */ });
    it('hydrates multiple tracked values', async () => { /* ... */ });
    it('hydrates derived state', async () => { /* ... */ });
});
```

### 2. Compiled Test Examples

**Location**: `packages/ripple/tests/hydration/compiled/client/reactivity.js`

Shows how components with tracked state compile:

```javascript
export function TrackedState(__anchor, _, __block) {
    _$_.push_component();
    
    // track(0) becomes track(0, void 0, void 0, __block)
    let count = track(0, void 0, void 0, __block);
    
    var div_1 = root();
    var text = _$_.child(div_1, true);
    
    // @count becomes _$_.get(count)
    _$_.render(() => {
        _$_.set_text(text, _$_.get(count));
    });
    
    _$_.append(__anchor, div_1);
    _$_.pop_component();
}
```

### 3. ESLint Test Files

**Location**: `packages/eslint-plugin/tests/rules/`

- `unbox-tracked-values.test.ts` - Tests for proper @ usage
- `no-module-scope-track.test.ts` - Tests preventing track() at module level

---

## Current Limitations

### 1. ❌ Cannot Use @ to Create Tracked Values

```javascript
// ❌ NOT VALID - Parser doesn't support this
let count = @0;
this.value = @10;
const obj = { x: @5 };
```

**Why**: The `@` syntax is parsed only as a **prefix for reading identifiers**, not for creating literals.

### 2. ❌ Cannot Use @ in Class Field Initializers

```javascript
class Counter {
    // ❌ NOT VALID - No special class handling
    count = @0;
    
    constructor() {
        // ❌ NOT VALID
        this.value = @5;
    }
}
```

**Why**: 
- No special analysis for classes
- No transform to convert `@literal` to `track(literal)`
- Parser expects `@identifier`, not `@literal`

### 3. ❌ track() in Constructors Needs Context

```javascript
class Counter {
    constructor() {
        // ⚠️ Works but may not have proper cleanup
        this.count = track(0);  
    }
}
```

**Issue**: `track()` needs a `__block` for proper lifecycle management. In components, this is automatically provided, but in plain classes it's not.

---

## Correct Patterns

### Pattern 1: Use `tracked()` with Safe Scope

```javascript
import { tracked } from 'ripple/internal/client/reactivity';
import { safe_scope } from 'ripple/internal/client/runtime';
import { get } from 'ripple/internal/client/signals';

class Counter {
    #block = safe_scope();
    #count = tracked(0, this.#block);
    
    get count() {
        return get(this.#count);
    }
    
    set count(value) {
        this.#count(value);
    }
    
    increment() {
        this.count++;
    }
}
```

### Pattern 2: Use track() in Components

```javascript
component Counter() {
    // Inside components, __block is available
    let count = track(0);
    
    const increment = () => {
        @count++;  // Use @ to read and update
    };
    
    <button onclick={increment}>
        {@count}
    </button>
}
```

### Pattern 3: Use @ for Reading in JSX

```jsx
component UserProfile(user: User) {
    <div>
        <h1>{@user.name}</h1>
        <p>{@user.email}</p>
    </div>
}
```

### Pattern 4: Use @ in Event Handlers

```javascript
component Toggle() {
    let enabled = track(false);
    
    const toggle = () => {
        @enabled = !@enabled;  // Read and write
    };
    
    <button onclick={toggle}>
        Toggle: {@enabled ? 'On' : 'Off'}
    </button>
}
```

---

## Summary

### Key Takeaways

1. **@ is for reading, not creating**
   - `@identifier` reads a tracked value
   - Cannot use `@literal` to create tracked values
   - Parser limitation, not a design choice

2. **track() is for creating**
   - `track(value)` creates a tracked value
   - Automatically gets `__block` added in components
   - Use `tracked(value, block)` in classes

3. **Classes have no special handling**
   - No analysis phase visitors for classes
   - No transform phase logic for class constructors
   - Must manually use `tracked()` with `safe_scope()`

4. **Compiler phases work together**
   - Parse: Recognize @ syntax, create tracked AST nodes
   - Analyze: Mark functions as tracked, detect track() calls
   - Transform: Convert @ to runtime calls (_$_.get, _$_.set)

### Where to Add Class Support

If you want to support `this.count = @0` syntax in classes:

1. **Parser** (`1-parse/index.js`):
   - Extend `@` handling to allow `@literal` in assignment RHS
   - Create new AST node type (e.g., `TrackedLiteral`)

2. **Analyzer** (`2-analyze/index.js`):
   - Add `ClassDeclaration` visitor
   - Add `MethodDefinition` visitor for constructors
   - Detect `@literal` patterns in constructor assignments

3. **Transform** (`3-transform/client/index.js`):
   - Add logic to transform `this.prop = @value` 
   - Convert to `this.prop = track(value)` or `tracked(value, this.#block)`
   - Inject `#block = safe_scope()` into class body

This would be a significant enhancement requiring changes across all three phases.
