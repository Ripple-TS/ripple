# Dynamic Element Transformation Flow

## Current Flow (With Capitalization - BROKEN for attributes)

```
┌─────────────────────────────────────────────────────────────────┐
│ Source Code (Ripple)                                            │
├─────────────────────────────────────────────────────────────────┤
│ component Example() {                                           │
│   let tag = @'div';                                            │
│   <@tag class="test">Content</@tag>                           │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ PHASE 1: PARSE
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ AST                                                             │
├─────────────────────────────────────────────────────────────────┤
│ Element {                                                       │
│   id: Identifier {                                             │
│     name: "tag",                                               │
│     tracked: true                                              │
│   },                                                            │
│   attributes: [Attribute { name: "class", value: "test" }]    │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ PHASE 2: ANALYZE
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Analysis Phase - Sets Metadata                                  │
├─────────────────────────────────────────────────────────────────┤
│ if (node.id.tracked) {                                         │
│   // Store capitalized name                                    │
│   node.metadata.ts_name = "Tag"                               │
│   node.metadata.source_name = "tag"                           │
│                                                                 │
│   // Mark binding for capitalization everywhere               │
│   binding.metadata.is_dynamic_component = true  ⚠️            │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ PHASE 3: TRANSFORM (TypeScript mode)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Identifier Transform                                            │
├─────────────────────────────────────────────────────────────────┤
│ Identifier("tag") {                                            │
│   if (binding.metadata.is_dynamic_component) {                │
│     // Capitalize: "tag" → "Tag"                              │
│     // Then wrap: Tag['#v']                                   │
│     return MemberExpression {                                  │
│       object: Identifier("Tag"),  ⚠️ Capitalized!            │
│       property: Literal("#v"),                                │
│       computed: true                                           │
│     }                                                          │
│   }                                                            │
│ }                                                              │
│                                                                 │
│ VariableDeclaration Transform                                  │
│ - "let tag" → "let Tag"  ⚠️ Capitalized!                      │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ TypeScript Output (BROKEN)                                      │
├─────────────────────────────────────────────────────────────────┤
│ function Example() {                                            │
│   let Tag = _$_.tracked('div', __block);                      │
│   <Tag['#v'] class="test">Content</Tag['#v']>                 │
│ }                                                               │
│                                                                 │
│ ❌ Problem: "Tag" looks like a Component to TypeScript!        │
│ ❌ TypeScript Error: Property 'class' does not exist...        │
└─────────────────────────────────────────────────────────────────┘
```

## Proposed Flow (Without Capitalization - FIXED)

```
┌─────────────────────────────────────────────────────────────────┐
│ Source Code (Ripple) - Same as before                          │
├─────────────────────────────────────────────────────────────────┤
│ component Example() {                                           │
│   let tag = @'div';                                            │
│   <@tag class="test">Content</@tag>                           │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ PHASE 1: PARSE (unchanged)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ AST - Same as before                                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ PHASE 2: ANALYZE (simplified)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Analysis Phase - Simplified                                     │
├─────────────────────────────────────────────────────────────────┤
│ if (node.id.tracked) {                                         │
│   // Just store source name for reference                      │
│   node.metadata.source_name = "tag"                           │
│                                                                 │
│   // DON'T set is_dynamic_component  ✅                        │
│   // DON'T capitalize  ✅                                      │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ PHASE 3: TRANSFORM (TypeScript mode)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Identifier Transform                                            │
├─────────────────────────────────────────────────────────────────┤
│ Identifier("tag") {                                            │
│   if (node.tracked) {                                          │
│     // Access tracked value directly without capitalizing     │
│     return MemberExpression {                                  │
│       object: Identifier("tag"),  ✅ Original case!           │
│       property: Literal("#v"),                                │
│       computed: true                                           │
│     }                                                          │
│   }                                                            │
│ }                                                              │
│                                                                 │
│ VariableDeclaration Transform                                  │
│ - "let tag" → "let tag"  ✅ Keep original!                    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ TypeScript Output (FIXED)                                       │
├─────────────────────────────────────────────────────────────────┤
│ function Example() {                                            │
│   let tag = _$_.tracked('div', __block);                      │
│   <tag['#v'] class="test">Content</tag['#v']>                 │
│ }                                                               │
│                                                                 │
│ ✅ "tag" is lowercase - TypeScript sees it as element type!    │
│ ✅ tag['#v'] resolves to string 'div' at runtime               │
│ ✅ TypeScript allows standard HTML attributes!                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Differences

### Current (Broken)
- ❌ Capitalizes variable name: `tag` → `Tag`
- ❌ TypeScript interprets `Tag` as a component type
- ❌ Component types don't accept HTML element attributes
- ❌ Result: Type errors for valid HTML attributes

### Proposed (Fixed)
- ✅ Keeps original variable name: `tag` stays `tag`
- ✅ TypeScript interprets `tag['#v']` as dynamic element type
- ✅ Dynamic element types accept standard HTML attributes
- ✅ Result: No type errors, attributes work correctly

## Side-by-Side Comparison

```typescript
// CURRENT TRANSFORM (Broken)
let Tag = _$_.tracked('div', __block);
<Tag['#v'] class="test">Content</Tag['#v']>
//  ^
//  └── TypeScript sees this as Component<unknown>
//      and rejects 'class' attribute

// PROPOSED TRANSFORM (Fixed)
let tag = _$_.tracked('div', __block);
<tag['#v'] class="test">Content</tag['#v']>
//  ^
//  └── TypeScript sees this as dynamic element
//      and allows HTML attributes
```

## Implementation Changes

### Files to Modify

1. **`packages/ripple/src/compiler/phases/2-analyze/index.js`**
   - Lines 874-892: Remove capitalization logic
   - Remove `is_dynamic_component` metadata

2. **`packages/ripple/src/compiler/phases/3-transform/client/index.js`**
   - Lines 404-423: Remove capitalization in Identifier transform
   - Lines 850-860: Remove capitalization in pattern matching
   - Lines 2611-2627: Remove `is_capitalized` metadata

### Code Changes

#### Before (Lines 404-423)
```javascript
if (binding?.metadata?.is_dynamic_component) {
  const capitalized_name = node.name.charAt(0).toUpperCase() + node.name.slice(1);
  const capitalized_node = { ...node, name: capitalized_name };
  return b.member(capitalized_node, b.literal('#v'), ...);
}
```

#### After
```javascript
// Simply access the tracked value without capitalization
if (node.tracked) {
  return b.member(node, b.literal('#v'), ...);
}
```

## Why This Works

### JSX Element Naming Convention
- **Lowercase** = intrinsic element (HTML tag)
- **Uppercase** = Component

When we use `tag['#v']`, TypeScript sees:
1. `tag` (lowercase) → could be an element type
2. `['#v']` → accessing a property (the tracked value)
3. Combined → dynamic element reference that accepts HTML attributes

### Runtime Behavior
At runtime:
```javascript
let tag = { '#v': 'div' };  // Tracked value
tag['#v']  // Returns: 'div'

// JSX transform uses this:
createElement(tag['#v'], { class: "test" }, "Content")
// Equivalent to:
createElement('div', { class: "test" }, "Content")
```

## Edge Cases Handled

### 1. Dynamic Components (Uppercase in source)
```ripple
let Button = @SomeButton;
<@Button label="Click" />  // Still works - uppercase signals component
```

### 2. Member Expressions
```ripple
let obj = { tag: @'div' };
<@obj.tag class="test">Content</@obj.tag>  // Works with new approach
```

### 3. Mixed Usage
```ripple
let tag = @'div';
<@tag>Element usage</@tag>      // HTML element attributes allowed
tag = SomeComponent;              // Can also be a component
<@tag prop="value" />             // Component props allowed
```

## Benefits of This Approach

1. ✅ **Simpler Code**: No capitalization logic needed
2. ✅ **Correct TypeScript Types**: Lowercase = element, uppercase = component
3. ✅ **Better IntelliSense**: HTML attributes auto-complete correctly
4. ✅ **Aligns with Future Plans**: Comment mentions moving away from capitalization
5. ✅ **Less Metadata**: Remove `is_dynamic_component`, `is_capitalized`, etc.
6. ✅ **Consistent with JSX Standards**: Follows standard JSX naming conventions
