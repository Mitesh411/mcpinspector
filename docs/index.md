# MCP Inspector Demo — Documentation Index

Welcome to the documentation for the **MCP Inspector Demo** project.

## Project Description

**MCP Inspector Demo** is a reference implementation for building, testing, inspecting, and documenting Model Context Protocol (MCP) servers using TypeScript, the official `@modelcontextprotocol/sdk`, and Zod schema validation.

The project demonstrates:
- Building lightweight MCP servers listening over standard I/O (`StdioServerTransport`).
- Registering tools with strict Zod argument validation schemas (`add`, `get_weather`).
- Inspecting server capabilities and payloads interactively using MCP Inspector.
- Running automated test suites with a client harness (`StdioClientTransport`).
- Generating interactive HTML QA reports for testing pass rates and execution details.

---

## Architecture & System Documentation

Below are links to the detailed architecture and API documentation files:

- [Database Architecture](./architecture/database.md) — Comprehensive PostgreSQL schema definition, table descriptions, index specifications, and a Mermaid Entity-Relationship Diagram (ERD).
- [Class Architecture](./architecture/classes.md) — UML Class Diagram created with Mermaid syntax illustrating relationships, classes, interfaces, and methods across the server, transports, client harness, and test runner.
- [API & Tool Reference](./architecture/api.md) — Detailed reference of all MCP JSON-RPC protocol endpoints and registered domain tool contracts (`add`, `get_weather`), including parameters, validation rules, and request/response examples.

---

## Directory Overview

```text
.
├── README.md                  # Quickstart guide and overview
├── docs/                      # Documentation hub
│   ├── index.md               # Documentation index (this file)
│   └── architecture/          # Architecture detailed specifications
│       ├── database.md        # PostgreSQL schema & ERD
│       ├── classes.md         # UML class diagram & reference
│       └── api.md             # REST / MCP API endpoints & tool definitions
└── mcp-inspector-demo/        # Core TypeScript MCP server application
    ├── src/
    │   ├── index.ts           # MCP server and tool implementations
    │   └── test-report.ts     # Test execution harness and HTML report generator
    └── reports/
        └── mcp-test-report.html
```
