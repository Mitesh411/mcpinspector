# API & Tool Interface Documentation

This document describes all REST API endpoints, JSON-RPC protocol methods, and MCP registered tools provided by the **MCP Inspector Demo** server.

---

## Overview

The server communicates using the **Model Context Protocol (MCP)** specification over JSON-RPC 2.0 transport (typically stdio or HTTP/SSE). The API surface consists of:

1. **Protocol Management Endpoints / Methods:** Standard MCP lifecycle and discovery methods (`initialize`, `ping`, `tools/list`, `tools/call`).
2. **Registered Tool Call Endpoints:** Executable domain tools registered on the server (`add`, `get_weather`).

---

## Protocol RPC Endpoints & Methods

### 1. Initialize Connection (`initialize`)

* **Protocol Method:** `initialize`
* **Transport Method / Path:** `POST /rpc` (HTTP) or JSON-RPC notification over `stdio`
* **Description:** Establishes connection, negotiates protocol version, and exchanges client/server capabilities.

#### Request Parameters
```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {},
  "clientInfo": {
    "name": "mcp-test-runner",
    "version": "1.0.0"
  }
}
```

#### Response Body
```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {}
  },
  "serverInfo": {
    "name": "mcp-inspector-demo",
    "version": "1.0.0"
  }
}
```

---

### 2. List Registered Tools (`tools/list`)

* **Protocol Method:** `tools/list`
* **Transport Method / Path:** `POST /rpc` (HTTP) or JSON-RPC request `{"method": "tools/list"}` over `stdio`
* **Description:** Returns metadata and JSON input schemas for all tools currently registered on the MCP server.

#### Request Parameters
*(None or optional pagination cursor)*
```json
{}
```

#### Response Payload
```json
{
  "tools": [
    {
      "name": "add",
      "title": "Add Numbers",
      "description": "Add two numbers and return their sum.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "a": { "type": "number", "description": "First number" },
          "b": { "type": "number", "description": "Second number" }
        },
        "required": ["a", "b"]
      }
    },
    {
      "name": "get_weather",
      "title": "Get Weather",
      "description": "Get demo weather data for a city. This uses mock data, not a live API.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "minLength": 1, "description": "City name" }
        },
        "required": ["city"]
      }
    }
  ]
}
```

---

### 3. Invoke Tool (`tools/call`)

* **Protocol Method:** `tools/call`
* **Transport Method / Path:** `POST /rpc` (HTTP) or JSON-RPC request over `stdio`
* **Description:** Invokes a registered tool by name with provided arguments.

#### Request Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The name of the tool to execute (`add`, `get_weather`) |
| `arguments` | `object` | Yes | Map of arguments compliant with tool's input schema |

---

## Domain Tool Endpoints Reference

### Tool 1: `add`

* **Tool Name:** `add`
* **Title:** Add Numbers
* **Description:** Add two numeric values (`a` and `b`) and return their arithmetic sum formatted in a text response.

#### Parameters

| Parameter | Type | Required | Description | Validation Constraints |
|---|---|---|---|---|
| `a` | `number` | Yes | First addend number | Valid finite floating point or integer |
| `b` | `number` | Yes | Second addend number | Valid finite floating point or integer |

#### Request Example
```json
{
  "name": "add",
  "arguments": {
    "a": 10,
    "b": 20
  }
}
```

#### Response Example (Success)
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

#### Response Example (Validation Error - Missing or Invalid Type)
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Invalid arguments: Expected number, received string at 'a'"
    }
  ]
}
```

---

### Tool 2: `get_weather`

* **Tool Name:** `get_weather`
* **Title:** Get Weather
* **Description:** Fetch mock weather status for a specified city name.

#### Parameters

| Parameter | Type | Required | Description | Validation Constraints |
|---|---|---|---|---|
| `city` | `string` | Yes | City name string | Non-empty string (`minLength: 1`) |

#### Request Example
```json
{
  "name": "get_weather",
  "arguments": {
    "city": "Surat"
  }
}
```

#### Response Example (Success)
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"city\": \"Surat\",\n  \"temperatureC\": 30,\n  \"condition\": \"Sunny\",\n  \"humidity\": 55,\n  \"source\": \"mock\"\n}"
    }
  ]
}
```

#### Response Example (Validation Error - Empty String)
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Invalid arguments: String must contain at least 1 character(s) at 'city'"
    }
  ]
}
```

---

## Summary Table of REST / MCP Endpoints

| Endpoint / Method | Transport | Path / Protocol Method | Method | Description |
|---|---|---|---|---|
| `Initialize` | Stdio / HTTP | `initialize` | JSON-RPC | Connection setup and handshake |
| `List Tools` | Stdio / HTTP | `tools/list` | JSON-RPC | Enumerate available server tools |
| `Call Tool` | Stdio / HTTP | `tools/call` | JSON-RPC | Execute tool with parameters |
| `Tool: add` | MCP Call | `tools/call` (`name: "add"`) | RPC / POST | Calculate sum of numbers `a` and `b` |
| `Tool: get_weather` | MCP Call | `tools/call` (`name: "get_weather"`) | RPC / POST | Return mock weather JSON payload for `city` |
