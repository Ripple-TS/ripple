# TSRX MCP Endpoint

Deployment-neutral HTTP endpoint for any remote MCP client that can connect to a
Streamable HTTP server.

The endpoint is mounted at `/mcp` and serves `@tsrx/mcp` over Streamable HTTP in
remote-safe mode. Remote mode exposes documentation, prompts, formatting,
compilation, and diagnostic analysis tools, but omits local filesystem/project
tools such as `inspect-project`, `detect-target`, and `validate-tsrx-file`.

This top-level app includes a plain Node server for local development and simple
deployments. Other hosts can import `handleRequest` from `src/handler.js` and
adapt it to their own HTTP runtime.

## Environment

Optional environment variables:

- `PORT` - port for `pnpm --dir website-mcp start`; defaults to `3000`.
- `HOST` - host for `pnpm --dir website-mcp start`; defaults to `0.0.0.0`.
- `TSRX_MCP_BEARER_TOKEN` - require `Authorization: Bearer <token>` for MCP
  requests.
- `TSRX_MCP_CORS_ORIGIN` - override the default `Access-Control-Allow-Origin: *`
  response header.

## Local development

```bash
pnpm --dir website-mcp build
pnpm --dir website-mcp start
```
