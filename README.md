# MCP Inspector Demo

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Official-6A5AE0)](https://modelcontextprotocol.io/)
[![MCP Inspector](https://img.shields.io/badge/Inspector-Enabled-00B894)](https://github.com/modelcontextprotocol/inspector)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A lightweight TypeScript reference implementation for building, testing, and inspecting a Model Context Protocol (MCP) server with the official MCP SDK and MCP Inspector.

This repository demonstrates the essentials of the MCP workflow:

- creating an MCP server
- registering tools with schema validation
- exposing tools over stdio transport
- inspecting tool metadata and payloads in the Inspector UI
- validating behavior with an automated test harness
- generating a lightweight HTML QA report for debugging and review

## Why this project exists

MCP servers are frequently more complex than a minimal demo. Real-world implementations often include authentication, streaming, database integration, custom schemas, and production-grade observability.

This project intentionally strips the complexity away so you can focus on the core mechanics:

- `McpServer` setup and lifecycle
- tool registration patterns
- typed input validation with Zod
- stdio-based protocol transport
- client-side inspection and debugging
- report-driven validation of tool behavior

## Screenshots

These are quick product-style placeholders to make the README feel polished and ready for GitHub. Swap them with your own project screenshots when available.

![MCP Inspector UI](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80)

![Generated HTML Report](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80)

## Architecture overview

The repository contains a single demo app under `mcp-inspector-demo/`, with a minimal server and a test/report harness.

```text
mcpinspector/
├── README.md
├── mcp-inspector-demo/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   └── test-report.ts
│   └── reports/
│       └── mcp-test-report.html
└── .gitignore
```

High-level flow:

1. `src/index.ts` creates an `McpServer`
2. tools are registered with Zod-based input schemas
3. the server listens over `StdioServerTransport`
4. the MCP Inspector or a client connects and introspects the server
5. the test harness executes tool calls and writes an HTML summary report

## Quick start

### 1) Clone the repo

```bash
git clone https://github.com/Mitesh411/mcpinspector.git
cd mcpinspector
```

### 2) Install dependencies

```bash
cd mcp-inspector-demo
npm install
```

### 3) Run the MCP server

```bash
npm run dev
```

This starts the TypeScript server and keeps it ready for clients over stdio.

### 4) Inspect the server in the MCP Inspector

```bash
npm run inspect
```

This launches the MCP Inspector against the demo server so you can browse registered tools, validate schemas, and review real request/response payloads.

### 5) Generate the test HTML report

```bash
npm run test:report
```

The generated report is written to:

```text
mcp-inspector-demo/reports/mcp-test-report.html
```

## Available scripts

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "typecheck": "tsc --noEmit",
    "inspect": "npx @modelcontextprotocol/inspector npx tsx src/index.ts",
    "test:report": "tsx src/test-report.ts",
    "inspect:test": "npm run test:report"
  }
}
```

### Script reference

- `npm run dev` — starts the MCP server locally
- `npm run typecheck` — validates TypeScript compilation
- `npm run inspect` — opens the MCP Inspector with the demo server
- `npm run test:report` — runs the automated validation suite and writes the HTML report
- `npm run inspect:test` — alias for the report generation flow

## Server API details

The server is implemented in `mcp-inspector-demo/src/index.ts`.

### Server construction

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-inspector-demo",
  version: "1.0.0",
});
```

This is the core MCP server bootstrap. The server exposes tools through the `registerTool()` API and is bound to a stdio transport for MCP protocol communication.

### Transport behavior

```ts
const transport = new StdioServerTransport();
await server.connect(transport);
```

Important implementation detail:

- MCP protocol traffic uses stdout/stdin.
- diagnostic logging should go to stderr, not stdout, to avoid corrupting protocol messages.

```ts
console.error("MCP Inspector demo server started.");
```

## Tool contracts

The demo exposes two minimal tools.

### 1) `add`

Purpose: add two numeric values and return a text summary.

Schema:

```ts
server.registerTool(
  "add",
  {
    title: "Add Numbers",
    description: "Add two numbers and return their sum.",
    inputSchema: {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `Result: ${a + b}` }],
  })
);
```

Example input:

```json
{
  "a": 10,
  "b": 20
}
```

Example result:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Result: 30"
    }
  ]
}
```

### 2) `get_weather`

Purpose: return mock weather data for a city.

Schema:

```ts
server.registerTool(
  "get_weather",
  {
    title: "Get Weather",
    description: "Get demo weather data for a city. This uses mock data, not a live API.",
    inputSchema: {
      city: z.string().min(1).describe("City name"),
    },
  },
  async ({ city }) => {
    const weather = {
      city,
      temperatureC: 30,
      condition: "Sunny",
      humidity: 55,
      source: "mock",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(weather, null, 2) }],
    };
  }
);
```

Example input:

```json
{
  "city": "Surat"
}
```

Example result:

```json
{
  "city": "Surat",
  "temperatureC": 30,
  "condition": "Sunny",
  "humidity": 55,
  "source": "mock"
}
```

## Example tool invocation flow

This project is intentionally small, but the structure matches how real MCP tooling is consumed.

Typical request pattern:

```ts
// Client-side concept: list tools, then invoke them.
const tools = await client.listTools();

const addResult = await client.callTool({
  name: "add",
  arguments: { a: 10, b: 20 },
});

const weatherResult = await client.callTool({
  name: "get_weather",
  arguments: { city: "Surat" },
});
```

The server returns structured `content` payloads, which can be inspected directly in the MCP Inspector or validated via custom scripts.

## Test harness and report generation

The test harness lives in `mcp-inspector-demo/src/test-report.ts`.

It performs the following:

- starts the MCP server over stdio
- lists available tools from the server
- executes positive and negative test cases
- validates Zod-based errors and return payloads
- records timing and result states
- writes a readable HTML report to `reports/mcp-test-report.html`

Generated report features:

- summary totals and pass rate
- category-level breakdowns
- searchable rows
- detailed failure output
- easy review for QA/debugging workflows

## Test coverage

The demo includes representative validation coverage across:

- positive inputs
- invalid or malformed inputs
- edge cases such as zero, floats, large numbers, whitespace, and Unicode values

This helps show how MCP tools behave under real client usage patterns and schema enforcement.

## Why use the MCP Inspector?

The Inspector is useful for:

- browsing available server tools
- verifying tool metadata and schemas
- testing exact request payloads
- observing raw protocol responses
- debugging transport and validation behavior before production integration

## Development notes

A few practical patterns illustrated by this repo:

- keep server logs on stderr
- use Zod schemas to validate tool arguments
- prefer text payloads for simple tool responses
- generate reports from automated executions to improve traceability
- use the Inspector while building tool contracts, not only after deployment

## Suggested next steps

To extend the demo, consider:

- adding more tools with richer input/output schemas
- integrating a real API or database
- introducing auth/session handling
- building a streaming or async tool workflow
- connecting the server to a front-end inspection dashboard

## License

This project is distributed under the repository license. Please review the repo for the current terms.

## Contributing

Contributions are welcome. If you improve validation coverage, broaden the toolset, or enhance the report experience, feel free to submit a pull request.

---

Built for learning, debugging, and validating MCP server behavior with the official SDK and Inspector.
