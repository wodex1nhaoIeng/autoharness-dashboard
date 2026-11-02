<script setup lang="ts">
import { num, pct } from "~/utils/data";
useHead({ title: "Autoharness verification" });

const { data: latest, error } = await useData<Latest>("latest", "latest.json");
const { data: history } = await useData<HistoryPoint[]>("history", "history/index.json");

const tiles = [
  { key: "verified", label: "Verified" },
  { key: "failed", label: "Failed" },
  { key: "timedOut", label: "Timed out" },
  { key: "error", label: "Error" },
] as const;

// Change against the previous saved run, for the small arrow under each number.
const previous = computed(() => {
  const runs = history.value ?? [];
  const at = runs.findIndex((p) => p.date === latest.value?.date);
  return at > 0 ? runs[at - 1]!.summary : null;
});
function change(key: keyof Summary) {
  if (!previous.value || !latest.value) return null;
  const diff = latest.value.summary[key] - previous.value[key];
  return { diff, text: `${diff > 0 ? "+" : ""}${num(diff)}` };
}

const showAllCrates = ref(false);
const crates = computed(() => (showAllCrates.value ? latest.value?.crates : latest.value?.crates.slice(0, 10)) ?? []);
const segments = ["verified", "failed", "timedOut", "error"] as const;
</script>

<template>
  <main class="page">
    <div v-if="error" class="state">Could not load the latest run: {{ error.message }}</div>
    <template v-else-if="latest">
      <h1 class="page-title">Autoharness verification</h1>
      <p class="page-meta">Run of {{ latest.date }} · {{ num(latest.summary.harnesses) }} automatically generated harnesses<template v-if="latest.note"> · {{ latest.note }}</template></p>

      <section class="stats" aria-label="Latest run">
        <div class="stat">
          <span class="stat-label">Generated harnesses</span>
          <strong class="stat-value">{{ num(latest.summary.harnesses) }}</strong>
          <span v-if="change('harnesses')" class="stat-sub">{{ change('harnesses')!.text }} since last run</span>
        </div>
        <div v-for="t in tiles" :key="t.key" class="stat" :class="t.key">
          <span class="stat-label"><i class="swatch" />{{ t.label }}</span>
          <strong class="stat-value">{{ num(latest.summary[t.key]) }}</strong>
          <span class="stat-sub">{{ pct(latest.summary[t.key], latest.summary.harnesses) }}<template v-if="change(t.key)"> · {{ change(t.key)!.text }}</template></span>
        </div>
      </section>
      <div class="bar" aria-hidden="true">
        <span v-for="s in segments" :key="s" :class="s" :style="{ flexGrow: latest.summary[s] }" />
      </div>

      <section v-if="history?.length" class="box">
        <div class="box-header"><h2 class="box-title">Over time</h2><span class="muted">{{ history.length }} {{ history.length === 1 ? "run" : "runs" }}</span></div>
        <div class="box-body"><HistoryChart :points="history" /></div>
      </section>

      <section class="box">
        <div class="box-header"><h2 class="box-title">By crate</h2></div>
        <BreakdownTable :rows="crates" first="Crate" />
        <div v-if="latest.crates.length > 10" class="box-footer">
          <button class="btn" @click="showAllCrates = !showAllCrates">{{ showAllCrates ? "Show top 10" : `Show all ${latest.crates.length} crates` }}</button>
        </div>
      </section>
      <section class="box">
        <div class="box-header"><h2 class="box-title">By safety</h2></div>
        <BreakdownTable :rows="latest.safety" first="Function" />
      </section>

      <p class="footnote">
        Verified means Kani proved every property of the generated harness. Failed means at least one property failed;
        timed out means the harness hit the run's time limit; error means Kani or CBMC stopped before a verdict.
        <template v-if="latest.summary.notRun"> {{ num(latest.summary.notRun) }} more generated harnesses have no verdict in the log and are not counted.</template>
        Source: <code>results.json</code> from <code>log_parser.py</code>.
      </p>
    </template>
  </main>
</template>

<style scoped>
.stats { display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.stat { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-left: 1px solid var(--border); }
.stat:first-child { border-left: 0; }
.stat-label { display: flex; align-items: center; gap: 6px; color: var(--fg-muted); font-size: 12px; font-weight: 500; }
.stat-value { font-size: 28px; font-weight: 600; line-height: 1.25; font-variant-numeric: tabular-nums; }
.stat-sub { color: var(--fg-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.swatch { width: 8px; height: 8px; border-radius: 50%; }
.verified .swatch { background: var(--success); }
.failed .swatch { background: var(--danger); }
.timedOut .swatch { background: var(--attention); }
.error .swatch { background: var(--neutral); }
.bar { display: flex; gap: 2px; height: 8px; margin: 8px 0 24px; border-radius: 6px; overflow: hidden; }
.bar span { min-width: 2px; }
.bar .verified { background: var(--success); }
.bar .failed { background: var(--danger); }
.bar .timedOut { background: var(--attention); }
.bar .error { background: var(--neutral); }
.muted { color: var(--fg-muted); font-size: 12px; }
.box-footer { padding: 8px 16px; border-top: 1px solid var(--border-muted); }
.footnote { margin: 8px 0 0; color: var(--fg-muted); font-size: 12px; }
@media (max-width: 768px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stat { border-left: 0; border-top: 1px solid var(--border); }
  .stat:first-child { grid-column: 1 / -1; border-top: 0; }
  .stat:nth-child(odd):not(:first-child) { border-left: 1px solid var(--border); }
}
</style>
