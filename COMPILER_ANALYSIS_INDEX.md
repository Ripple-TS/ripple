# Ripple Compiler Analysis - Documentation Index

This directory contains comprehensive documentation about the Ripple compiler's handling of tracked values and classes.

---

## 📚 Documentation Files

### 1. **Start Here** → [COMPILER_FINDINGS_SUMMARY.md](./COMPILER_FINDINGS_SUMMARY.md)
   **~250 lines | Executive summary**
   
   Quick overview of key findings:
   - ✅ How tracked values work (@ syntax vs track())
   - ❌ Why classes aren't specially handled
   - 📋 Correct patterns for classes and components
   - 🔍 Transformation examples
   - ❓ Quick FAQ
   
   **Best for**: Getting up to speed quickly, understanding the "why" behind design decisions

---

### 2. **Visual Learner** → [COMPILER_FLOW_DIAGRAM.md](./COMPILER_FLOW_DIAGRAM.md)
   **~500 lines | ASCII diagrams and flow charts**
   
   Visual representations of:
   - 📊 Compiler pipeline (Parse → Analyze → Transform)
   - 🔄 Example transformations with AST at each stage
   - 🚦 Syntax reference card (what works, what doesn't)
   - 🗺️ File location map
   - 📦 Class handling flow
   
   **Best for**: Understanding the data flow, seeing concrete examples

---

### 3. **Deep Dive** → [COMPILER_TRACKED_VALUES_ANALYSIS.md](./COMPILER_TRACKED_VALUES_ANALYSIS.md)
   **~1000 lines | Complete technical documentation**
   
   Comprehensive analysis covering:
   - 🏗️ Compiler architecture overview
   - 🔍 Parse phase: How @ syntax is tokenized (lines 726-844)
   - 🧮 Analysis phase: Scope creation and tracking detection
   - 🔄 Transform phase: AST → Runtime calls
   - 🏛️ Class handling (or lack thereof)
   - 🧪 Test file locations and examples
   - 🚫 Current limitations
   - ✅ Correct patterns with real code from runtime
   
   **Best for**: Understanding implementation details, contributing to compiler

---

## 🗺️ Navigation Guide

### If you want to understand...

#### **"How does @ syntax work?"**
→ Start with **COMPILER_FINDINGS_SUMMARY.md** (Section: "How @ Syntax is Parsed")  
→ Then see **COMPILER_FLOW_DIAGRAM.md** (Section: "PHASE 1: PARSE")  
→ Deep dive: **COMPILER_TRACKED_VALUES_ANALYSIS.md** (Section: "How @ Syntax Works")

#### **"Why can't I use @0 or this.count = @5?"**
→ Quick answer: **COMPILER_FINDINGS_SUMMARY.md** (Section: "What Doesn't Work")  
→ Visual: **COMPILER_FLOW_DIAGRAM.md** (Section: "Quick Reference Card")  
→ Full explanation: **COMPILER_TRACKED_VALUES_ANALYSIS.md** (Section: "Current Limitations")

#### **"How do I make tracked values in classes?"**
→ Quick pattern: **COMPILER_FINDINGS_SUMMARY.md** (Section: "Correct Patterns for Classes")  
→ Visual: **COMPILER_FLOW_DIAGRAM.md** (Section: "WORKING CLASS PATTERN")  
→ Real examples: **COMPILER_TRACKED_VALUES_ANALYSIS.md** (Section: "Real-World Examples")

#### **"What files do I need to change to add class support?"**
→ **COMPILER_TRACKED_VALUES_ANALYSIS.md** (Section: "Where to Add Class Support")  
→ **COMPILER_FLOW_DIAGRAM.md** (Section: "Key Files Reference")

#### **"How does track() become track(..., __block)?"**
→ **COMPILER_FLOW_DIAGRAM.md** (Section: "Compiler Pipeline" → Transform step)  
→ **COMPILER_TRACKED_VALUES_ANALYSIS.md** (Section: "track() Call Transform")

---

## 📂 Key Source Files

Based on this analysis, here are the most important compiler files:

### Parser (Phase 1)
```
packages/ripple/src/compiler/phases/1-parse/index.js (3,184 lines)
  ├─ Lines 726-793:  getTokenFromCode() - Recognizes @ character
  ├─ Lines 800-829:  readAtIdentifier() - Reads @identifier tokens
  └─ Lines 835-844:  parseIdent() - Marks identifiers as tracked
```

### Analyzer (Phase 2)
```
packages/ripple/src/compiler/phases/2-analyze/index.js
  ├─ Lines 75-89:    visit_function() - Marks functions as tracked
  ├─ Lines 619-670:  Identifier visitor - Detects @ references
  └─ Lines 1014-1076: CallExpression visitor - Detects track() calls
```

### Transformer (Phase 3)
```
packages/ripple/src/compiler/phases/3-transform/client/index.js (4,267 lines)
  ├─ Lines 395-460:  Identifier - Converts @ to _$_.get()
  ├─ Lines 519-596:  CallExpression - Adds __block to track()
  ├─ Lines 1712-1834: MemberExpression - Handles @obj.prop
  └─ Lines 1849-1907: AssignmentExpression - Converts to _$_.set()
```

### Utilities
```
packages/ripple/src/compiler/utils.js
  └─ Lines 282-295: is_ripple_track_call() - Identifies track() calls
```

### Runtime APIs
```
packages/ripple/src/runtime/internal/client/
  ├─ runtime.js: safe_scope(), push_component(), pop_component()
  ├─ reactivity.js: tracked(), derived()
  └─ signals.js: get(), set()
```

### Real-World Examples
```
packages/ripple/src/runtime/
  ├─ url.js: TrackedURL class (120 lines)
  └─ date.js: TrackedDate class (50 lines)
```

### Tests
```
packages/ripple/tests/hydration/
  ├─ reactivity.test.js - Test suite
  └─ compiled/client/reactivity.js - Compiled output examples
```

---

## 🎯 Quick Answers

### ✅ What Works

```javascript
// In components:
let count = track(0);
@count++;
{@count}

// In classes:
class Counter {
    #block = safe_scope();
    #count = tracked(0, this.#block);
    
    get count() { return get(this.#count); }
    set count(val) { this.#count(val); }
}
```

### ❌ What Doesn't Work

```javascript
// These are all INVALID:
let x = @0;                    // @ is for reading, not creating
this.count = @5;               // @ is for reading, not creating
class { count = @0; }          // No class support for @
```

---

## 🔄 Transformation Flow

```
Source Code (@count)
      ↓
Parse: Identifier { name: 'count', tracked: true }
      ↓
Analyze: Marks function.metadata.tracked = true
      ↓
Transform: _$_.get(count)
      ↓
Runtime: Reads signal, tracks dependency
```

---

## 🛠️ Contributing to Compiler

If you want to add features or fix bugs:

1. **Read**: All three documents (start with SUMMARY)
2. **Explore**: Check the source files listed above
3. **Test**: Run tests in `packages/ripple/tests/hydration/`
4. **Modify**: Make changes to parser, analyzer, or transformer
5. **Validate**: Run `pnpm test` and check compiled output

### Adding Class Support Would Require:

1. **Parser** (`1-parse/index.js`):
   - Allow `@literal` syntax (currently only `@identifier`)
   - Create new AST node types if needed

2. **Analyzer** (`2-analyze/index.js`):
   - Add `ClassDeclaration` visitor
   - Add `MethodDefinition` visitor (for constructors)
   - Detect tracked field initializers

3. **Transformer** (`3-transform/client/index.js`):
   - Transform `this.prop = @value` → `this.prop = tracked(value, this.#block)`
   - Inject `#block = safe_scope()` into class body
   - Handle constructor body transformations

---

## 📝 Document Comparison

| Feature | SUMMARY | FLOW | ANALYSIS |
|---------|---------|------|----------|
| Length | ~250 lines | ~500 lines | ~1000 lines |
| Detail Level | High-level | Medium | Deep technical |
| Code Examples | Many | Many | Most |
| Visualizations | Few | Many | Some |
| Implementation | Concepts | Flow charts | Line numbers |
| Best For | Quick learning | Visual thinkers | Contributors |
| Read Time | 10 minutes | 20 minutes | 45 minutes |

---

## 🎓 Recommended Reading Order

### For Quick Understanding (15 minutes):
1. Read **COMPILER_FINDINGS_SUMMARY.md** sections:
   - Key Findings
   - Correct Patterns
   - Quick FAQ

### For Implementation (30 minutes):
1. Read **COMPILER_FINDINGS_SUMMARY.md** (all)
2. Skim **COMPILER_FLOW_DIAGRAM.md** (focus on diagrams)
3. Reference **COMPILER_TRACKED_VALUES_ANALYSIS.md** as needed

### For Compiler Development (1 hour):
1. Read **COMPILER_FINDINGS_SUMMARY.md** (overview)
2. Read **COMPILER_FLOW_DIAGRAM.md** (understand flow)
3. Read **COMPILER_TRACKED_VALUES_ANALYSIS.md** (all sections)
4. Explore source files with line numbers provided

---

## 🔗 External Resources

- **Main Project Docs**: [`AGENTS.md`](./AGENTS.md)
- **Ripple Documentation**: [`website/public/llms.txt`](./website/public/llms.txt)
- **Contributing Guide**: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## 📊 Statistics

- **Total Documentation**: ~1,750 lines
- **Code Examples**: 50+
- **Diagrams**: 10+
- **File References**: 15+
- **Test Cases Referenced**: 10+

---

## ❓ Getting Help

If after reading these docs you still have questions:

1. Check the **Quick FAQ** in COMPILER_FINDINGS_SUMMARY.md
2. Search for your topic in COMPILER_TRACKED_VALUES_ANALYSIS.md
3. Look at real examples in `runtime/url.js` and `runtime/date.js`
4. Check test files in `packages/ripple/tests/hydration/`

---

**Last Updated**: February 17, 2024  
**Compiler Version**: Latest (main branch)  
**Analysis Completeness**: ✅ Full (all 3 phases + runtime)
