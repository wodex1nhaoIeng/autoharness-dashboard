<script setup lang="ts">
import { num, pct } from "~/utils/data";
defineProps<{ rows: Row[]; first: string }>();
</script>

<template>
  <div class="scroll">
    <table class="table">
      <thead>
        <tr><th>{{ first }}</th><th>Harnesses</th><th>Verified</th><th>Failed</th><th>Timed out</th><th class="wide">Error</th><th class="wide">Verified rate</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <td><strong>{{ row.name }}</strong></td>
          <td>{{ num(row.harnesses) }}</td>
          <td>{{ num(row.verified) }}</td>
          <td>{{ num(row.failed) }}</td>
          <td>{{ num(row.timedOut) }}</td>
          <td class="wide">{{ num(row.error) }}</td>
          <td class="wide">
            <span class="rate"><span class="track"><span :style="{ width: pct(row.verified, row.harnesses) }" /></span>{{ pct(row.verified, row.harnesses) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.scroll { overflow-x: auto; }
.rate { display: inline-flex; align-items: center; gap: 8px; }
.track { width: 64px; height: 6px; border-radius: 3px; background: var(--neutral-soft); overflow: hidden; }
.track span { display: block; height: 100%; background: var(--success); }
@media (max-width: 620px) { .wide { display: none; } .table th, .table td { padding: 8px 10px; } }
</style>
