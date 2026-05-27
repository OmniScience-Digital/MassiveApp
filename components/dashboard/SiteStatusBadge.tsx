import React from "react";

export type SiteStatus = "prod" | "test" | "off" | string;

export function StatusBadge({ status }: { status: SiteStatus }) {
  const s = (status || "").toLowerCase();
  const styles =
    s === "prod"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : s === "test"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  const dot =
    s === "prod" ? "bg-green-500" : s === "test" ? "bg-yellow-500" : "bg-red-500";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status || "off"}
    </span>
  );
}

export function completenessScore(sitedata: any): { score: number; total: number; missing: string[] } {
  const missing: string[] = [];
  const c = sitedata?.siteConstants || {};
  const checks = [
    { label: "Primary scale", ok: Array.isArray(sitedata?.primaryScales) && sitedata.primaryScales.length > 0 },
    { label: "Scales", ok: Array.isArray(sitedata?.scales) && sitedata.scales.length > 0 },
    { label: "Running TPH", ok: c.runningTph > 0 },
    { label: "Max utilization", ok: c.maxUtilization > 0 },
    { label: "Month target", ok: c.totalMonthTarget > 0 },
    { label: "Dynamic inputs", ok: Array.isArray(sitedata?.dynamic_inputs) && sitedata.dynamic_inputs.length > 0 },
    { label: "Report schedules", ok: sitedata?.siteTimes?.dayStop !== "23:59" || sitedata?.siteTimes?.nightStop !== "23:59" },
  ];
  checks.forEach(({ label, ok }) => { if (!ok) missing.push(label); });
  return { score: checks.filter((c) => c.ok).length, total: checks.length, missing };
}
