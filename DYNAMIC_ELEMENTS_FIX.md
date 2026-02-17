# Fix for Dynamic Element Types Not Allowing Attributes

## Problem Statement

When using dynamic element syntax like `<@variable />` where `variable` is a tracked value (e.g., `let div = track('div')`), TypeScript types don't allow any attributes to be added. The root cause is that the compiler capitalizes the variable name in TypeScript output, treating it as a component rather than an element.

### Example of the Issue

```ripple
component DynamicElement() {
  let tag = @'div';
  
  // This should work but TypeScript complains:
  <@tag class="my-class">Content</@tag>
  // Error: Property 'class' does not exist on type...
}
```

## Current Implementation

### 1. Analysis Phase (`packages/ripple/src/compiler/phases/2-analyze/index.js`)

**Location:** Lines 874-892

When a JSX element uses a tracked identifier (e.g., `<@tag />`), the analyze phase:

```javascript
if (node.id.type === 'Identifier' && node.id.tracked) {
  const source_name = node.id.name;  // e.g., "tag"
  const capitalized_name = source_name.charAt(0).toUpperCase() + source_name.slice(1);  // "Tag"
  node.metadata.ts_name = capitalized_name;
  node.metadata.source_name = source_name;
  
  // Mark the binding so we can capitalize it everywhere
  const binding = context.state.scope.get(source_name);
  if (binding) {
    if (!binding.metadata) {
      binding.metadata = {};
    }
    binding.metadata.is_dynamic_component = true;  // ⚠️ Key marker
  }
}
```

**Comment at line 877:** "However, we're going to get rid of capitalization in favor of jsx()"

### 2. Transform Phase (`packages/ripple/src/compiler/phases/3-transform/client/index.js`)

The transform phase has **three key locations** where dynamic components are handled:

#### A. Identifier Visitor (Lines 395-434)

When transforming identifiers in TypeScript mode:

```javascript
Identifier(node, context) {
  if (context.state.to_ts && node.tracked) {
    const binding = context.state.scope.get(node.name);
    if (binding?.metadata?.is_dynamic_component) {
      // Capitalize the identifier for TypeScript
      const capitalized_name = node.name.charAt(0).toUpperCase() + node.name.slice(1);
      const capitalized_node = {
        ...node,
        name: capitalized_name,
        metadata: { ...node.metadata, is_capitalized: true }
      };
      const member = b.member(
        capitalized_node,      // e.g., "Tag"
        b.literal('#v'),       // Property: '#v'
        true,                  // Computed: Tag['#v']
        !is_inside_left_side_assignment(node),
        node
      );
      member.tracked = true;
      return member;  // Returns: Tag['#v']
    }
    // Regular tracked variable
    return b.member(node, b.literal('#v'), true, ...);
  }
}
```

**Output:** `tag` → `Tag['#v']`

#### B. Variable Declaration Pattern Capitalization (Lines 847-860)

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
  // Handle ArrayPattern, ObjectPattern, etc.
};
```

**Output:** `let tag = @'div'` → `let Tag = @'div'` in TypeScript

#### C. JSXElement Metadata (Lines 2611-2627)

```javascript
if (node.id.type !== 'MemberExpression' && node.id.tracked) {
  // Mark for capitalization
  node.openingElement.metadata = {
    ...node.openingElement.metadata,
    is_capitalized: true
  };
  
  if (!node.selfClosing && !node.unclosed) {
    node.closingElement.metadata = {
      ...node.closingElement.metadata,
      is_capitalized: true
    };
  }
}
```

### 3. TypeScript Types (`packages/ripple/types/index.d.ts`)

**Lines 91-100:**

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

**The Problem:** This only defines callable signature for components, not for HTML element strings!

## Why It Doesn't Work

1. **Capitalization misleads TypeScript:** When `tag` becomes `Tag`, TypeScript treats it as a component name
2. **Wrong JSX typing:** The `Tracked` interface only makes tracked values callable as components, not as element types
3. **No element type support:** There's no TypeScript support for `Tracked<'div'>` being used as a JSX element

## The Solution

The fix involves using an obfuscated variable name pattern to access the tracked value directly without capitalization issues.

### Approach 1: Use Obfuscated Variable Names (Recommended)

Instead of capitalizing the variable name, create a temporary obfuscated variable that accesses `['#v']` directly:

**In Transform Phase:**

```javascript
// When encountering <@tag /> in TypeScript mode
// Instead of: Tag['#v']
// Generate: const __obfuscated_tag = tag['#v']; <@__obfuscated_tag />

if (node.id.type === 'Identifier' && node.id.tracked) {
  const source_name = node.id.name;  // "tag"
  const obfuscated_name = `__obfuscated_${source_name}`;
  
  // Add to component init:
  // const __obfuscated_tag = tag['#v'];
  state.init?.push(
    b.declaration(
      'const',
      b.id(obfuscated_name),
      b.member(b.id(source_name), b.literal('#v'), true)
    )
  );
  
  // Replace node.id with obfuscated identifier
  node.id = b.id(obfuscated_name);
}
```

**Benefits:**
- No capitalization needed
- Variable contains the actual string/component value
- TypeScript can properly infer the type
- Works for both dynamic elements and dynamic components

### Approach 2: Enhanced TypeScript Types

Add better type support for dynamic elements in `types/index.d.ts`:

```typescript
// Allow Tracked string literals to be used as JSX elements
export interface Tracked<V> {
  // Existing component support
  (props: V extends Component<infer P> ? P : never): V extends Component ? void : never;
}

// Type helper to extract element props based on tag name
type ElementProps<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T];

// This would require JSX namespace augmentation:
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any tracked value that resolves to a valid element type
      [key: string]: any;
    }
  }
}
```

**Challenge:** This approach is complex because TypeScript can't statically know what string value a tracked variable holds at runtime.

## Recommended Implementation Plan

### Phase 1: Modify Transform to Use Direct Access (Simplest Fix)

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`

**In Identifier visitor (around line 404):**

```javascript
if (binding?.metadata?.is_dynamic_component) {
  // DON'T capitalize for TypeScript
  // Instead, access the value directly
  const member = b.member(
    node,                    // Original name: "tag"
    b.literal('#v'),        // Property: '#v'
    true,                   // Computed: tag['#v']
    !is_inside_left_side_assignment(node),
    node
  );
  member.tracked = true;
  return member;  // Returns: tag['#v']
}
```

**Remove capitalization from:**
- Variable declaration patterns (line 850)
- JSXElement metadata (line 2611)

### Phase 2: Remove `is_dynamic_component` Metadata Entirely

**File:** `packages/ripple/src/compiler/phases/2-analyze/index.js`

Remove lines 885-892 that set `is_dynamic_component` since we're not capitalizing anymore.

### Phase 3: Update TypeScript Types (If needed)

Add JSX namespace augmentation to allow any tracked element type to accept standard HTML attributes.

## Testing the Fix

Create test cases for:

1. **Dynamic element with attributes:**
   ```ripple
   let tag = @'div';
   <@tag class="test" id="myDiv">Content</@tag>
   ```

2. **Dynamic component:**
   ```ripple
   let comp = @Button;
   <@comp label="Click me" />
   ```

3. **Dynamic element type switching:**
   ```ripple
   let tag = @'div';
   <@tag>Div content</@tag>
   
   tag = 'span';
   // Should update reactively
   ```

4. **Member expression access:**
   ```ripple
   let obj = { tag: @'div' };
   <@obj.tag>Content</@obj.tag>
   ```

## Key Files to Modify

1. `/packages/ripple/src/compiler/phases/2-analyze/index.js` (lines 874-892)
2. `/packages/ripple/src/compiler/phases/3-transform/client/index.js` (lines 404-423, 850-860, 2611-2627)
3. `/packages/ripple/types/index.d.ts` (optional type enhancements)

## Additional Notes

- The comment at line 877 in analyze phase indicates this refactor was already planned
- The current `is_capitalized` metadata was never properly handled for MemberExpression
- The long-term plan is to use `jsx()` runtime helper instead of capitalization
- The `#v` property is the internal tracked value accessor used throughout the runtime

## References

- Tracked interface: `/packages/ripple/types/index.d.ts` lines 91-100
- Dynamic component analysis: `/packages/ripple/src/compiler/phases/2-analyze/index.js` lines 874-901
- Dynamic component transform: `/packages/ripple/src/compiler/phases/3-transform/client/index.js` lines 395-434
