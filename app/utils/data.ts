export type Verdict = "verified" | "failed" | "timedOut" | "error";
export type Counts = { harnesses: number } & Record<Verdict, number>;
export type Summary = Counts & { notRun: number; skipped: number };
export type Row = Counts & { name: string };
export type Latest = { date: string; note: string | null; summary: Summary; crates: Row[]; safety: Row[] };
export type HistoryPoint = { date: string; note: string | null; summary: Summary };
export type Harness = {
  function: string;
  crate: string;
  safety: string;
  verdict: Verdict;
  failedProperties: number | null;
  totalProperties: number | null;
  seconds: number | null;
};

export const verdictLabels: Record<Verdict, string> = {
  verified: "Verified",
  failed: "Failed",
  timedOut: "Timed out",
  error: "Error",
};

const nf = new Intl.NumberFormat("en-US");
export const num = (value: number) => nf.format(value);
export const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "—");

export function useData<T>(key: string, path: string) {
  const baseURL = useRuntimeConfig().app.baseURL;
  return useAsyncData(key, () => $fetch<T>(`${baseURL}data/${path}`));
}
