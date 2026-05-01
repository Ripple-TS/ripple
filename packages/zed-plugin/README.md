# TSRX Extension for Zed

This extension provides TSRX language support for the
[Zed editor](https://zed.dev). TSRX is a TypeScript superset that compiles to
Ripple, React, Solid, and Preact. Handles `.tsrx` files.

## Installation

### From Zed Extensions

Once published to the Zed extensions registry:

1. Open Zed
2. Press `Cmd/Ctrl + Shift + X` to open extensions
3. Search for "TSRX"
4. Click "Install"

### Development Installation

1. Clone this repository
2. Install Rust with the wasm32-wasip1 target:
   ```bash
   rustup target add wasm32-wasip1
   ```
3. Open Zed
4. Press `Cmd/Ctrl + Shift + P`
5. Run "zed: install dev extension"
6. Select the `packages/zed-plugin` directory

## Language Server Setup

The extension looks for the language server `@ripple-ts/language-server` in this
order:

1. The local project that you have opened in Zed via the `package.json` and looks
   for `node_modules/.bin/ripple-language-server`. So make sure to install your
   dependencies first via:

   ```bash
   npm install
   ```

2. Globally installed:

   ```bash
   npm install -g @ripple-ts/language-server
   ```

3. The extension automatically downloads the Ripple Language Server the first time
   it runs. The version is pinned via the `config` entry for
   `@ripple-ts/language-server` in this package's `package.json`.

Project-local installations (`node_modules/.bin/ripple-language-server`) are also
detected automatically.
