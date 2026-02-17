# Ripple Compiler Analysis - Executive Summary

## 🎯 Key Findings

### 1. How Tracked Values Work

The Ripple compiler uses a **three-phase architecture** to transform tracked values:

```
Parse → Analyze → Transform → Runtime
```

- **@ syntax is for READING**, not creating tracked values
- **track() function is for CREATING** tracked values
- Components automatically get `__block` lifecycle context
- Classes require manual `safe_scope()` and `tracked()` usage

### 2. Classes Are NOT Specially Handled ❌

**Critical Finding**: Classes have no special compiler support for tracked values.

- ❌ No `ClassDeclaration` visitor in analysis phase
- ❌ No `ClassExpression` visitor in analysis phase  
- ❌ No transformation of class constructors
- ❌ Cannot use `@` syntax to create tracked values in classes

**Example of what DOESN'T work:**
```javascript
class Counter {
    count = @0;  // ❌ Parser error - @ expects identifier
    
    constructor() {
        this.value = @5;  // ❌ Parser error
    }
}
```

### 3. Correct Patterns for Classes ✅

**Working Pattern** (from TrackedURL and TrackedDate runtime classes):

```javascript
import { tracked } from 'ripple/internal/client/reactivity';
import { safe_scope } from 'ripple/internal/client/runtime';
import { get } from 'ripple/internal/client/signals';

class Counter {
    #block = safe_scope();              // Create lifecycle block
    #count = tracked(0, this.#block);   // Create tracked signal
    
    get count() {
        return get(this.#count);        // Read signal
    }
    
    set count(value) {
        this.#count(value);             // Update signal (call as function)
    }
    
    increment() {
        this.count++;                   // Use getter/setter
    }
}
```

### 4. Component Pattern ✅

**In Components** (automatic lifecycle):

```javascript
component Counter() {
    let count = track(0);  // Automatically gets __block
    
    const increment = () => {
        @count++;          // Use @ to read and update
    };
    
    <button onclick={increment}>
        {@count}           // Use @ to read in JSX
    </button>
}
```

---

## 📁 Key File Locations

### Compiler Pipeline

| Phase | File | Lines | Description |
|-------|------|-------|-------------|
| **Parse** | `packages/ripple/src/compiler/phases/1-parse/index.js` | 3,184 | Tokenizes @ syntax, creates AST |
| **Analyze** | `packages/ripple/src/compiler/phases/2-analyze/index.js` | ~1,400 | Scope analysis, tracking detection |
| **Transform** | `packages/ripple/src/compiler/phases/3-transform/client/index.js` | 4,267 | Converts to runtime calls |
| **Utils** | `packages/ripple/src/compiler/utils.js` | ~600 | Helper functions like `is_ripple_track_call()` |

### Runtime APIs

| File | Exports | Purpose |
|------|---------|---------|
| `runtime/internal/client/runtime.js` | `safe_scope()`, `push_component()` | Lifecycle management |
| `runtime/internal/client/reactivity.js` | `tracked()`, `derived()` | Create reactive values |
| `runtime/internal/client/signals.js` | `get()`, `set()` | Read/write signals |

### Real-World Examples

| File | Description |
|------|-------------|
| `runtime/url.js` | TrackedURL class - 120 lines |
| `runtime/date.js` | TrackedDate class - 50 lines |
| `tests/hydration/reactivity.test.js` | Hydration tests |
| `tests/hydration/compiled/client/reactivity.js` | Compiled output examples |

---

## 🔍 Detailed Transformation Examples

### Example 1: track() Call

```javascript
// Input
let count = track(0);

// After Parse
CallExpression {
  callee: Identifier { name: 'track' },
  arguments: [Literal { value: 0 }]
}

// After Analyze
metadata.tracked = true  // Function marked as tracked

// After Transform
track(0, void 0, void 0, __block)  // __block added
```

### Example 2: @identifier Read

```javascript
// Input
let x = @count;

// After Parse
Identifier {
  name: 'count',
  tracked: true,
  metadata: { source_name: '@count' }
}

// After Analyze
binding = scope.get('count')  // Validates binding exists

// After Transform
let x = _$_.get(count);  // Runtime call
```

### Example 3: @identifier Assignment

```javascript
// Input
@count = 5;

// After Parse
AssignmentExpression {
  left: Identifier { name: 'count', tracked: true },
  operator: '=',
  right: Literal { value: 5 }
}

// After Analyze
function.metadata.tracked = true

// After Transform
_$_.set(count, 5);
```

### Example 4: @obj.property

```javascript
// Input
let x = @obj.count;

// After Parse
MemberExpression {
  object: Identifier { name: 'obj' },
  property: Identifier { name: 'count', tracked: true },
  tracked: true
}

// After Transform
let x = _$_.get_property(obj, "count");
```

---

## ⚙️ How @ Syntax is Parsed

### Token Recognition (Line 726-793)

```javascript
if (code === 64) {  // @ character
    const nextChar = this.input.charCodeAt(this.pos + 1);
    
    // @( syntax for unboxing
    if (nextChar === 40) {  // '('
        this.pos += 2;
        return this.finishToken(tt.parenL, '@(');
    }
    
    // @identifier syntax
    if ((nextChar >= 65 && nextChar <= 90) ||   // A-Z
        (nextChar >= 97 && nextChar <= 122) ||  // a-z
        nextChar === 95 || nextChar === 36) {   // _ or $
        
        if (inExpression(currentType, this, tt)) {
            return this.readAtIdentifier();
        }
    }
}
```

### Identifier Marking (Line 835-844)

```javascript
parseIdent(liberal) {
    const node = super.parseIdent(liberal);
    if (node.name && node.name.startsWith('@')) {
        set_tracked_name(node, node.name);  // Stores '@count' as source_name
        node.tracked = true;                 // Marks for transformation
    }
    return node;
}
```

---

## 🧪 Test Coverage

### Hydration Tests

**File**: `packages/ripple/tests/hydration/reactivity.test.js`

Tests include:
- ✅ `hydrates tracked state` - Basic track(0)
- ✅ `hydrates counter with initial value` - track(props.initial)
- ✅ `hydrates computed values` - Derived state
- ✅ `hydrates multiple tracked values` - Multiple track() calls
- ✅ `hydrates derived state` - Complex computations

### ESLint Tests

**Files**: `packages/eslint-plugin/tests/rules/`

- `unbox-tracked-values.test.ts` - Enforces proper @ usage
- `no-module-scope-track.test.ts` - Prevents track() at module level

---

## 🚫 What Doesn't Work

### 1. Creating Tracked Values with @

```javascript
// ❌ All of these are INVALID
let x = @0;
let arr = [@1, @2, @3];
let obj = { count: @5 };
this.value = @10;

// ✅ Use track() instead
let x = track(0);
let arr = track([1, 2, 3]);
let obj = track({ count: 5 });
this.value = track(10);
```

### 2. Class Field Initializers with @

```javascript
class Counter {
    // ❌ NOT SUPPORTED
    count = @0;
    items = [@1, @2];
    
    constructor() {
        // ❌ NOT SUPPORTED
        this.value = @5;
    }
}

// ✅ Use tracked() with safe_scope() instead
class Counter {
    #block = safe_scope();
    #count = tracked(0, this.#block);
    
    get count() {
        return get(this.#count);
    }
}
```

### 3. @ Outside Expression Contexts

```javascript
// ❌ @ must be in expression position
if (@) { }           // Invalid
while (@) { }        // Invalid
function @foo() { }  // Invalid

// ✅ @ in valid contexts
if (@flag) { }       // Reading tracked variable
while (@running) { } // Reading tracked variable
{@count}            // JSX expression
```

---

## 💡 Implementation Notes

### Why Classes Aren't Special

The compiler architecture treats classes as **opaque statements**:

1. **Parse phase**: Acorn parses class syntax, creates ClassDeclaration AST
2. **Analyze phase**: No visitor → uses default `_` visitor (just adds path)
3. **Transform phase**: Only handles TypeScript → JavaScript stripping

**Design decision**: Classes are user-land code, not framework constructs.

### Why @ is Read-Only

The `@` prefix was designed for **tracking dependencies**, not initialization:

1. Parser expects `@identifier`, not `@literal`
2. Transform phase converts `@x` → `_$_.get(x)` or `_$_.set(x, value)`
3. Initialization requires context (`__block`) that @ syntax doesn't provide

**Design decision**: Explicit `track()` calls make lifecycle clear.

---

## 📊 Transformation Summary Table

| Input Syntax | Parse Result | Transform Output | Runtime Behavior |
|--------------|-------------|------------------|------------------|
| `track(0)` | CallExpression | `track(0, void 0, void 0, __block)` | Creates signal |
| `@count` | Identifier (tracked) | `_$_.get(count)` | Reads signal, tracks dependency |
| `@count = 5` | Assignment | `_$_.set(count, 5)` | Updates signal, notifies effects |
| `@count++` | UpdateExpression | `_$_.set(count, _$_.get(count) + 1)` | Read + update |
| `@obj.x` | MemberExpression | `_$_.get_property(obj, "x")` | Reads property |
| `@obj.x = 5` | Assignment | `_$_.set_property(obj, "x", 5)` | Updates property |
| `@(expr)` | TrackedExpression | Wrapped in effect | Tracks dependencies in expr |

---

## 🔗 Related Documentation

- **Full Analysis**: See `COMPILER_TRACKED_VALUES_ANALYSIS.md`
- **Visual Flow**: See `COMPILER_FLOW_DIAGRAM.md`
- **Main Docs**: See `AGENTS.md` and `website/public/llms.txt`

---

## 🎓 Learning Path

1. **Start here**: Read this summary
2. **Visual learner**: Check `COMPILER_FLOW_DIAGRAM.md`
3. **Deep dive**: Read `COMPILER_TRACKED_VALUES_ANALYSIS.md`
4. **Code exploration**:
   - Parse: `packages/ripple/src/compiler/phases/1-parse/index.js`
   - Analyze: `packages/ripple/src/compiler/phases/2-analyze/index.js`
   - Transform: `packages/ripple/src/compiler/phases/3-transform/client/index.js`
5. **Real examples**:
   - `packages/ripple/src/runtime/url.js` (TrackedURL class)
   - `packages/ripple/tests/hydration/compiled/client/reactivity.js`

---

## ❓ Quick FAQ

**Q: Can I use `@0` to create a tracked value?**  
A: No. Use `track(0)` in components or `tracked(0, block)` in classes.

**Q: Why don't classes work like components?**  
A: Classes have no special compiler handling. Use `tracked()` with `safe_scope()`.

**Q: What's the difference between `track()` and `tracked()`?**  
A: `track()` is used in components (gets __block automatically). `tracked()` requires explicit block.

**Q: Can I use @ in TypeScript?**  
A: Yes, but it compiles to `identifier['#v']` instead of `_$_.get(identifier)`.

**Q: Where can I see compiled output?**  
A: Check `packages/ripple/tests/hydration/compiled/client/reactivity.js`.

---

Generated: 2024-02-17  
Ripple Compiler Version: Latest  
Analysis Depth: Complete (all 3 phases + runtime)
