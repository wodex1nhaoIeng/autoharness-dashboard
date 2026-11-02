import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Usage: node scripts/import-results.mjs <results.json> <YYYY-MM-DD> [--note "text"] [--out public/data]
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const [value] = args.splice(index, 2).slice(1);
  return value;
};
const note = option("--note");
const outDir = resolve(option("--out") ?? "public/data");
const [resultsArg, date] = args;

if (!resultsArg || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error('Usage: node scripts/import-results.mjs <results.json> <YYYY-MM-DD> [--note "text"] [--out dir]');
  process.exit(1);
}

// results.json comes from scripts/kani-std-analysis/log_parser.py in verify-rust-std:
// one { thread_id, result } record per harness, plus one per function autoharness skipped.
const records = JSON.parse(readFileSync(resolve(resultsArg), "utf8")).map((record) => record.result);

const VERDICTS = ["verified", "failed", "timedOut", "error"];

function verdict(r) {
  if (r.result === null) return "notRun";
  if (r.result.startsWith("SUCCESSFUL")) return "verified";
  // log_parser records a CBMC timeout as time "TO" on a FAILED result.
  if (r.time === "TO") return "timedOut";
  if (r.n_failed_properties > 0) return "failed";
  // FAILED with no failed property: CBMC or Kani stopped before a verdict (error, out of memory).
  return "error";
}

// A function shared by several crates is reported as arrays; attribute it to the first.
const first = (value) => (Array.isArray(value) ? value[0] : value);
// log_parser leaves crate null for dependencies; their path still names the crate,
// e.g. "<cargo-registry>/libc-0.2.191/src/types.rs" or "library/kani_core/src/...".
function crateFromPath(file) {
  const match = /<cargo-registry>\/([A-Za-z0-9_-]+?)-\d+\.\d+[^/]*\//.exec(file ?? "") ?? /(?:^|\/)library\/([^/]+)\//.exec(file ?? "");
  return match ? match[1].replaceAll("-", "_") : null;
}
const seconds = (time) => (time && time.endsWith("s") ? Number.parseFloat(time) : null);

const emptyCounts = () => ({ harnesses: 0, verified: 0, failed: 0, timedOut: 0, error: 0 });
function add(counts, v) {
  counts.harnesses += 1;
  counts[v] += 1;
}

const summary = { ...emptyCounts(), notRun: 0, skipped: 0 };
const byCrate = new Map();
const bySafety = new Map();
const harnesses = [];

for (const r of records) {
  if (!r.is_autoharness) continue;
  const generated = r.autoharness_result === "ok" || r.result !== null;
  if (!generated) {
    // "Did not match provided filters" means the run never asked for it, which is not a skip.
    if (r.autoharness_result && r.autoharness_result !== "Did not match provided filters") summary.skipped += 1;
    continue;
  }
  const v = verdict(r);
  // Generated but absent from the verification log: counted on its own, outside the totals.
  if (v === "notRun") {
    summary.notRun += 1;
    continue;
  }
  const crate = first(r.crate) ?? crateFromPath(r.file_name) ?? "unknown";
  const safety = first(r.function_safeness) ?? "unknown";
  add(summary, v);
  if (!byCrate.has(crate)) byCrate.set(crate, emptyCounts());
  if (!bySafety.has(safety)) bySafety.set(safety, emptyCounts());
  add(byCrate.get(crate), v);
  add(bySafety.get(safety), v);
  harnesses.push({
    function: r.function ?? r.harness,
    crate,
    safety,
    verdict: v,
    failedProperties: r.n_failed_properties,
    totalProperties: r.n_total_properties,
    seconds: seconds(r.time),
  });
}

if (summary.harnesses === 0) throw new Error("No automatic harnesses found in the results file");

const rows = (map) =>
  [...map].map(([name, counts]) => ({ name, ...counts })).sort((a, b) => b.harnesses - a.harnesses);
const safetyOrder = ["safe", "safe abstraction", "unsafe", "unknown"];

const latest = {
  date,
  note,
  summary,
  crates: rows(byCrate),
  safety: rows(bySafety).sort((a, b) => safetyOrder.indexOf(a.name) - safetyOrder.indexOf(b.name)),
};

const historyDir = join(outDir, "history");
mkdirSync(historyDir, { recursive: true });
writeFileSync(join(outDir, "latest.json"), `${JSON.stringify(latest, null, 2)}\n`);
writeFileSync(join(outDir, "harnesses.json"), `${JSON.stringify({ date, harnesses })}\n`);
writeFileSync(join(historyDir, `${date}.json`), `${JSON.stringify({ date, note, summary }, null, 2)}\n`);

// The page reads one file, so rebuild the index from every saved run.
const history = readdirSync(historyDir)
  .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
  .sort()
  .map((name) => JSON.parse(readFileSync(join(historyDir, name), "utf8")));
writeFileSync(join(historyDir, "index.json"), `${JSON.stringify(history, null, 2)}\n`);

const pct = (n) => `${((n / summary.harnesses) * 100).toFixed(1)}%`;
console.log(`${date}: ${summary.harnesses} harnesses`);
for (const key of VERDICTS) console.log(`  ${key.padEnd(9)} ${String(summary[key]).padStart(6)}  ${pct(summary[key])}`);
console.log(`  ${summary.notRun} generated harnesses have no verdict in the log and are left out`);
console.log(`Wrote ${outDir}/latest.json, harnesses.json and history/${date}.json (${history.length} runs in history)`);
