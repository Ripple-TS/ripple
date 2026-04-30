#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTSRXMcpServer } from './server.js';

const server = createTSRXMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
