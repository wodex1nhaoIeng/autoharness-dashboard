<script setup lang="ts">
import { num } from "~/utils/data";
const props = defineProps<{ points: HistoryPoint[] }>();

// Each line also has its own dash pattern and an end label, so red and green never carry identity alone.
const series = [
  { key: "verified", label: "Verified", color: "var(--success)", dash: "" },
  { key: "failed", label: "Failed", color: "var(--danger)", dash: "6 4" },
  { key: "timedOut", label: "Timed out", color: "var(--attention)", dash: "2 3" },
] as const;

const host = ref<HTMLElement>();
const width = ref(720);
const height = 240;
const pad = { top: 16, right: 84, bottom: 28, left: 56 };
let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); });
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => observer?.disconnect());

const times = computed(() => props.points.map((p) => Date.parse(p.date)));
const yMax = computed(() => {
  const max = Math.max(1, ...props.points.flatMap((p) => series.map((s) => p.summary[s.key])));
  const step = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / step) * step;
});
const yTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax.value));

function x(index: number) {
  const [lo, hi] = [times.value[0]!, times.value[times.value.length - 1]!];
  const inner = width.value - pad.left - pad.right;
  return pad.left + (hi === lo ? inner / 2 : ((times.value[index]! - lo) / (hi - lo)) * inner);
}
const y = (value: number) => pad.top + (1 - value / yMax.value) * (height - pad.top - pad.bottom);

const paths = computed(() =>
  series.map((s) => ({
    ...s,
    d: props.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.summary[s.key]).toFixed(1)}`).join(""),
    last: props.points[props.points.length - 1]!.summary[s.key],
  })),
);

// End labels: spread apart vertically when the last values are close.
const endLabels = computed(() => {
  const labels = paths.value.map((p) => ({ ...p, ly: y(p.last) })).sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < labels.length; i++) labels[i]!.ly = Math.max(labels[i]!.ly, labels[i - 1]!.ly + 26);
  return labels;
});

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const shortDate = (date: string) => dateFmt.format(new Date(date));
const xLabels = computed(() => {
  const every = Math.ceil(props.points.length / Math.max(2, Math.floor((width.value - pad.left - pad.right) / 70)));
  return props.points.map((p, i) => ({ i, text: shortDate(p.date) })).filter(({ i }) => i % every === 0 || i === props.points.length - 1);
});

const hover = ref<number | null>(null);
function onMove(event: PointerEvent) {
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
  const px = event.clientX - rect.left;
  let best = 0;
  for (let i = 1; i < props.points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
  hover.value = best;
}
const hovered = computed(() => (hover.value === null ? null : props.points[hover.value]!));
const showTable = ref(false);
</script>

<template>
  <div ref="host" class="chart">
    <svg :width="width" :height="height" role="img" :aria-label="`Verified, failed and timed-out harnesses over ${points.length} runs`" @pointermove="onMove" @pointerleave="hover = null">
      <g class="grid">
        <g v-for="t in yTicks" :key="t">
          <line :x1="pad.left" :x2="width - pad.right" :y1="y(t)" :y2="y(t)" />
          <text :x="pad.left - 8" :y="y(t)" dy="0.32em" text-anchor="end">{{ num(t) }}</text>
        </g>
        <text v-for="l in xLabels" :key="l.i" :x="x(l.i)" :y="height - 8" text-anchor="middle">{{ l.text }}</text>
      </g>
      <line v-if="hover !== null" class="crosshair" :x1="x(hover)" :x2="x(hover)" :y1="pad.top" :y2="height - pad.bottom" />
      <g v-for="p in paths" :key="p.key">
        <path :d="p.d" fill="none" :stroke="p.color" stroke-width="2" :stroke-dasharray="p.dash" stroke-linejoin="round" stroke-linecap="round" />
        <circle v-for="(pt, i) in points" :key="pt.date" :cx="x(i)" :cy="y(pt.summary[p.key])" :r="hover === i ? 5 : 3.5" :fill="p.color" class="dot" />
      </g>
      <text v-for="l in endLabels" :key="l.key" class="end-label" :x="width - pad.right + 10" :y="l.ly" dy="0.32em">
        <tspan :fill="l.color">●</tspan> {{ l.label }}<tspan class="end-value" :x="width - pad.right + 22" dy="13">{{ num(l.last) }}</tspan>
      </text>
    </svg>
    <div v-if="hovered" class="tooltip" :style="{ left: `${Math.min(x(hover!) + 12, width - 180)}px` }">
      <strong>{{ hovered.date }}</strong>
      <div v-for="s in series" :key="s.key" class="tip-row">
        <span><i :style="{ background: s.color }" />{{ s.label }}</span><b>{{ num(hovered.summary[s.key]) }}</b>
      </div>
      <div class="tip-row muted"><span>Harnesses</span><b>{{ num(hovered.summary.harnesses) }}</b></div>
      <div v-if="hovered.note" class="tip-note">{{ hovered.note }}</div>
    </div>
    <button class="btn table-toggle" @click="showTable = !showTable">{{ showTable ? "Hide table" : "Show as table" }}</button>
    <table v-if="showTable" class="table history-table">
      <thead><tr><th>Run</th><th>Harnesses</th><th>Verified</th><th>Failed</th><th>Timed out</th><th>Error</th></tr></thead>
      <tbody>
        <tr v-for="p in [...points].reverse()" :key="p.date">
          <td>{{ p.date }}</td><td>{{ num(p.summary.harnesses) }}</td><td>{{ num(p.summary.verified) }}</td>
          <td>{{ num(p.summary.failed) }}</td><td>{{ num(p.summary.timedOut) }}</td><td>{{ num(p.summary.error) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.chart { position: relative; }
svg { display: block; overflow: visible; touch-action: pan-y; }
.grid line { stroke: var(--border-muted); stroke-width: 1; }
.grid text, .end-value { fill: var(--fg-muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.crosshair { stroke: var(--fg-muted); stroke-width: 1; stroke-dasharray: 3 3; }
.dot { stroke: var(--bg); stroke-width: 2; }
.end-label { fill: var(--fg); font-size: 12px; }
.tooltip { position: absolute; top: 8px; width: 170px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); box-shadow: 0 6px 18px #1f232826; font-size: 12px; pointer-events: none; }
.tip-row { display: flex; justify-content: space-between; gap: 8px; font-variant-numeric: tabular-nums; }
.tip-row i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; }
.tip-row.muted { margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border-muted); color: var(--fg-muted); }
.tip-note { margin-top: 4px; color: var(--fg-muted); white-space: normal; }
.table-toggle { margin-top: 8px; }
.history-table { margin-top: 12px; }
.history-table th, .history-table td { padding: 6px 12px; }
</style>
