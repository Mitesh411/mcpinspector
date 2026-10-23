import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-inspector-demo",
  version: "1.0.0",
});

// Tool 1: Add two numbers
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
    content: [
      {
        type: "text",
        text: `Result: ${a + b}`,
      },
    ],
  })
);

// Tool 2: Return mock weather data
server.registerTool(
  "get_weather",
  {
    title: "Get Weather",
    description:
      "Get demo weather data for a city. This uses mock data, not a live API.",
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
      content: [
        {
          type: "text",
          text: JSON.stringify(weather, null, 2),
        },
      ],
    };
  }
);

// MCP uses stdin/stdout for protocol messages.
// Send diagnostic logs to stderr, never stdout.
const transport = new StdioServerTransport();

await server.connect(transport);

console.error("MCP Inspector demo server started.");
