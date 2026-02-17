# 📚 Ripple Compiler Documentation

> Comprehensive analysis of how Ripple handles tracked values and classes

## 🚀 Quick Start

**Start here**: [`COMPILER_ANALYSIS_INDEX.md`](./COMPILER_ANALYSIS_INDEX.md)

This index will guide you to the right document based on what you want to learn.

---

## 📖 Available Documents

| Document | Size | Purpose | Read Time |
|----------|------|---------|-----------|
| **[INDEX](./COMPILER_ANALYSIS_INDEX.md)** | 283 lines | Navigation & overview | 5 min |
| **[SUMMARY](./COMPILER_FINDINGS_SUMMARY.md)** | 399 lines | Executive summary | 10 min |
| **[FLOW](./COMPILER_FLOW_DIAGRAM.md)** | 346 lines | Visual diagrams | 20 min |
| **[ANALYSIS](./COMPILER_TRACKED_VALUES_ANALYSIS.md)** | 769 lines | Deep technical docs | 45 min |

**Total**: 1,797 lines of documentation

---

## 🎯 What You'll Learn

### Key Questions Answered:

1. ✅ **How does the @ syntax work?**
   - Parse → Analyze → Transform pipeline
   - Why `@identifier` reads values
   - Why `@literal` doesn't work

2. ✅ **How are tracked values created?**
   - `track()` function in components
   - `tracked()` function in classes
   - Automatic `__block` injection

3. ❌ **Why don't classes have special handling?**
   - No ClassDeclaration visitor in analyzer
   - No transform logic for constructors
   - Manual `safe_scope()` required

4. ✅ **What are the correct patterns?**
   - Component pattern with `track()`
   - Class pattern with `tracked()` and `safe_scope()`
   - Real examples from `TrackedURL` and `TrackedDate`

---

## 🗺️ Quick Navigation

### I want to...

**Understand the basics** → [`COMPILER_FINDINGS_SUMMARY.md`](./COMPILER_FINDINGS_SUMMARY.md)  
Start here for key findings and correct patterns.

**See visual diagrams** → [`COMPILER_FLOW_DIAGRAM.md`](./COMPILER_FLOW_DIAGRAM.md)  
Great for understanding data flow and transformations.

**Learn implementation details** → [`COMPILER_TRACKED_VALUES_ANALYSIS.md`](./COMPILER_TRACKED_VALUES_ANALYSIS.md)  
Complete technical documentation with line numbers.

**Find specific information** → [`COMPILER_ANALYSIS_INDEX.md`](./COMPILER_ANALYSIS_INDEX.md)  
Use the navigation guide to find exactly what you need.

---

## 📊 Key Findings Summary

### ✅ What Works

```javascript
// Components
component Counter() {
    let count = track(0);
    @count++;
    <div>{@count}</div>
}

// Classes
class Counter {
    #block = safe_scope();
    #count = tracked(0, this.#block);
    get count() { return get(this.#count); }
    set count(val) { this.#count(val); }
}
```

### ❌ What Doesn't Work

```javascript
let x = @0;              // ❌ @ is for reading, not creating
this.count = @5;         // ❌ @ is for reading, not creating
class { count = @0; }    // ❌ No class support for @
```

---

## 🔍 Key Source Files

All findings reference specific line numbers in:

- **Parser**: `packages/ripple/src/compiler/phases/1-parse/index.js` (3,184 lines)
- **Analyzer**: `packages/ripple/src/compiler/phases/2-analyze/index.js`
- **Transformer**: `packages/ripple/src/compiler/phases/3-transform/client/index.js` (4,267 lines)
- **Utils**: `packages/ripple/src/compiler/utils.js`

Plus runtime examples from:
- `packages/ripple/src/runtime/url.js` (TrackedURL)
- `packages/ripple/src/runtime/date.js` (TrackedDate)

---

## 🛠️ For Contributors

If you want to add class support or modify the compiler:

1. Read all documents (start with SUMMARY)
2. Check the specific line numbers provided
3. See "Where to Add Class Support" in ANALYSIS.md
4. Run tests: `pnpm test`

---

## 📈 Transformation Pipeline

```
Source Code
    ↓
Parse Phase (Recognize @ syntax)
    ↓
Analyze Phase (Mark tracked, validate scope)
    ↓
Transform Phase (Convert to runtime calls)
    ↓
Runtime (_$_.get, _$_.set, track)
```

---

## 🎓 Recommended Reading Path

### Quick (15 min)
1. [INDEX](./COMPILER_ANALYSIS_INDEX.md) - Overview
2. [SUMMARY](./COMPILER_FINDINGS_SUMMARY.md) - Key sections

### Medium (45 min)
1. [SUMMARY](./COMPILER_FINDINGS_SUMMARY.md) - Full read
2. [FLOW](./COMPILER_FLOW_DIAGRAM.md) - Visual learning
3. [ANALYSIS](./COMPILER_TRACKED_VALUES_ANALYSIS.md) - Reference as needed

### Deep (2 hours)
1. All documents in order
2. Source code exploration with line numbers
3. Run and examine tests

---

## 🔗 Related Documentation

- Main project guide: [`AGENTS.md`](./AGENTS.md)
- Full Ripple docs: [`website/public/llms.txt`](./website/public/llms.txt)
- Contributing: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## 📝 Document Overview

### COMPILER_ANALYSIS_INDEX.md
**Navigation hub** - Tells you which document to read based on your question.

### COMPILER_FINDINGS_SUMMARY.md
**Executive summary** - High-level findings, correct patterns, FAQ.

### COMPILER_FLOW_DIAGRAM.md
**Visual guide** - ASCII diagrams showing compiler pipeline and transformations.

### COMPILER_TRACKED_VALUES_ANALYSIS.md
**Technical reference** - Complete implementation details with line numbers.

---

## ❓ Quick FAQ

**Q: Where should I start?**  
A: Read [COMPILER_ANALYSIS_INDEX.md](./COMPILER_ANALYSIS_INDEX.md) first, it will guide you.

**Q: Can I use `@0` to create tracked values?**  
A: No. See "What Doesn't Work" in [SUMMARY](./COMPILER_FINDINGS_SUMMARY.md).

**Q: How do I use tracked values in classes?**  
A: See "Correct Patterns for Classes" in [SUMMARY](./COMPILER_FINDINGS_SUMMARY.md).

**Q: Where is the @ syntax parsed?**  
A: Lines 726-844 of `1-parse/index.js`. See [ANALYSIS](./COMPILER_TRACKED_VALUES_ANALYSIS.md).

**Q: Can I contribute class support?**  
A: Yes! See "Where to Add Class Support" in [ANALYSIS](./COMPILER_TRACKED_VALUES_ANALYSIS.md).

---

## 📊 Statistics

- 📄 **4 comprehensive documents**
- 📏 **1,797 total lines**
- 🔢 **50+ code examples**
- 📈 **10+ diagrams**
- 🔗 **15+ file references**
- ✅ **Complete coverage** of all 3 compiler phases + runtime

---

**Created**: February 17, 2024  
**Analysis Scope**: Complete (Parse, Analyze, Transform, Runtime)  
**Code Coverage**: All tracked value handling + class patterns
