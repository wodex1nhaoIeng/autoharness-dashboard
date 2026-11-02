<script setup lang="ts">
import { num, verdictLabels } from "~/utils/data";
useHead({ title: "Harnesses · Autoharness verification" });

const { data, error, status } = await useData<{ date: string; harnesses: Harness[] }>("harnesses", "harnesses.json");

const query = ref("");
const crate = ref("all");
const verdict = ref<"all" | Verdict>("all");
const safety = ref("all");
type SortKey = "function" | "failedProperties" | "seconds";
const sort = ref<{ key: SortKey; desc: boolean }>({ key: "function", desc: false });
const page = ref(0);
const perPage = 100;

const all = computed(() => data.value?.harnesses ?? []);
const distinct = (pick: (h: Harness) => string) => [...new Set(all.value.map(pick))].sort();
const crates = computed(() => distinct((h) => h.crate));
const safeties = computed(() => distinct((h) => h.safety));
const verdicts = computed(() => (Object.keys(verdictLabels) as Verdict[]).filter((v) => all.value.some((h) => h.verdict === v)));

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const rows = all.value.filter(
    (h) =>
      (crate.value === "all" || h.crate === crate.value) &&
      (verdict.value === "all" || h.verdict === verdict.value) &&
      (safety.value === "all" || h.safety === safety.value) &&
      (!needle || h.function.toLowerCase().includes(needle)),
  );
  const { key, desc } = sort.value;
  const sign = desc ? -1 : 1;
  return rows.sort((a, b) => {
    const [x, y] = [a[key], b[key]];
    if (x === null) return 1;
    if (y === null) return -1;
    return sign * (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number));
  });
});
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const shown = computed(() => filtered.value.slice(page.value * perPage, (page.value + 1) * perPage));
watch([query, crate, verdict, safety, sort], () => (page.value = 0));

function sortBy(key: SortKey) {
  sort.value = sort.value.key === key ? { key, desc: !sort.value.desc } : { key, desc: key !== "function" };
}
const arrow = (key: SortKey) => (sort.value.key === key ? (sort.value.desc ? " ↓" : " ↑") : "");
const time = (s: number | null) => (s === null ? "—" : s < 1 ? `${(s * 1000).toFixed(0)} ms` : s < 60 ? `${s.toFixed(1)} s` : `${(s / 60).toFixed(1)} min`);
</script>

<template>
  <main class="page">
    <h1 class="page-title">Harnesses</h1>
    <p class="page-meta">Run of {{ data?.date ?? "…" }} · one row per automatically generated harness</p>

    <div class="filters">
      <input v-model="query" class="form-control search" type="search" placeholder="Filter by function name" aria-label="Filter by function name">
      <select v-model="verdict" class="form-control" aria-label="Result">
        <option value="all">All results</option>
        <option v-for="v in verdicts" :key="v" :value="v">{{ verdictLabels[v] }}</option>
      </select>
      <select v-model="crate" class="form-control" aria-label="Crate">
        <option value="all">All crates</option>
        <option v-for="c in crates" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="safety" class="form-control" aria-label="Safety">
        <option value="all">All safety</option>
        <option v-for="s in safeties" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="error" class="state">Could not load harnesses: {{ error.message }}</div>
    <div v-else-if="status === 'pending'" class="state">Loading harnesses…</div>
    <section v-else class="box">
      <div class="box-header"><span class="count">{{ num(filtered.length) }} harnesses</span></div>
      <div class="scroll">
        <table class="table harness-table">
          <thead>
            <tr>
              <th>Result</th>
              <th class="fn"><button class="sort" @click="sortBy('function')">Function{{ arrow("function") }}</button></th>
              <th class="hide-sm">Crate</th>
              <th class="hide-sm">Safety</th>
              <th><button class="sort" @click="sortBy('failedProperties')">Failed{{ arrow("failedProperties") }}</button></th>
              <th><button class="sort" @click="sortBy('seconds')">Time{{ arrow("seconds") }}</button></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in shown" :key="h.function + h.crate">
              <td><span class="label" :class="h.verdict">{{ verdictLabels[h.verdict] }}</span></td>
              <td class="fn"><code>{{ h.function }}</code></td>
              <td class="hide-sm">{{ h.crate }}</td>
              <td class="hide-sm">{{ h.safety }}</td>
              <td><template v-if="h.totalProperties !== null">{{ num(h.failedProperties ?? 0) }} <span class="muted">/ {{ num(h.totalProperties) }}</span></template><span v-else class="muted">—</span></td>
              <td>{{ h.verdict === "timedOut" ? "limit" : time(h.seconds) }}</td>
            </tr>
            <tr v-if="!shown.length"><td colspan="6" class="empty">No harnesses match these filters.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button class="btn" :disabled="page === 0" @click="page--">Previous</button>
        <span class="muted">Page {{ page + 1 }} of {{ pages }}</span>
        <button class="btn" :disabled="page >= pages - 1" @click="page++">Next</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.filters { display: grid; grid-template-columns: 1fr repeat(3, 160px); gap: 8px; margin-bottom: 16px; }
.count { font-weight: 600; }
.scroll { overflow-x: auto; }
.harness-table .fn { width: 100%; text-align: left; white-space: normal; }
.harness-table td.fn code { overflow-wrap: anywhere; }
.harness-table th:nth-child(3), .harness-table td:nth-child(3), .harness-table th:nth-child(4), .harness-table td:nth-child(4) { text-align: left; }
.sort { padding: 0; border: 0; background: none; color: inherit; font-weight: inherit; cursor: pointer; }
.sort:hover { color: var(--accent); }
.muted { color: var(--fg-muted); }
.empty { padding: 32px; text-align: center !important; color: var(--fg-muted); }
.pager { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px 16px; border-top: 1px solid var(--border-muted); font-size: 12px; }
@media (max-width: 768px) { .filters { grid-template-columns: 1fr 1fr; } .search { grid-column: 1 / -1; } }
@media (max-width: 620px) { .hide-sm { display: none; } .harness-table .fn { min-width: 200px; } .harness-table th, .harness-table td { padding: 8px 10px; } }
</style>
