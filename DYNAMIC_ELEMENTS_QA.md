# Dynamic Element Types Fix - Answers to Specific Questions

## Question 1: Where are dynamic elements currently transformed in the client transform?

### Primary Location: `packages/ripple/src/compiler/phases/3-transform/client/index.js`

#### A. Identifier Visitor (Lines 395-434)
This is the main entry point where ALL identifiers are transformed. When an identifier is:
- A reference (not a declaration)
- In TypeScript mode (`to_ts: true`)
- Tracked (`node.tracked === true`)
- Marked as dynamic component (`binding?.metadata?.is_dynamic_component`)

It gets capitalized and wrapped with `['#v']`:

```javascript
Identifier(node, context) {
  const parent = context.path.at(-1);
  
  if (is_reference(node, parent)) {
    if (context.state.to_ts) {
      if (node.tracked) {
        const binding = context.state.scope.get(node.name);
        if (binding?.metadata?.is_dynamic_component) {
          // Problem: Capitalizes "tag" → "Tag"
          const capitalized_name = node.name.charAt(0).toUpperCase() + node.name.slice(1);
          const capitalized_node = {
            ...node,
            name: capitalized_name,
            metadata: { ...node.metadata, is_capitalized: true }
          };
          // Returns: Tag['#v']
          return b.member(capitalized_node, b.literal('#v'), true, ...);
        }
        // Regular tracked: tag['#v']
        return b.member(node, b.literal('#v'), true, ...);
      }
    }
  }
}
```

#### B. Variable Declaration Transform (Lines 847-860)
Capitalizes patterns in variable declarations:

```javascript
VariableDeclaration(node, context) {
  // ...
  const capitalize_pattern = (pattern) => {
    if (pattern.type === 'Identifier') {
      const binding = context.state.scope.get(pattern.name);
      if (binding?.metadata?.is_dynamic_component) {
        const capitalized_name = pattern.name.charAt(0).toUpperCase() + pattern.name.slice(1);
        return {
          ...pattern,
          name: capitalized_name,
          metadata: { ...pattern.metadata, is_capitalized: true }
        };
      }
    }
    return pattern;
  };
}
```

**Effect:** `let tag = @'div'` becomes `let Tag = _$_.tracked('div')`

#### C. JSXElement Opening/Closing Tags (Lines 2611-2627)
Marks JSX element nodes for capitalization:

```javascript
Element(node, context) {
  // ... transform attributes and children ...
  
  if (node.id.type !== 'MemberExpression' && node.id.tracked) {
    // Mark opening element
    node.openingElement.metadata = {
      ...node.openingElement.metadata,
      is_capitalized: true
    };
    
    // Mark closing element
    if (!node.selfClosing && !node.unclosed) {
      node.closingElement.metadata = {
        ...node.closingElement.metadata,
        is_capitalized: true
      };
    }
  }
}
```

**Effect:** `<@tag>` and `</@tag>` both get `is_capitalized: true` metadata

---

## Question 2: How does the `is_dynamic_component` metadata work?

### Setting the Metadata (Analysis Phase)

**File:** `packages/ripple/src/compiler/phases/2-analyze/index.js`  
**Lines:** 874-892

```javascript
Element(node, context) {
  // ...
  
  // Check if element uses tracked identifier: <@tag />
  if (node.id.type === 'Identifier' && node.id.tracked) {
    const source_name = node.id.name;  // e.g., "tag"
    const capitalized_name = source_name.charAt(0).toUpperCase() + source_name.slice(1);
    
    // Store both names in element metadata
    node.metadata.ts_name = capitalized_name;      // "Tag"
    node.metadata.source_name = source_name;       // "tag"
    
    // 🔑 KEY STEP: Mark the binding
    const binding = context.state.scope.get(source_name);
    if (binding) {
      if (!binding.metadata) {
        binding.metadata = {};
      }
      // This flag tells transform phase to capitalize everywhere
      binding.metadata.is_dynamic_component = true;
    }
  }
}
```

### Using the Metadata (Transform Phase)

Once `is_dynamic_component` is set on the binding, it affects how the identifier is transformed **everywhere** in the code:

1. **In variable declarations:**
   ```javascript
   let tag = @'div';
   // ↓ becomes ↓
   let Tag = _$_.tracked('div', __block);
   ```

2. **In JSX element positions:**
   ```javascript
   <@tag>
   // ↓ becomes ↓
   <Tag['#v']>
   ```

3. **In any reference to the variable:**
   ```javascript
   console.log(tag);
   // ↓ becomes ↓
   console.log(Tag['#v']);
   ```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PARSE: Create AST                                        │
│    <@tag /> → Element { id: Identifier("tag", tracked) }  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ANALYZE: Visit Element node                             │
│    - See node.id.tracked === true                          │
│    - Get binding for "tag" from scope                      │
│    - Set: binding.metadata.is_dynamic_component = true     │
│    - Store: node.metadata.ts_name = "Tag"                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TRANSFORM: Visit every Identifier node                  │
│    For each identifier with name "tag":                    │
│    - Look up binding in scope                              │
│    - Check: binding.metadata.is_dynamic_component?         │
│    - If true: capitalize and wrap with ['#v']              │
│    - Return: Tag['#v']                                     │
└─────────────────────────────────────────────────────────────┘
```

### Why This Doesn't Work

The `is_dynamic_component` metadata is a **global flag** for the binding. Once set, it affects the identifier **everywhere**, not just in JSX positions. This causes problems:

```typescript
let tag = @'div';  // Sets is_dynamic_component = true

// Now ALL uses of 'tag' get capitalized:
let Tag = _$_.tracked('div', __block);  // ❌ Capitalized declaration

<Tag['#v'] class="test">Content</Tag['#v']>
//  ^                        ^
//  TypeScript sees "Tag" (uppercase) = Component
//  Components don't accept HTML attributes like "class"
//  Result: Type error!
```

---

## Question 3: How to modify the transform to use `variable['#v']` instead of capitalizing?

### Changes Required

#### Change 1: Remove Capitalization from Identifier Transform

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`  
**Lines:** 404-423

**BEFORE:**
```javascript
Identifier(node, context) {
  if (is_reference(node, parent)) {
    if (context.state.to_ts && node.tracked) {
      const binding = context.state.scope.get(node.name);
      if (binding?.metadata?.is_dynamic_component) {
        // ❌ Capitalizes
        const capitalized_name = node.name.charAt(0).toUpperCase() + node.name.slice(1);
        const capitalized_node = {
          ...node,
          name: capitalized_name,
          metadata: { ...node.metadata, is_capitalized: true }
        };
        return b.member(capitalized_node, b.literal('#v'), true, ...);
      }
      // Regular tracked variable
      return b.member(node, b.literal('#v'), true, ...);
    }
  }
}
```

**AFTER:**
```javascript
Identifier(node, context) {
  if (is_reference(node, parent)) {
    if (context.state.to_ts && node.tracked) {
      // ✅ No special case for dynamic components
      // ✅ Just access the tracked value directly
      const member = b.member(
        node,  // Keep original name: "tag" not "Tag"
        b.literal('#v'),
        true,
        !is_inside_left_side_assignment(node),
        /** @type {AST.NodeWithLocation} */ (node)
      );
      member.tracked = true;
      return member;  // Returns: tag['#v']
    }
  }
}
```

#### Change 2: Remove Pattern Capitalization

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`  
**Lines:** 847-910

**BEFORE:**
```javascript
const capitalize_pattern = (pattern) => {
  if (pattern.type === 'Identifier') {
    const binding = context.state.scope.get(pattern.name);
    if (binding?.metadata?.is_dynamic_component) {
      const capitalized_name = pattern.name.charAt(0).toUpperCase() + pattern.name.slice(1);
      return {
        ...pattern,
        name: capitalized_name,
        metadata: { ...pattern.metadata, is_capitalized: true }
      };
    }
  }
  return pattern;
};

// Apply capitalization to declarators
for (const declarator of node.declarations) {
  declarator.id = capitalize_pattern(declarator.id);
}
```

**AFTER:**
```javascript
// ✅ Remove the capitalize_pattern function entirely
// ✅ Don't modify declarator.id

// Variable declarations stay as-is:
// let tag = @'div' → let tag = _$_.tracked('div', __block)
```

#### Change 3: Remove JSXElement Metadata

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`  
**Lines:** 2611-2627

**BEFORE:**
```javascript
if (node.id.type !== 'MemberExpression' && node.id.tracked) {
  node.openingElement.metadata = {
    ...node.openingElement.metadata,
    is_capitalized: true,
  };
  
  if (!node.selfClosing && !node.unclosed) {
    node.closingElement.metadata = {
      ...node.closingElement.metadata,
      is_capitalized: true,
    };
  }
}
```

**AFTER:**
```javascript
// ✅ Remove this entire block
// The element name doesn't need special metadata anymore
```

#### Change 4: Remove Metadata from Analysis Phase

**File:** `packages/ripple/src/compiler/phases/2-analyze/index.js`  
**Lines:** 879-892

**BEFORE:**
```javascript
if (node.id.type === 'Identifier' && node.id.tracked) {
  const source_name = node.id.name;
  const capitalized_name = source_name.charAt(0).toUpperCase() + source_name.slice(1);
  node.metadata.ts_name = capitalized_name;
  node.metadata.source_name = source_name;
  
  // Mark the binding as a dynamic component
  const binding = context.state.scope.get(source_name);
  if (binding) {
    if (!binding.metadata) {
      binding.metadata = {};
    }
    binding.metadata.is_dynamic_component = true;
  }
}
```

**AFTER:**
```javascript
if (node.id.type === 'Identifier' && node.id.tracked) {
  const source_name = node.id.name;
  // ✅ Just store the source name for reference if needed
  node.metadata.source_name = source_name;
  
  // ✅ Don't set is_dynamic_component
  // ✅ Don't create capitalized_name
}
```

### Summary of Changes

| Location | Before | After |
|----------|--------|-------|
| **Variable declaration** | `let Tag = ...` | `let tag = ...` |
| **JSX element** | `<Tag['#v']>` | `<tag['#v']>` |
| **Identifier references** | `Tag['#v']` | `tag['#v']` |
| **Metadata** | `is_dynamic_component: true`<br>`is_capitalized: true` | *(removed)* |

---

## Question 4: What TypeScript type changes are needed?

### Current TypeScript Types

**File:** `packages/ripple/types/index.d.ts`  
**Lines:** 91-100

```typescript
// Base Tracked interface - all tracked values have a '#v' property
export interface Tracked<V> {
  '#v': V;
}

// Augment Tracked to be callable when V is a Component
// This allows <@Something /> to work in JSX when Something is Tracked<Component>
export interface Tracked<V> {
  (props: V extends Component<infer P> ? P : never): V extends Component ? void : never;
}
```

### Problem with Current Types

The current `Tracked` interface only makes tracked values **callable** when they're components. It doesn't help with dynamic element types:

```typescript
let tag = @'div';
// Type: Tracked<string>

<@tag class="test">  // Error!
// TypeScript sees: tag['#v'] which is type string
// But expects: intrinsic JSX element or component
```

### Option 1: JSX Namespace Augmentation (Minimal Change)

Add to `packages/ripple/types/index.d.ts`:

```typescript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any property access that could be an element type
      [key: string]: any;
    }
  }
}
```

**Pros:**
- ✅ Simple one-line change
- ✅ Allows dynamic element types to work

**Cons:**
- ❌ Too permissive - loses type safety for all JSX elements
- ❌ Allows invalid element names without errors

### Option 2: Conditional Type Mapping (Better Type Safety)

```typescript
// In packages/ripple/types/index.d.ts

// Helper type to check if a value is a valid HTML element tag name
type HTMLElementTagName = keyof JSX.IntrinsicElements;

// Extend Tracked interface to handle JSX element types
export interface Tracked<V> {
  '#v': V;
  
  // For components: make tracked value callable
  (props: V extends Component<infer P> ? P : never): V extends Component ? void : never;
}

// Augment JSX namespace to allow tracked element types
declare global {
  namespace JSX {
    // Allow string literals that are valid element names
    interface IntrinsicElements {
      // Keep existing element definitions
      // ...
    }
    
    // Allow tracked element types in JSX
    type ElementType = 
      | keyof IntrinsicElements
      | Component<any>
      | { '#v': keyof IntrinsicElements }  // Tracked element
      | { '#v': Component<any> };           // Tracked component
  }
}
```

**Pros:**
- ✅ Better type safety
- ✅ Preserves IntelliSense for HTML attributes
- ✅ Distinguishes between elements and components

**Cons:**
- ⚠️ More complex type definitions
- ⚠️ May require TypeScript 4.5+

### Option 3: Do Nothing (Recommended for Now)

**Why this might be best:**

With the capitalization removed, TypeScript will see:
```typescript
let tag = _$_.tracked('div', __block);
<tag['#v'] class="test">
```

The expression `tag['#v']` has type `string` at compile time. TypeScript's JSX transform already handles string expressions in element position, treating them as dynamic element types.

**Test this first before adding complex types!**

### Recommended Approach

1. **Phase 1:** Implement the transform changes (remove capitalization)
2. **Phase 2:** Test with real examples
3. **Phase 3:** Only add types if necessary based on actual TypeScript errors

The key insight: once we stop capitalizing, TypeScript will naturally treat lowercase identifiers as element types, not component types.

---

## Complete Example: Before & After

### Source Code
```ripple
component DynamicElement() {
  let tag = @'div';
  <@tag class="test" id="myDiv">Content</@tag>
}
```

### CURRENT OUTPUT (Broken)
```typescript
function DynamicElement() {
  let Tag = _$_.tracked('div', __block);
  //  ^── ❌ Capitalized
  
  <Tag['#v'] class="test" id="myDiv">Content</Tag['#v']>
  // ^── ❌ TypeScript error: Property 'class' does not exist on type Component
}
```

### PROPOSED OUTPUT (Fixed)
```typescript
function DynamicElement() {
  let tag = _$_.tracked('div', __block);
  //  ^── ✅ Lowercase
  
  <tag['#v'] class="test" id="myDiv">Content</tag['#v']>
  // ^── ✅ TypeScript treats as dynamic element, allows attributes
}
```

---

## Testing Plan

Create test files to verify:

1. **Dynamic HTML elements with attributes:**
   ```ripple
   let div = @'div';
   <@div class="test" style="color: red">Content</@div>
   ```

2. **Dynamic components:**
   ```ripple
   let Button = @SomeButton;
   <@Button label="Click" onClick={handler} />
   ```

3. **Switching between element and component:**
   ```ripple
   let dynamic = @'div';
   <@dynamic>HTML Element</@dynamic>
   
   dynamic = Button;
   <@dynamic label="Now a component" />
   ```

4. **Member expressions:**
   ```ripple
   let config = { tag: @'span' };
   <@config.tag class="test">Content</@config.tag>
   ```

---

## Summary

The fix is straightforward:

1. ✅ **Stop capitalizing** tracked identifiers used in JSX
2. ✅ **Keep lowercase** names throughout the transform
3. ✅ **Remove** `is_dynamic_component` and `is_capitalized` metadata
4. ✅ **Let TypeScript** naturally handle lowercase = element, uppercase = component
5. ✅ **Test** before adding complex type definitions

The root cause was trying to be too clever with capitalization. The simple solution is to follow JSX conventions and let the case speak for itself!
