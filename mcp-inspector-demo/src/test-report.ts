
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from
  "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

type Category = "Positive" | "Negative" | "Edge";



// npm run inspect -- Opens MCP Inspector and starts the MCP server
// npm run test:report -- Executes automated tests and generates the HTML report
// npm run test:report:open -- Runs automated tests and opens the generated HTML report in the default browser
// npm run inspect:test -- Runs the automated test-report script

interface TestCase {
  name: string;
  category: Category;
  tool: string;
  args: Record<string, unknown>;
  expected: string;
  check: (
    result: any,
    thrown?: string
  ) => boolean;
}

interface TestResult {
  name: string;
  category: Category;
  tool: string;
  args: Record<string, unknown>;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  durationMs: number;
  error?: string;
}

const hasText = (result: any, expected: string) =>
  (result?.content ?? []).some(
    (item: any) =>
      item.type === "text" && item.text === expected
  );

const successfulText = (expected: string) =>
  (result: any, thrown?: string) =>
    !thrown &&
    result?.isError !== true &&
    hasText(result, expected);

const rejected = (result: any, thrown?: string) =>
  Boolean(thrown) || result?.isError === true;

const tests: TestCase[] = [
  // POSITIVE: calculator
  {
    name: "Add two positive integers",
    category: "Positive",
    tool: "add",
    args: { a: 10, b: 20 },
    expected: "Result: 30",
    check: successfulText("Result: 30"),
  },
  {
    name: "Add decimal values",
    category: "Positive",
    tool: "add",
    args: { a: 1.5, b: 2.5 },
    expected: "Result: 4",
    check: successfulText("Result: 4"),
  },
  {
    name: "Add negative numbers",
    category: "Positive",
    tool: "add",
    args: { a: -10, b: -5 },
    expected: "Result: -15",
    check: successfulText("Result: -15"),
  },
  {
    name: "Add mixed-sign numbers",
    category: "Positive",
    tool: "add",
    args: { a: -10, b: 25 },
    expected: "Result: 15",
    check: successfulText("Result: 15"),
  },
  {
    name: "Return weather for Surat",
    category: "Positive",
    tool: "get_weather",
    args: { city: "Surat" },
    expected: "City Surat, Sunny, 30°C",
    check: (r, e) =>
      !e &&
      r?.isError !== true &&
      (r?.content ?? []).some(
        (c: any) =>
          c.type === "text" &&
          (() => {
            try {
              const w = JSON.parse(c.text);
              return w.city === "Surat" &&
                w.condition === "Sunny" &&
                w.temperatureC === 30;
            } catch {
              return false;
            }
          })()
      ),
  },

  // NEGATIVE: invalid arguments
  {
    name: "Reject string instead of number",
    category: "Negative",
    tool: "add",
    args: { a: "10", b: 20 },
    expected: "Validation error",
    check: rejected,
  },
  {
    name: "Reject missing calculator argument",
    category: "Negative",
    tool: "add",
    args: { a: 10 },
    expected: "Validation error",
    check: rejected,
  },
  {
    name: "Reject missing all calculator arguments",
    category: "Negative",
    tool: "add",
    args: {},
    expected: "Validation error",
    check: rejected,
  },
  {
    name: "Reject empty city",
    category: "Negative",
    tool: "get_weather",
    args: { city: "" },
    expected: "Validation error",
    check: rejected,
  },
  {
    name: "Reject numeric city",
    category: "Negative",
    tool: "get_weather",
    args: { city: 123 },
    expected: "Validation error",
    check: rejected,
  },
  {
    name: "Reject unknown tool",
    category: "Negative",
    tool: "does_not_exist",
    args: {},
    expected: "Tool call error",
    check: rejected,
  },

  // EDGE: numeric boundaries and unusual inputs
  {
    name: "Add zero values",
    category: "Edge",
    tool: "add",
    args: { a: 0, b: 0 },
    expected: "Result: 0",
    check: successfulText("Result: 0"),
  },
  {
    name: "Add negative zero",
    category: "Edge",
    tool: "add",
    args: { a: -0, b: 0 },
    expected: "Result: 0",
    check: successfulText("Result: 0"),
  },
  {
    name: "Add very large finite numbers",
    category: "Edge",
    tool: "add",
    args: { a: 1e+100, b: 1e+100 },
    expected: `Result: ${1e+100 + 1e+100}`,
    check: successfulText(`Result: ${1e+100 + 1e+100}`),
  },
  {
    name: "Check floating-point precision",
    category: "Edge",
    tool: "add",
    args: { a: 0.1, b: 0.2 },
    expected: "Result: 0.30000000000000004",
    check: successfulText(
      "Result: 0.30000000000000004"
    ),
  },
  {
    name: "Accept unknown city using mock response",
    category: "Edge",
    tool: "get_weather",
    args: { city: "Atlantis" },
    expected: "Returns mock data for Atlantis",
    check: (r, e) =>
      !e &&
      r?.isError !== true &&
      (r?.content ?? []).some(
        (c: any) =>
          c.type === "text" &&
          (() => {
            try {
              return JSON.parse(c.text).city === "Atlantis";
            } catch {
              return false;
            }
          })()
      ),
  },
  {
    name: "Accept whitespace-only city",
    category: "Edge",
    tool: "get_weather",
    args: { city: "   " },
    expected: "Returns mock data preserving whitespace",
    check: (r, e) =>
      !e &&
      r?.isError !== true &&
      (r?.content ?? []).some(
        (c: any) =>
          c.type === "text" &&
          (() => {
            try {
              return JSON.parse(c.text).city === "   ";
            } catch {
              return false;
            }
          })()
      ),
  },
  {
    name: "Accept Unicode city name",
    category: "Edge",
    tool: "get_weather",
    args: { city: "東京" },
    expected: "Returns mock data for 東京",
    check: (r, e) =>
      !e &&
      r?.isError !== true &&
      (r?.content ?? []).some(
        (c: any) =>
          c.type === "text" &&
          (() => {
            try {
              return JSON.parse(c.text).city === "東京";
            } catch {
              return false;
            }
          })()
      ),
  },
];

function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]!);
}

function makeReport(results: TestResult[]): string {
  const passed = results.filter(
    (r) => r.status === "PASS"
  ).length;
  const failed = results.length - passed;
  const categories: Category[] = [
    "Positive", "Negative", "Edge"
  ];

  const categoryCards = categories.map((category) => {
    const group = results.filter(
      (r) => r.category === category
    );
    const count = group.filter(
      (r) => r.status === "PASS"
    ).length;

    return `<div class="card">
      <div class="muted">${category} tests</div>
      <div class="number">${count}/${group.length}</div>
      <div class="muted">passed</div>
    </div>`;
  }).join("");

  const rows = results.map((r, i) => `
    <tr class="${r.status === "FAIL" ? "failed-row" : ""}">
      <td>${i + 1}</td>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.name)}</td>
      <td><code>${escapeHtml(r.tool)}</code></td>
      <td><pre>${escapeHtml(JSON.stringify(r.args, null, 2))}</pre></td>
      <td>${escapeHtml(r.expected)}</td>
      <td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td>
      <td>${r.durationMs.toFixed(2)} ms</td>
      <td>${escapeHtml(r.error ?? r.actual)}</td>
    </tr>
  `).join("");

  const generated = new Date().toISOString();
  const rate = results.length
    ? ((passed / results.length) * 100).toFixed(1)
    : "0.0";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MCP Inspector Test Report</title>
<style>
:root { color-scheme: light; font-family: Inter, system-ui, sans-serif; }
body { margin: 0; padding: 28px; background: #f4f7fb; color: #182230; }
main { max-width: 1600px; margin: auto; }
h1 { margin-bottom: 6px; }
.muted { color: #64748b; font-size: 13px; }
.cards { display: grid; grid-template-columns: repeat(4,minmax(140px,1fr)); gap: 14px; margin: 24px 0; }
.card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
.number { font-size: 30px; font-weight: 750; margin: 7px 0; }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
input, select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; }
.table-wrap { overflow: auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e8edf4; vertical-align: top; }
th { background: #edf2f8; position: sticky; top: 0; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; max-width: 220px; margin: 0; }
.status { font-weight: 800; }
.pass { color: #15803d; }
.fail { color: #b91c1c; }
.failed-row { background: #fff1f2; }
@media(max-width:700px) { body { padding: 12px; } .cards { grid-template-columns: repeat(2,1fr); } }
</style>
</head>
<body>
<main>
<h1>MCP Inspector — Automated Test Report</h1>
<div class="muted">Generated: ${escapeHtml(generated)}</div>
<div class="muted">Server: mcp-inspector-demo · Transport: stdio</div>
<section class="cards">
<div class="card"><div class="muted">Total tests</div><div class="number">${results.length}</div></div>
<div class="card"><div class="muted">Passed</div><div class="number">${passed}</div></div>
<div class="card"><div class="muted">Failed</div><div class="number">${failed}</div></div>
<div class="card"><div class="muted">Pass rate</div><div class="number">${rate}%</div></div>
${categoryCards}
</section>
<div class="toolbar">
<input id="search" placeholder="Search tests..." aria-label="Search tests">
<select id="category" aria-label="Filter category">
<option value="">All categories</option>
<option>Positive</option><option>Negative</option><option>Edge</option>
</select>
<select id="status" aria-label="Filter status">
<option value="">All results</option>
<option>PASS</option><option>FAIL</option>
</select>
</div>
<div class="table-wrap">
<table>
<thead><tr>
<th>#</th><th>Category</th><th>Test</th><th>Tool</th>
<th>Arguments</th><th>Expected</th><th>Status</th>
<th>Duration</th><th>Actual / Error</th>
</tr></thead>
<tbody id="results">${rows}</tbody>
</table>
</div>
<p class="muted">Negative tests pass when the server rejects invalid input. Review edge-case behavior against your application requirements.</p>
</main>
<script>
const search = document.getElementById("search");
const category = document.getElementById("category");
const status = document.getElementById("status");
function filterRows() {
  const query = search.value.toLowerCase();
  for (const row of document.querySelectorAll("#results tr")) {
    row.hidden =
      !row.innerText.toLowerCase().includes(query) ||
      (category.value && row.cells[1].innerText !== category.value) ||
      (status.value && row.cells[6].innerText !== status.value);
  }
}
search.addEventListener("input", filterRows);
category.addEventListener("change", filterRows);
status.addEventListener("change", filterRows);
</script>
</body>
</html>`;
}

async function main() {
  const client = new Client({
    name: "mcp-test-runner",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["tsx", "src/index.ts"],
    cwd: process.cwd(),
  });

  const results: TestResult[] = [];

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    const availableTools = new Set(tools.map((t) => t.name));

    console.log("Discovered tools:", [...availableTools].join(", "));

    for (const test of tests) {
      const start = performance.now();
      let result: any;
      let thrown: string | undefined;

      try {
        if (
          test.tool !== "does_not_exist" &&
          !availableTools.has(test.tool)
        ) {
          throw new Error(`Tool not registered: ${test.tool}`);
        }

        result = await client.callTool({
          name: test.tool,
          arguments: test.args,
        });
      } catch (error) {
        thrown = error instanceof Error
          ? error.message
          : String(error);
      }

      const durationMs = performance.now() - start;
      const isPass = test.check(result, thrown);

      const actual = thrown
        ? `Exception: ${thrown}`
        : (result?.content ?? [])
            .map((c: any) =>
              c.type === "text" ? c.text : JSON.stringify(c)
            )
            .join("\n") ||
          (result?.isError ? "Tool returned an error" : "No content");

      results.push({
        name: test.name,
        category: test.category,
        tool: test.tool,
        args: test.args,
        expected: test.expected,
        actual,
        status: isPass ? "PASS" : "FAIL",
        durationMs,
        error: isPass ? undefined : thrown,
      });

      console.log(
        `[${isPass ? "PASS" : "FAIL"}] ${test.category}: ${test.name}`
      );
    }
  } catch (error) {
    console.error("Test runner setup failed:", error);
    throw error;
  } finally {
    await client.close().catch(() => {});
  }

  await mkdir("reports", { recursive: true });
  await writeFile(
    "reports/mcp-test-report.html",
    makeReport(results),
    "utf8"
  );

  const passed = results.filter(
    (r) => r.status === "PASS"
  ).length;
  const failed = results.length - passed;

  console.log("\nTest summary");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("HTML report: reports/mcp-test-report.html");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;

});
