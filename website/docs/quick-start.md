---
title: Quick Start
---

# Quick Start

## Try Ripple Online

You can try Ripple directly in your browser on
[StackBlitz](https://stackblitz.com/github/Ripple-TS/ripple/tree/main/templates/basic).

## Installation

### Using The <Badge type="warning" text="Experimental" /> `create-ripple` CLI

```sh
npm create ripple // [!=npm auto]
```

### Clone the Vite-based Basic Template:

```sh
npx degit Ripple-TS/ripple/templates/basic ripple-app // [!=npm auto]

cd ripple-app
npm i // [!=npm auto]
npm run dev // [!=npm auto]
```

## Editor Integration

### VS Code

The TSRX project maintains the Volar-based
[TSRX Syntax for VS Code](https://marketplace.visualstudio.com/items?itemName=TSRX.tsrx-vscode-plugin).

It provides syntax highlighting for `.tsrx` files by default, real-time
diagnostics for compilation errors, and typescript integration for type checking
and autocompletion.

If you're using a fork of VSCode, the extension is also available on
[Open VSX](https://open-vsx.org/extension/TSRX/tsrx-vscode-plugin).

### WebStorm/IntelliJ

There isn't a dedicated plugin at the moment, but you can use the
[TextMate bundle](#textmate-bundle) to add syntax highlighting and the language
server for diagnostics and autocompletion:

1. Install the TSRX language server:

```sh
npm install -g '@tsrx/language-server' // [!=npm auto]
```

2. Install the [LSP4IJ plugin](https://plugins.jetbrains.com/plugin/23257-lsp4ij).
3. Go to `Settings` > `Languages & Frameworks` > `Language Servers`.
4. Click `+` to add a new language server.
5. Specify `TSRX` as the name and `tsrx-language-server --stdio` as the command.
6. In the `Mappings` > `File name patterns`, click `+` to add a new pattern.
7. Specify `*.tsrx` as the pattern and `tsrx` as the language ID.

You should see diagnostics and autocompletion in `.tsrx` files now.

### Sublime Text

There isn't a dedicated plugin at the moment, but you can use the
[TextMate bundle](#textmate-bundle) to add syntax highlighting and the language
server for diagnostics and autocompletion:

1. Install the TSRX language server:

```sh
npm install -g '@tsrx/language-server' // [!=npm auto]
```

2. Press <kbd>Ctrl/Cmd+Shift+P</kbd>, type `Install Package Control`, and press
   <kbd>Enter</kbd>.
3. Restart Sublime Text.
4. Press <kbd>Ctrl/Cmd+Shift+P</kbd>, type `Upgrade Package`, and press
   <kbd>Enter</kbd>.
5. Type `Package Control` and press <kbd>Enter</kbd>.
6. Restart Sublime Text.
7. Press <kbd>Ctrl/Cmd+Shift+P</kbd>, type `Install Package`, and press
   <kbd>Enter</kbd>.
8. Type `LSP` and press <kbd>Enter</kbd>.
9. Restart Sublime Text.
10. Press <kbd>Ctrl/Cmd+Shift+P</kbd>, type `Preferences: LSP Settings`, and press
    <kbd>Enter</kbd>.
11. Paste the following configuration:

```json
{
  "clients": {
    "TSRX": {
      "enabled": true,
      "command": ["tsrx-language-server", "--stdio"],
      "selector": "source.tsrx"
    }
  }
}
```

You should see diagnostics and autocompletion in `.tsrx` files now.

### TextMate bundle

The TSRX project also maintains a TextMate bundle that provides syntax
highlighting for TSRX files in editors that support TextMate grammars, such as
WebStorm/IntelliJ and Sublime Text.

1. Create a directory named `TSRX.tmbundle`.
2. Create a directory named `Syntaxes` inside the `TSRX.tmbundle` directory.
3. Save the
   [`tsrx.tmLanguage`](https://github.com/tsrx-org/tsrx/blob/main/assets/TSRX.tmbundle/Syntaxes/tsrx.tmLanguage)
   file into the `Syntaxes` directory.
4. Install it:
   - **WebStorm/IntelliJ**:
     1. Save the
        [`info.plist`](https://github.com/tsrx-org/tsrx/blob/main/assets/TSRX.tmbundle/info.plist)
        file into the `TSRX.tmbundle` directory.
     2. Go to `Settings` > `Editor` > `TextMate Bundles`, click the `+` icon, and
        select the `TSRX.tmbundle` directory.
   3. All TSRX files should now have syntax highlighting.
   - **Sublime Text**:
     1. Go to `Preferences` > `Browse Packages`, and move the `TSRX.tmbundle`
        directory into the opened folder.
     2. You should now be able to select `TSRX` in `View` > `Syntax`.

## Getting Help

Try joining the [Discord server](https://discord.gg/JBF2ySrh2W), or asking for
help on our [discussions board](https://github.com/Ripple-TS/ripple/discussions).

## Next Steps

- Learn about reactivity/state management and caveats.
