// Run with node scripts/check-chart-layout.mjs. Uses the real React/Motion render.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
    });
    module._compile(outputText, filename);
  };
}
require.extensions[".css"] = () => {};

const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { LineChart } = require("../registry/components/line-chart/line-chart.tsx");

function render(count, windowSize) {
  return renderToStaticMarkup(createElement(LineChart, {
    data: Array.from({ length: count }, (_, index) => ({ label: `Sample ${index}`, value: 50 })),
    domain: [30, 130],
    windowSize,
    format: { style: "unit", unit: "millisecond" },
  }));
}

for (const count of [31, 32, 61, 301, 1001]) {
  const html = render(count, 31);
  assert.ok(!html.includes("<foreignObject"), "Animated labels must stay outside SVG in WebKit");
  const overlay = html.slice(html.indexOf("</svg>"));
  assert.ok(overlay.includes("130 ms") && overlay.includes("Average"));
  const gridY = [...html.matchAll(/<line[^>]*y1="([^"]+)"[^>]*stroke="var\(--border\)"/g)].map((match) => Number(match[1]));
  const labelY = [...overlay.matchAll(/class="absolute left-0 flex h-5 items-center justify-end" style="top:([^p]+)px/g)].map((match) => Number(match[1]) + 10);
  assert.deepEqual(labelY, gridY, "Y-axis label centers must match their grid lines");
  const ticks = [...overlay.matchAll(/class="absolute flex h-5 w-\[88px\][^"]*" style="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ticks.length, 7);
  assert.match(ticks[0], /left:0%;.*transform:none/);
  assert.match(ticks.at(-1), /left:100%;.*transform:translateX\(-100%\)/);
  // Fixed gutters keep the first/last label edges on the plot at any width.
  assert.ok(html.includes("margin-left:58px;width:calc(100% - 86px)"));
  assert.ok(overlay.includes("left:58px;right:28px"));
  assert.ok(overlay.includes(`Sample ${count - 31}`) && overlay.includes(`Sample ${count - 1}`));
}
assert.ok(render(0).includes("No data available"));
assert.ok(render(1).includes("Sample 0"));
assert.ok(render(7).includes("Sample 6"));
const { RealtimeLineChart } = require("../registry/blocks/realtime-line-chart/realtime-line-chart.tsx");
const blockProps = { data: [{ label: "now", value: 50 }], title: "Latency" };
const plainBlock = renderToStaticMarkup(createElement(RealtimeLineChart, blockProps));
assert.ok(!plainBlock.includes('role="tablist"') && !plainBlock.includes(">Live<"));
const ranges = [{ value: "30", label: "30s" }, { value: "60", label: "1m" }, { value: "120", label: "2m" }];
for (const selection of [{ defaultRange: "60" }, { range: "60", defaultRange: "30" }]) {
  const block = renderToStaticMarkup(createElement(RealtimeLineChart, { ...blockProps, ranges, ...selection }));
  assert.equal([...block.matchAll(/role="tab"/g)].length, 3);
  const selectedTab = block.match(/<button[^>]*aria-selected="true"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(selectedTab?.includes(">1m</span>"), "Range selection must reach the grouped tabs");
}
console.log("Chart layout passed: HTML labels, aligned grid values, bounded X-axis, and stable positions through 1,001 samples.");
