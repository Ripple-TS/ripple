# Dynamic Element Attributes Fix - Executive Summary

## The Problem

Using dynamic element syntax `<@variable />` with tracked variables causes TypeScript to reject HTML attributes:

```ripple
let tag = @'div';
<@tag class="test">Content</@tag>
// Error: Property 'class' does not exist
```

## Root Cause

The compiler **capitalizes** tracked variable names used in JSX:
- Source: `let tag = @'div'`
- Output: `let Tag = _$_.tracked('div', __block)`

TypeScript interprets **capitalized names** as components, not elements, so it rejects HTML attributes like `class`, `id`, `style`, etc.

## The Solution

**Stop capitalizing tracked identifiers.** Keep them as-is:
- Source: `let tag = @'div'`
- Output: `let tag = _$_.tracked('div', __block)`

TypeScript interprets **lowercase names** as dynamic elements, allowing all HTML attributes.

## Why This Works

JSX naming convention:
- `<tag />` = lowercase = intrinsic element (HTML) → accepts HTML attributes
- `<Tag />` = uppercase = component → accepts component props

When we access the tracked value `tag['#v']`, TypeScript sees:
- `tag` (lowercase) → could be an element
- Allows HTML attributes like `class`, `id`, `style`

## Implementation Impact

### Files to Modify: 2

1. **`packages/ripple/src/compiler/phases/2-analyze/index.js`**
   - Remove `is_dynamic_component` metadata (lines 885-891)
   - Remove capitalized name creation (line 881)

2. **`packages/ripple/src/compiler/phases/3-transform/client/index.js`**
   - Remove capitalization in Identifier visitor (lines 404-423)
   - Remove capitalize_pattern function (lines 847-860)
   - Remove JSXElement capitalization metadata (lines 2611-2627)

### Code Changes: ~50 lines (mostly deletions)

Most changes are **removing** complexity, not adding it.

## Before vs. After

### Source Code (Same)
```ripple
let tag = @'div';
<@tag class="test" id="myDiv">Content</@tag>
```

### BEFORE (Broken Output)
```typescript
let Tag = _$_.tracked('div', __block);
<Tag['#v'] class="test" id="myDiv">Content</Tag['#v']>
     ^^^                                      ^^^
     Capitalized → TypeScript sees Component
     Components don't accept 'class' attribute
     ❌ Type Error!
```

### AFTER (Fixed Output)
```typescript
let tag = _$_.tracked('div', __block);
<tag['#v'] class="test" id="myDiv">Content</tag['#v']>
    ^^^                                     ^^^
    Lowercase → TypeScript sees element
    Elements accept HTML attributes
    ✅ No errors!
```

## Key Insights

1. **Capitalization was unnecessary** - The `['#v']` accessor already works without it
2. **JSX conventions matter** - TypeScript uses case to distinguish elements from components
3. **Simpler is better** - Removing logic fixes the bug
4. **Already planned** - Comment in code says "we're going to get rid of capitalization"

## Edge Cases Handled

✅ **Dynamic elements** - `let tag = @'div'` → lowercase → HTML attributes allowed  
✅ **Dynamic components** - `let Button = @SomeButton` → uppercase → component props allowed  
✅ **Member expressions** - `<@obj.tag>` → already worked, still works  
✅ **Mixed usage** - Same variable can hold element or component, types adjust at runtime

## Risk Assessment

**Risk Level:** Low

- Most changes are deletions
- Aligns with existing comment about removing capitalization
- Follows standard JSX conventions
- No runtime behavior changes
- TypeScript types become more accurate

## Testing Plan

1. Compile test files with dynamic elements
2. Check TypeScript errors are gone
3. Verify HTML attribute IntelliSense works
4. Test dynamic components still work
5. Test member expressions still work

## Documentation

Created 4 comprehensive documents:

1. **DYNAMIC_ELEMENTS_FIX.md** - Full technical explanation with code samples
2. **DYNAMIC_ELEMENTS_FLOW.md** - Visual diagrams of current vs. proposed flow
3. **DYNAMIC_ELEMENTS_QA.md** - Detailed answers to specific questions
4. **IMPLEMENTATION_GUIDE.md** - Step-by-step code changes with verification

## Next Steps

1. Review the implementation guide
2. Make the code changes (2 files, ~50 lines)
3. Run compiler build
4. Test with example files
5. Verify TypeScript errors are resolved
6. Update any related tests
7. Commit with reference to this documentation

## References

All implementation details, code samples, and reasoning are in the documentation files listed above.

---

**TL;DR:** Stop capitalizing tracked variable names in JSX. Use lowercase for elements (allows HTML attributes), uppercase for components (allows component props). Simple change, fixes TypeScript types, aligns with JSX standards.
