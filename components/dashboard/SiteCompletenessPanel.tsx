"use client";
import React, { useState } from "react";
import { ReportItem } from "@/types/schema";
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────────────
// siteConstants values come back as strings from DynamoDB ("25", "30000")
const asNum = (v: any) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const hasDatasourcekeys = (site: ReportItem) =>
  (site.dynamic_inputs || []).some(
    (d) => d.inputListName?.toLowerCase().replace(/\s/g, "") === "datasourcekeys"
  );

const hasRptConfig = (site: ReportItem) =>
  (site.rpt_inputs || []).length > 0 || (site.rpt_tables || []).length > 0;

// ─── checklist definition ──────────────────────────────────────────────────
export type CheckItem = {
  key: string;
  label: string;
  description: string;
  critical: boolean; // red if missing, yellow if not
  ok: boolean;
  tab?: string; // which dashboard tab to go fix it
};

export function buildChecklist(site: ReportItem): CheckItem[] {
  const c = site.siteConstants || ({} as any);
  return [
    // ── Critical — site won't report correctly without these ──
    {
      key: "siteName",
      label: "Site Name",
      description: "Site name is required for all reports",
      critical: true,
      ok: !!c.siteName?.trim(),
      tab: "configuration",
    },
    {
      key: "primaryScales",
      label: "Primary Scale",
      description: "At least one primary scale must be selected",
      critical: true,
      ok: (site.primaryScales || []).length > 0,
      tab: "configuration",
    },
    {
      key: "scales",
      label: "Scales configured",
      description: "At least one scale with ICCID must exist",
      critical: true,
      ok: (site.scales || []).some((s) => s.scalename && s.iccid),
      tab: "scales",
    },
    {
      key: "datasourcekeys",
      label: "Datasource Keys",
      description: "Datasourcekeys input list required for data queries",
      critical: true,
      ok: hasDatasourcekeys(site),
      tab: "custom",
    },
    {
      key: "runningTph",
      label: "Running TPH",
      description: "Running tonnes per hour — used in utilization calculations",
      critical: true,
      ok: asNum(c.runningTph) > 0,
      tab: "configuration",
    },
    {
      key: "maxUtilization",
      label: "Max Utilization",
      description: "Maximum utilization hours — required for % calculation",
      critical: true,
      ok: asNum(c.maxUtilization) > 0,
      tab: "configuration",
    },
    {
      key: "totalMonthTarget",
      label: "Month Target",
      description: "Monthly tonnage target — used in progress reporting",
      critical: true,
      ok: asNum(c.totalMonthTarget) > 0,
      tab: "configuration",
    },
    {
      key: "siteType",
      label: "Site Type",
      description: "IOT / PLC / IOT and PLC",
      critical: true,
      ok: !!c.siteType?.trim(),
      tab: "configuration",
    },
    {
      key: "scaleType",
      label: "Scale Type",
      description: "Single / Series / Parallel",
      critical: true,
      ok: !!c.scaleType?.trim(),
      tab: "configuration",
    },
    // ── Important — affect specific report types ──
    {
      key: "siteTimes",
      label: "Shift times",
      description: "At least one shift (day or night) must be configured",
      critical: false,
      ok:
        site.siteTimes?.dayStop !== "23:59" ||
        site.siteTimes?.nightStop !== "23:59",
      tab: "schedules",
    },
    {
      key: "reportTo",
      label: "Report To",
      description: "Telegram / Email destination",
      critical: false,
      ok: !!c.reportTo?.trim(),
      tab: "configuration",
    },
    {
      key: "telegramId",
      label: "Telegram ID",
      description: "Required when reporting to Telegram",
      critical: false,
      ok:
        c.reportTo === "Email" ||
        (!!c.telegramId?.trim() && c.telegramId !== "0"),
      tab: "configuration",
    },
    {
      key: "shiftftp",
      label: "Shift FTP",
      description: "Totalizer or Monthtons — determines how shift data is fetched",
      critical: false,
      ok: !!c.shiftftp?.trim(),
      tab: "configuration",
    },
    {
      key: "rptConfig",
      label: "RPT Configuration",
      description: "Rand Per Ton inputs and date index table",
      critical: false,
      ok: hasRptConfig(site),
      tab: "rpt",
    },
    {
      key: "dynamicInputs",
      label: "Dynamic inputs",
      description: "PLC Configs, Hourly Configs etc.",
      critical: false,
      ok: (site.dynamic_inputs || []).length > 0,
      tab: "custom",
    },
  ];
}

// ─── component ─────────────────────────────────────────────────────────────
interface Props {
  site: ReportItem;
  onTabChange?: (tab: string) => void;
}

export function SiteCompletenessPanel({ site, onTabChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const items = buildChecklist(site);

  const criticalItems = items.filter((i) => i.critical);
  const importantItems = items.filter((i) => !i.critical);

  const criticalMissing = criticalItems.filter((i) => !i.ok);
  const importantMissing = importantItems.filter((i) => !i.ok);

  const score = items.filter((i) => i.ok).length;
  const total = items.length;
  const pct = Math.round((score / total) * 100);

  const barColor =
    criticalMissing.length > 0
      ? "bg-red-500"
      : importantMissing.length > 0
      ? "bg-yellow-500"
      : "bg-green-500";

  const statusLabel =
    criticalMissing.length > 0
      ? `${criticalMissing.length} critical issue${criticalMissing.length > 1 ? "s" : ""}`
      : importantMissing.length > 0
      ? `${importantMissing.length} warning${importantMissing.length > 1 ? "s" : ""}`
      : "Fully configured";

  const statusColor =
    criticalMissing.length > 0
      ? "text-red-600 dark:text-red-400"
      : importantMissing.length > 0
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-green-600 dark:text-green-400";

  return (
    <div className="mx-2 mb-2 mt-1  rounded-lg border bg-background overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Site Completeness</span>
          <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{score}/{total}</span>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-4">
          {/* Critical */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Critical — breaks reporting if missing
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {criticalItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => item.tab && onTabChange?.(item.tab)}
                  title={item.description}
                  className={`flex items-start gap-2 text-left rounded-md px-2.5 py-2 text-xs transition-colors
                    ${item.ok
                      ? "bg-green-50 dark:bg-green-900/10 text-muted-foreground cursor-default"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
                    }`}
                >
                  {item.ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {!item.ok && (
                      <p className="text-red-500/80 dark:text-red-400/70 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Important */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Important — affects specific features
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {importantItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => item.tab && onTabChange?.(item.tab)}
                  title={item.description}
                  className={`flex items-start gap-2 text-left rounded-md px-2.5 py-2 text-xs transition-colors
                    ${item.ok
                      ? "bg-green-50 dark:bg-green-900/10 text-muted-foreground cursor-default"
                      : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer"
                    }`}
                >
                  {item.ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {!item.ok && (
                      <p className="text-yellow-600/80 dark:text-yellow-400/70 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
