# Implementation Guide: Fix Dynamic Element Attributes

## Quick Summary

**Problem:** `<@tag class="test" />` causes TypeScript errors because `tag` gets capitalized to `Tag`, making TypeScript think it's a component instead of an element.

**Solution:** Stop capitalizing tracked identifiers. Keep them lowercase so TypeScript correctly treats them as dynamic elements.

**Impact:** 2 files, ~50 lines changed/removed

---

## Step-by-Step Implementation

### Step 1: Modify the Transform Phase Identifier Visitor

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`

**Location:** Lines 395-434

**Current Code:**
```javascript
Identifier(node, context) {
	const parent = /** @type {AST.Node} */ (context.path.at(-1));

	if (is_reference(node, parent)) {
		if (context.state.to_ts) {
			if (node.tracked) {
				// Check if this identifier is used as a dynamic component/element
				// by checking if it has a capitalized name in metadata
				const binding = context.state.scope.get(node.name);
				if (binding?.metadata?.is_dynamic_component) {
					// Capitalize the identifier for TypeScript
					const capitalized_name = node.name.charAt(0).toUpperCase() + node.name.slice(1);
					const capitalized_node = {
						...node,
						name: capitalized_name,
						metadata: {
							...node.metadata,
							is_capitalized: true,
						},
					};
					const member = b.member(
						capitalized_node,
						b.literal('#v'),
						true,
						!is_inside_left_side_assignment(node),
						/** @type {AST.NodeWithLocation} */ (node),
					);
					member.tracked = true;
					return member;
				}
				const member = b.member(
					node,
					b.literal('#v'),
					true,
					!is_inside_left_side_assignment(node),
					/** @type {AST.NodeWithLocation} */ (node),
				);
				member.tracked = true;
				return member;
			}
		}
		// ... rest of code
	}
}
```

**Replace With:**
```javascript
Identifier(node, context) {
	const parent = /** @type {AST.Node} */ (context.path.at(-1));

	if (is_reference(node, parent)) {
		if (context.state.to_ts) {
			if (node.tracked) {
				// Access tracked value directly without capitalization
				const member = b.member(
					node,  // Keep original name (lowercase or uppercase)
					b.literal('#v'),
					true,
					!is_inside_left_side_assignment(node),
					/** @type {AST.NodeWithLocation} */ (node),
				);
				member.tracked = true;
				return member;
			}
		}
		// ... rest of code
	}
}
```

**Changes:**
- ❌ Remove `binding?.metadata?.is_dynamic_component` check
- ❌ Remove `capitalized_name` creation
- ❌ Remove `capitalized_node` creation
- ✅ Always use original `node` (not capitalized)

---

### Step 2: Remove Pattern Capitalization

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`

**Location:** Lines 820-910 (within VariableDeclaration visitor)

**Find this code:**
```javascript
VariableDeclaration(node, context) {
	// ... other code ...

	// Capitalize identifiers in patterns for dynamic components
	const capitalize_pattern = (pattern) => {
		if (pattern.type === 'Identifier') {
			const binding = context.state.scope.get(pattern.name);
			if (binding?.metadata?.is_dynamic_component) {
				const capitalized_name = pattern.name.charAt(0).toUpperCase() + pattern.name.slice(1);
				// Add metadata to track the original name for Volar mappings
				return {
					...pattern,
					name: capitalized_name,
					metadata: {
						...pattern.metadata,
						is_capitalized: true,
					},
				};
			}
		} else if (pattern.type === 'ArrayPattern') {
			// ... handle array patterns ...
		} else if (pattern.type === 'ObjectPattern') {
			// ... handle object patterns ...
		} else if (pattern.type === 'AssignmentPattern') {
			// ... handle assignment patterns ...
		}
		return pattern;
	};

	// Apply capitalization to declarators
	const declarations = node.declarations.map((declarator) => ({
		...declarator,
		id: capitalize_pattern(declarator.id),
	}));

	// ... rest of code uses 'declarations' ...
}
```

**Replace With:**
```javascript
VariableDeclaration(node, context) {
	// ... other code ...

	// No need to capitalize patterns anymore
	// Use original declarations as-is
	const declarations = node.declarations;

	// ... rest of code uses 'declarations' ...
}
```

**Changes:**
- ❌ Remove entire `capitalize_pattern` function
- ❌ Remove pattern transformation
- ✅ Use `node.declarations` directly

---

### Step 3: Remove JSXElement Capitalization Metadata

**File:** `packages/ripple/src/compiler/phases/3-transform/client/index.js`

**Location:** Lines 2611-2627 (within Element visitor)

**Find this code:**
```javascript
Element(node, context) {
	// ... transform attributes and children ...

	if (/** @type {AST.Node} */ (node.id).type !== 'MemberExpression' && node.id.tracked) {
		// This is just temporary until we remove capitalization
		// The `is_capitalized` was never handled for MemberExpression
		// but it should've been for the `object` part because it starts the tag
		// But the plan is to only rely on source_name and creating a const for the tag with ['#v']
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

	// ... rest of code ...
}
```

**Replace With:**
```javascript
Element(node, context) {
	// ... transform attributes and children ...

	// No need to mark for capitalization anymore
	// The element name stays as-is

	// ... rest of code ...
}
```

**Changes:**
- ❌ Remove entire `if (node.id.tracked)` block
- ✅ Element names stay unchanged

---

### Step 4: Simplify Analysis Phase

**File:** `packages/ripple/src/compiler/phases/2-analyze/index.js`

**Location:** Lines 874-901 (within Element visitor)

**Current Code:**
```javascript
Element(node, context) {
	// ...
	validate_nesting(node, context);

	// Store capitalized name for dynamic components/elements
	// TODO: this is not quite right as the node.id could be a member expression
	// so, we'd need to identify dynamic based on that too
	// However, we're going to get rid of capitalization in favor of jsx()
	// so, this will be need to be redone.
	if (node.id.type === 'Identifier' && node.id.tracked) {
		const source_name = node.id.name;
		const capitalized_name = source_name.charAt(0).toUpperCase() + source_name.slice(1);
		node.metadata.ts_name = capitalized_name;
		node.metadata.source_name = source_name;

		// Mark the binding as a dynamic component so we can capitalize it everywhere
		const binding = context.state.scope.get(source_name);
		if (binding) {
			if (!binding.metadata) {
				binding.metadata = {};
			}
			binding.metadata.is_dynamic_component = true;
		}

		if (!is_dom_element && state.elements) {
			state.elements.push(node);
			// Mark dynamic elements as scoped by default since we can't match CSS at compile time
			if (state.component?.css) {
				node.metadata.scoped = true;
			}
		}
	}

	if (is_dom_element) {
		// ... rest of code ...
	}
}
```

**Replace With:**
```javascript
Element(node, context) {
	// ...
	validate_nesting(node, context);

	// Store source name for reference only
	if (node.id.type === 'Identifier' && node.id.tracked) {
		const source_name = node.id.name;
		node.metadata.source_name = source_name;

		// Don't mark as is_dynamic_component anymore
		// Don't create capitalized_name

		if (!is_dom_element && state.elements) {
			state.elements.push(node);
			// Mark dynamic elements as scoped by default since we can't match CSS at compile time
			if (state.component?.css) {
				node.metadata.scoped = true;
			}
		}
	}

	if (is_dom_element) {
		// ... rest of code ...
	}
}
```

**Changes:**
- ❌ Remove `capitalized_name` creation
- ❌ Remove `ts_name` metadata
- ❌ Remove `is_dynamic_component` binding metadata
- ✅ Keep `source_name` for reference
- ✅ Keep CSS scoping logic for dynamic elements

---

## Verification Steps

### 1. Build the Compiler

```bash
cd packages/ripple
pnpm build
```

### 2. Create Test File

Create `test-dynamic-element.ripple`:

```ripple
component TestDynamic() {
  // Test 1: Dynamic element with attributes
  let tag = @'div';
  <@tag class="test" id="myDiv" style="color: red">
    Dynamic Element Content
  </@tag>

  // Test 2: Dynamic component
  let Button = @SomeButton;
  <@Button label="Click Me" onClick={() => console.log('clicked')} />

  // Test 3: Change dynamically
  let dynamic = @'span';
  <@dynamic class="first">Span</@dynamic>
  
  {
    dynamic = 'p';
  }
  <@dynamic class="second">Paragraph</@dynamic>
}

component SomeButton(label: string, onClick: () => void) {
  <button onclick={onClick}>{label}</button>
}
```

### 3. Compile and Check Output

```bash
# Compile to TypeScript
pnpm ripple compile test-dynamic-element.ripple --to-ts

# Expected output should have:
# - let tag = _$_.tracked('div', __block)  // lowercase 'tag'
# - <tag['#v'] class="test" ...>            // lowercase in JSX
# - let Button = _$_.tracked(...)           // uppercase 'Button' (from source)
# - <Button['#v'] label="Click Me" ...>     // uppercase in JSX
```

### 4. Check TypeScript Errors

```bash
# Run TypeScript compiler on output
npx tsc test-dynamic-element.tsx --noEmit --jsx react

# Should have NO errors about:
# - Property 'class' does not exist
# - Property 'id' does not exist
# - Property 'style' does not exist
```

---

## Expected Output Comparison

### Input
```ripple
let tag = @'div';
<@tag class="test">Content</@tag>
```

### BEFORE (Broken)
```typescript
let Tag = _$_.tracked('div', __block);
<Tag['#v'] class="test">Content</Tag['#v']>
```
- ❌ Variable name capitalized: `Tag`
- ❌ TypeScript error on `class` attribute

### AFTER (Fixed)
```typescript
let tag = _$_.tracked('div', __block);
<tag['#v'] class="test">Content</tag['#v']>
```
- ✅ Variable name lowercase: `tag`
- ✅ No TypeScript errors

---

## Edge Cases to Test

### 1. Member Expressions
```ripple
let config = { tag: @'div' };
<@config.tag class="test">Content</@config.tag>
```

Expected: Should work without changes (member expressions weren't capitalized anyway)

### 2. Component with Uppercase Name (from source)
```ripple
let Button = @SomeButton;
<@Button label="Click" />
```

Expected: Should work - source already uppercase, stays uppercase

### 3. Mixed Case Usage
```ripple
let MyTag = @'div';
<@MyTag class="test">Content</@MyTag>
```

Expected: Should work - source uppercase, stays uppercase

### 4. Switching Between Element and Component
```ripple
let dynamic = @'div';
<@dynamic class="html">Element</@dynamic>

dynamic = Button;
<@dynamic label="component">Component</@dynamic>
```

Expected: Should work with union types at runtime

---

## Rollback Plan

If issues arise, the changes are localized to 2 files:

1. Revert `packages/ripple/src/compiler/phases/2-analyze/index.js` (lines 874-901)
2. Revert `packages/ripple/src/compiler/phases/3-transform/client/index.js` (lines 395-434, 820-910, 2611-2627)

---

## Additional Notes

### Why This Works

JSX/TSX follows a simple convention:
- **Lowercase** first letter = intrinsic element (HTML tag)
- **Uppercase** first letter = component

When we use `tag['#v']`:
- `tag` is lowercase → potential element type
- `['#v']` accesses the tracked value
- TypeScript allows element attributes on lowercase names

When we use `Button['#v']`:
- `Button` is uppercase → component type
- `['#v']` accesses the tracked component
- TypeScript allows component props on uppercase names

### No TypeScript Type Changes Needed?

Try implementing without type changes first. The expression `tag['#v']` where `tag` has type `{ '#v': string }` should be handled by TypeScript's existing JSX typing.

If TypeScript still complains, we can add:
```typescript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}
```

But test first!

---

## Summary

**Changes Required:**
1. ✅ Remove capitalization in Identifier visitor
2. ✅ Remove capitalize_pattern function
3. ✅ Remove JSXElement is_capitalized metadata
4. ✅ Remove is_dynamic_component binding metadata

**Files Modified:**
1. `packages/ripple/src/compiler/phases/2-analyze/index.js`
2. `packages/ripple/src/compiler/phases/3-transform/client/index.js`

**Lines Changed:** ~50 lines (mostly deletions)

**Risk Level:** Low (removes complexity, aligns with JSX conventions)

**Testing:** Compile example files, check for TypeScript errors

**Rollback:** Simple git revert of 2 files
