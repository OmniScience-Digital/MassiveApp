"use client";
import React from "react";
import { StatusBadge } from "./StatusBadge";
import { ReportItem } from "@/types/schema";
import { buildChecklist } from "./SiteCompletenessPanel";

interface Props {
  site: ReportItem;
  siteName: string;
  reportType: string;
}

export function SiteHeaderCard({ site, siteName, reportType }: Props) {
  const items = buildChecklist(site);
  const criticalMissing = items.filter((i) => i.critical && !i.ok).length;
  const score = items.filter((i) => i.ok).length;
  const total = items.length;
  const pct = Math.round((score / total) * 100);

  const barColor =
    criticalMissing > 0 ? "bg-red-500" : pct >= 80 ? "bg-green-500" : "bg-yellow-500";

  return (
    <div className="px-4 pt-3 pb-2 border-b bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{siteName}</h1>
            <StatusBadge status={site.siteStatus || "off"} />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{reportType}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {site.siteConstants?.siteType || "—"} &middot; {site.siteConstants?.scaleType || "—"} &middot; Report to: {site.siteConstants?.reportTo || "—"}
          </p>
        </div>
        {/* Mini progress — clicking expands the panel below */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{score}/{total} configured</span>
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          {criticalMissing > 0 && (
            <span className="text-xs font-medium text-red-500">{criticalMissing} critical</span>
          )}
        </div>
      </div>
    </div>
  );
}
