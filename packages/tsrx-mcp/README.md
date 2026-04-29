# @tsrx/mcp

MCP server for TSRX language documentation and project context.

## Usage

Run the server over stdio:

```bash
npx -y @tsrx/mcp
```

Generic MCP client config:

```json
{
  "mcpServers": {
    "tsrx": {
      "command": "npx",
      "args": ["-y", "@tsrx/mcp"]
    }
  }
}
```

For local development in this monorepo, point at the source entrypoint:

```json
{
  "mcpServers": {
    "tsrx": {
      "command": "node",
      "args": ["/absolute/path/to/ripple/packages/tsrx-mcp/src/stdio.js"]
    }
  }
}
```

### Claude Desktop

Add the generic config above to `claude_desktop_config.json`.

### Claude Code

```bash
claude mcp add tsrx -- npx -y @tsrx/mcp
```

For local development:

```bash
claude mcp add tsrx-local -- node /absolute/path/to/ripple/packages/tsrx-mcp/src/stdio.js
```

### Cursor

Add the generic config above to your Cursor MCP settings.

### Codex

Add the generic config above to your Codex MCP configuration.

## Tools

- `list-sections` - list target-neutral TSRX documentation sections.
- `get-documentation` - fetch one or more TSRX documentation sections.
- `detect-target` - infer the active TSRX runtime target from project files.
- `compile-tsrx` - compile TSRX code with the inferred or explicit target compiler
  and return diagnostics.

## Resources

- `tsrx://docs/{slug}.md` - target-neutral TSRX documentation sections.
- `tsrx://targets/{target}.md` - handoff guidance for target-specific layers.

## Prompts

- `tsrx-task` - target-aware workflow for TSRX coding tasks.

The core server stays target-neutral. Runtime-specific imports, bundler setup, and
framework semantics should live in target-specific skills, prompts, or resources
layered on top.
