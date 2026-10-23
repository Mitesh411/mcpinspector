# MCP Inspector Demo

A lightweight TypeScript demo project for exploring the Model Context Protocol (MCP) ecosystem using the official MCP SDK and the MCP Inspector. This repository demonstrates how to build a minimal MCP server, expose tools, validate behavior with automated tests, and generate an HTML test report for inspection and debugging.

## Overview

The project is intentionally small and production-agnostic, designed to help developers understand the workflow of:

- creating an MCP server
- registering tools using the MCP schema
- validating tool behavior through client calls
- running the server with the MCP Inspector
- generating a readable automated report for debugging and QA

At its core, this project exposes two MCP tools:

- `add` – adds two numeric values
- `get_weather` – returns mock weather information for a city

This makes it an ideal reference implementation for learning, testing, and validating MCP tool contracts.

## Why This Project Exists

MCP servers are often more complex than a single demo and may include authentication, streaming, external APIs, custom schemas, or enterprise integrations. This repository intentionally strips that complexity away in order to spotlight the fundamentals:

- MCP server wiring
- tool registration
- protocol-level communication over stdio
- automated validation of expected tool behavior
- UI-based inspection with MCP Inspector

## Architecture

The repository currently contains one main demo app:

- `mcp-inspector-demo/` — the MCP server and test harness

### High-Level Flow

1. A TypeScript MCP server starts with `src/index.ts`
2. The server registers tools using the Model Context Protocol SDK
3. A client connects over stdio using the MCP client transport
4. The MCP Inspector or a custom test runner invokes the tools
5. Results are validated and exported to a report

## Repository Structure

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
└── .gitignore (if present in your local environment)
```

## Project Details

### `mcp-inspector-demo/src/index.ts`

This file defines the actual MCP server.

It:

- creates an `McpServer`
- registers the `add` tool
- registers the `get_weather` tool
- connects through `StdioServerTransport`
- writes server status logs to stderr to avoid interfering with stdout-based MCP protocol communication

Example tool definitions:

- `add(a, b)` returns a text result like `Result: 30`
- `get_weather(city)` returns mock JSON content such as:

```json
{
  "city": "Surat",
  "temperatureC": 30,
  "condition": "Sunny",
  "humidity": 55,
  "source": "mock"
}
```

This server is intentionally simple and uses Zod validation for tool arguments.

### `mcp-inspector-demo/src/test-report.ts`

This file acts as a test harness and report generator.

It:

- starts the server via stdio transport
- lists available MCP tools
- executes a suite of positive, negative, and edge-case tests
- verifies expected tool outputs or validation failures
- writes the final results to `reports/mcp-test-report.html`

The runtime includes:

- success/failure classification
- tool argument validation checks
- timing metrics for each execution
- a generated HTML report with filters and search capability

### `mcp-inspector-demo/reports/mcp-test-report.html`

This generated report provides an easy-to-read summary of automated test execution. It includes:

- total tests
- pass/fail counts
- percentage pass rate
- category-based summaries
- searchable test rows
- result details and error output

## Features

- Minimal but realistic MCP server implementation
- TypeScript-based development workflow
- Official `@modelcontextprotocol/sdk` integration
- Stdio transport for MCP communication
- Tool validation with Zod
- Simple mock data generation
- Automated test suite covering validation and edge cases
- HTML reporting for result viewing and debugging

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ recommended
- npm or another package manager
- Basic understanding of TypeScript and command-line usage

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Mitesh411/mcpinspector.git
cd mcpinspector
```

### 2. Install dependencies

```bash
cd mcp-inspector-demo
npm install
```

## Running the Demo

### Start the MCP server locally

```bash
npm run dev
```

This starts the MCP server using the TypeScript runtime and keeps it ready for MCP clients.

### Open the MCP Inspector

```bash
npm run inspect
```

This command uses the MCP Inspector and launches the demo server for interactive debugging.

### Generate the automated HTML report

```bash
npm run test:report
```

This script launches the test harness, executes the tool validation cases, and writes the final report to:

```text
mcp-inspector-demo/reports/mcp-test-report.html
```

## Available Scripts

The `package.json` defines the following workflows:

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

### Script explanations

- `npm run dev` — runs the MCP server directly
- `npm run typecheck` — checks TypeScript correctness
- `npm run inspect` — opens the MCP Inspector against the demo server
- `npm run test:report` — runs end-to-end tool validation and writes the HTML report
- `npm run inspect:test` — convenience alias for report generation

## Example Tool Usage

### `add`

Input:

```json
{
  "a": 10,
  "b": 20
}
```

Output:

```text
Result: 30
```

### `get_weather`

Input:

```json
{
  "city": "Surat"
}
```

Example output:

```json
{
  "city": "Surat",
  "temperatureC": 30,
  "condition": "Sunny",
  "humidity": 55,
  "source": "mock"
}
```

## Test Coverage

The demo includes coverage across these categories:

- Positive tests — valid tool calls
- Negative tests — invalid input rejection
- Edge cases — zero values, floats, Unicode, whitespace, large numbers

This is useful for understanding how validation behaves when a tool is exposed through MCP and invoked from a client.

## Why Use MCP Inspector?

The MCP Inspector is a valuable tool for:

- exploring exposed tools
- validating schema behavior
- debugging protocol-level issues
- understanding real request and response payloads
- testing cross-tool interactions before production integration

This project is a simple, practical example of that workflow.

## Learning Outcomes

After exploring this project, a developer should understand:

- how to build a minimal MCP server in TypeScript
- how to register tools and schemas
- how MCP tools communicate over stdio
- how to validate tool arguments and responses
- how to automate server testing and generate human-readable reports

## Suggested Next Steps

To extend this demo,

- add more tool functions with richer schemas
- connect to a real API or database
- add authentication or session handling
- implement streaming or async tool execution
- build a front-end dashboard for inspecting MCP activity

## License

This project is distributed under the license defined in the repository. Please check the repository for the current license terms if applicable.

## Contributing

Contributions are welcome. If you want to improve the demo, add more validation cases, or improve the reporting experience, feel free to submit a pull request.

## Contact

For questions or collaboration, reach out through the repository owner or project maintainers on GitHub.

---

Built as a clean example for learning, testing, and validating MCP server behavior with the MCP Inspector.
