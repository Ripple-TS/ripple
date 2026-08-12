# Zed Extension Development Guide

## Building the Extension

1. **Install Rust toolchain** with WebAssembly target:

   ```bash
   rustup target add wasm32-wasip1
   ```

2. **Build the extension**:

   ```bash
   cargo build --target wasm32-wasip1 --release
   ```

3. **Install as dev extension** in Zed:
   - Open Zed
   - Press `Cmd/Ctrl + Shift + P`
   - Run "zed: install dev extension"
   - Select this directory (`packages/zed-plugin`)

## Testing

1. Open a `.tsrx` file in Zed
2. Verify:
   - Syntax highlighting works
   - Language server connects (check status bar)
   - Code completion works
   - Outline view shows components/functions

## File Structure

```
zed-plugin/
├── extension.toml           # Extension metadata and configuration
├── Cargo.toml              # Rust dependencies
├── src/
│   └── lib.rs              # Language server integration logic
├── languages/
│   └── tsrx/
│       ├── config.toml     # Language configuration
│       ├── highlights.scm  # Syntax highlighting queries
│       ├── brackets.scm    # Bracket matching
│       ├── outline.scm     # Code structure/outline
│       ├── folds.scm       # Code folding
│       └── injections.scm  # Language injections
├── LICENSE                 # MIT License
├── README.md              # User documentation
└── .gitignore             # Git ignore rules
```

## Publishing to Zed Extensions Registry

Add a patch changeset for `@ripple-ts/zed-plugin` when a change should reach the
Zed extension registry:

```bash
pnpm changeset
```

The Changesets release PR bumps `package.json` and synchronizes both the version
and grammar revision in `extension.toml`. When that release PR is merged, the
publish workflow creates an `@ripple-ts/zed-plugin@<version>` tag and opens the
registry update PR through the
[`leonidaz/extensions`](https://github.com/leonidaz/extensions) fork. The
extension is published after the Zed registry maintainers merge that PR.

The workflow requires a `ZED_EXTENSION_TOKEN` Actions secret containing a classic
GitHub personal access token owned by `leonidaz` with `repo` and `workflow`
scopes.

## Updating the Extension

### After Grammar Changes

If you update the tree-sitter grammar in `grammars/tree-sitter`:

1. Update query files in `languages/tsrx/` if needed
2. Commit the generated tree-sitter grammar artifacts
3. Test locally
4. Add a patch changeset for `@ripple-ts/zed-plugin`; the Changesets release PR
   updates the `rev` field in `extension.toml`

### After Language Server Changes

The extension just launches the language server binary - no changes needed to the
extension itself unless:

- Binary name changes
- Command-line arguments change
- Installation method changes

## Troubleshooting

### Language server not found

Make sure `@ripple-ts/language-server` is installed:

```bash
npm install -g @ripple-ts/language-server
```

Or in your project:

```bash
npm install --save-dev @ripple-ts/language-server
```

### Syntax highlighting not working

1. Check that tree-sitter grammar compiled successfully
2. Verify query files are valid (no syntax errors)
3. Check Zed logs: `Cmd/Ctrl + Shift + P` → "zed: open log"

### Extension won't build

1. Ensure Rust toolchain is installed: `rustc --version`
2. Ensure wasm32-wasip1 target is installed: `rustup target list --installed`
3. Check Cargo.toml has correct `zed_extension_api` version

## Resources

- [Zed Extensions Docs](https://zed.dev/docs/extensions)
- [Language Extensions Guide](https://zed.dev/docs/extensions/languages)
- [Extension API Reference](https://docs.rs/zed_extension_api/latest/)
- [Tree-sitter Query Documentation](https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries)
