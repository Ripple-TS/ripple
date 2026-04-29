# @tsrx/mcp

MCP server for TSRX language documentation and project context.

## Usage

Run the server over stdio:

```bash
npx -y @tsrx/mcp
```

For local development in this monorepo:

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
