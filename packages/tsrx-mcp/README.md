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

## Hosted HTTP

Remote MCP clients need a hosted Streamable HTTP endpoint rather than a local
stdio command. This monorepo includes a deployment-neutral endpoint app in
`mcp-endpoint-website` that serves the same MCP server at `/mcp`.

The hosted endpoint runs in remote-safe mode. It exposes documentation, prompts,
`format-tsrx`, `compile-tsrx`, and `analyze-tsrx`, but omits local filesystem
tools such as `inspect-project`, `detect-target`, and `validate-tsrx-file`.

Set `TSRX_MCP_BEARER_TOKEN` in the endpoint environment to require bearer-token
auth. Set `TSRX_MCP_CORS_ORIGIN` to restrict CORS for browser-based clients.

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
- `inspect-project` - inspect target signals, TSRX packages, tooling, scripts, and
  likely project commands.
- `compile-tsrx` - compile TSRX code with the inferred or explicit target compiler
  and return diagnostics.
- `format-tsrx` - format TSRX code using the official Prettier plugin.
- `analyze-tsrx` - compile TSRX code and convert common diagnostics into
  target-neutral authoring advice with linked docs resources.
- `validate-tsrx-file` - read a `.tsrx` file and run formatting, compilation, and
  diagnostic advice in one read-only pass.

## Agent Workflows

For an existing project, start with `inspect-project` to identify the TSRX target,
installed tooling, and likely validation commands. Use `detect-target` when only
the runtime target is needed.

For generated code, run `format-tsrx` first, then `compile-tsrx` with the inferred
or explicit target. If compilation fails, run `analyze-tsrx`, apply the advice,
format again, and compile again.

For an existing `.tsrx` file, prefer `validate-tsrx-file`. It reads the file and
runs formatting, compilation, and diagnostic advice in one read-only pass.

## Resources

- `tsrx://docs/{slug}.md` - target-neutral TSRX documentation sections.
- `tsrx://targets/{target}.md` - handoff guidance for target-specific layers.

## Prompts

- `tsrx-task` - target-aware workflow for TSRX coding tasks.

The core server stays target-neutral. Runtime-specific imports, bundler setup, and
framework semantics should live in target-specific skills, prompts, or resources
layered on top.
