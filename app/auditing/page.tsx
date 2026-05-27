"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { client } from "@/service/schemaClient";
import { ReportItem } from "@/types/schema";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, EditIcon, ClipboardList, Database } from "lucide-react";

type View = "home" | "sites" | "data";

const Auditor = () => {
  const [view, setView] = useState<View>("home");
  const [loading, setLoading] = useState(false);
  const [submittedsites, setSubmitted] = useState<ReportItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (view !== "sites") return;
    setLoading(true);
    const sub = client.models.Sites.observeQuery().subscribe({
      next: (data) => {
        const sites = data.items
          .map((report) => {
            const p = typeof report.site === "string" ? JSON.parse(report.site) : {};
            p.id = report.id;
            return p;
          })
          .filter((site) => site.audit === true)
          .sort((a, b) => a.siteConstants?.siteName?.localeCompare(b.siteConstants?.siteName));
        setSubmitted(sites as ReportItem[]);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => sub.unsubscribe();
  }, [view]);

  const columns: ColumnDef<object, any>[] = [
    {
      accessorKey: "sitename",
      header: ({ column }: { column: any }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Site Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "monthStart",
      header: ({ column }: { column: any }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Month Start <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "dayStop",
      header: "Day Stop",
    },
    {
      accessorKey: "nightStop",
      header: "Night Stop",
    },
    {
      accessorKey: "edit",
      header: "Open",
      cell: ({ row }: { row: any }) => (
        <Button
          className="cursor-pointer"
          onClick={() => router.push(`/auditinDashboard/${row.original.sitename}/${row.original.id}`)}
        >
          <EditIcon className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const data = submittedsites.map((site) => ({
    id: site.id || "",
    sitename: site.siteConstants?.siteName || "",
    monthStart: site.siteTimes?.monthstart || "",
    dayStop: site.siteTimes?.dayStop || "",
    nightStop: site.siteTimes?.nightStop || "",
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mt-20 p-4">

        {/* ── Home — choose where to go ── */}
        {view === "home" && (
          <div className="max-w-2xl mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-1">Auditing</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Choose what you want to do.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Audit Sites */}
              <button
                onClick={() => setView("sites")}
                className="group rounded-xl border p-6 text-left hover:border-gray-500 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="font-semibold text-base">Audit Sites</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  View sites with auditing enabled, open their dashboards and run audit reports.
                </p>
              </button>

              {/* Manage Data */}
              <button
                onClick={() => setView("data")}
                className="group rounded-xl border p-6 text-left hover:border-gray-500 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <Database className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="font-semibold text-base">Manage Data</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Delete records from AuditorReports, InputTable or PurplefigureTable by date range and site.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ── Audit Sites table ── */}
        {view === "sites" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setView("home")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
              <h1 className="text-lg font-semibold">Audit Sites</h1>
            </div>
            {loading ? <Loading /> : (
              <DataTable title="" data={data} columns={columns} pageSize={10} storageKey="auditSitesPagination" />
            )}
          </>
        )}

        {/* ── Manage Data ── */}
        {view === "data" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setView("home")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
              <h1 className="text-lg font-semibold">Manage Data</h1>
            </div>
            <DataManager />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Data Manager — delete records by date range
// ─────────────────────────────────────────────────────────────────────────────

type TableKey = "AuditorReports" | "InputTable" | "PurplefigureTable";

const TABLE_META: Record<TableKey, { label: string; color: string; description: string }> = {
  AuditorReports: {
    label: "Auditor Reports",
    color: "blue",
    description: "Scale runtime and audit data",
  },
  InputTable: {
    label: "Input Data",
    color: "purple",
    description: "Hourly input values per ICCID",
  },
  PurplefigureTable: {
    label: "Purple Figures",
    color: "pink",
    description: "Daily purple figure totals per ICCID",
  },
};

type DeleteResult = {
  table: TableKey;
  deleted: number;
  failed: number;
};

type SiteOption = { id: string; name: string };

function DataManager() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("__all__");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTables, setSelectedTables] = useState<Set<TableKey>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<DeleteResult[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewCounts, setPreviewCounts] = useState<Record<TableKey, number | null>>({
    AuditorReports: null,
    InputTable: null,
    PurplefigureTable: null,
  });
  const [previewing, setPreviewing] = useState(false);

  // Load sites
  useEffect(() => {
    client.models.Sites.list().then(({ data }) => {
      const opts = data
        .map((r) => {
          const p = typeof r.site === "string" ? JSON.parse(r.site) : {};
          return { id: r.id, name: p.siteConstants?.siteName || r.id };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      setSites(opts);
    });
  }, []);

  const toggleTable = (t: TableKey) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
    setResults(null);
    setPreviewCounts({ AuditorReports: null, InputTable: null, PurplefigureTable: null });
  };

  const toggleAll = () => {
    if (selectedTables.size === 3) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(["AuditorReports", "InputTable", "PurplefigureTable"] as TableKey[]));
    }
    setResults(null);
  };

  const isValid = startDate && endDate && endDate >= startDate && selectedTables.size > 0;

  // Preview: count how many records would be deleted
  const handlePreview = async () => {
    if (!isValid) return;
    setPreviewing(true);
    setPreviewCounts({ AuditorReports: null, InputTable: null, PurplefigureTable: null });

    const siteIds =
      selectedSite === "__all__" ? sites.map((s) => s.id) : [selectedSite];

    const counts: Record<TableKey, number> = {
      AuditorReports: 0,
      InputTable: 0,
      PurplefigureTable: 0,
    };

    await Promise.all(
      Array.from(selectedTables).map(async (table) => {
        let total = 0;
        for (const siteId of siteIds) {
          if (table === "AuditorReports") {
            const { data } = await client.models.AuditorReports.listAuditorReportsBySiteIdAndDate({
              siteId,
              date: { between: [startDate, endDate] },
            });
            total += data.length;
          } else if (table === "InputTable") {
            const { data } = await client.models.InputTable.listInputTableBySiteIdAndRowdate({
              siteId,
              rowdate: { between: [startDate, endDate] },
            });
            total += data.length;
          } else if (table === "PurplefigureTable") {
            const { data } = await client.models.PurplefigureTable.listPurplefigureTableBySiteIdAndRowdate({
              siteId,
              rowdate: { between: [startDate, endDate] },
            });
            total += data.length;
          }
        }
        counts[table] = total;
      })
    );

    setPreviewCounts(counts);
    setPreviewing(false);
  };

  const handleDelete = async () => {
    if (!isValid) return;
    setDeleting(true);
    setConfirmOpen(false);
    setResults(null);

    const siteIds =
      selectedSite === "__all__" ? sites.map((s) => s.id) : [selectedSite];

    const resultList: DeleteResult[] = [];

    for (const table of Array.from(selectedTables)) {
      let deleted = 0;
      let failed = 0;

      for (const siteId of siteIds) {
        try {
          let records: { id: string }[] = [];

          if (table === "AuditorReports") {
            const { data } = await client.models.AuditorReports.listAuditorReportsBySiteIdAndDate({
              siteId,
              date: { between: [startDate, endDate] },
            });
            records = data;
          } else if (table === "InputTable") {
            const { data } = await client.models.InputTable.listInputTableBySiteIdAndRowdate({
              siteId,
              rowdate: { between: [startDate, endDate] },
            });
            records = data;
          } else if (table === "PurplefigureTable") {
            const { data } = await client.models.PurplefigureTable.listPurplefigureTableBySiteIdAndRowdate({
              siteId,
              rowdate: { between: [startDate, endDate] },
            });
            records = data;
          }

          // Delete in parallel batches of 10
          const BATCH = 10;
          for (let i = 0; i < records.length; i += BATCH) {
            const batch = records.slice(i, i + BATCH);
            const results = await Promise.allSettled(
              batch.map((r) => {
                if (table === "AuditorReports")
                  return client.models.AuditorReports.delete({ id: r.id });
                if (table === "InputTable")
                  return client.models.InputTable.delete({ id: r.id });
                return client.models.PurplefigureTable.delete({ id: r.id });
              })
            );
            results.forEach((r) => (r.status === "fulfilled" ? deleted++ : failed++));
          }
        } catch {
          failed++;
        }
      }

      resultList.push({ table, deleted, failed });
    }

    setResults(resultList);
    setDeleting(false);
    // Reset preview
    setPreviewCounts({ AuditorReports: null, InputTable: null, PurplefigureTable: null });
  };

  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800",
    purple: "border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800",
    pink: "border-pink-200 bg-pink-50 dark:bg-pink-900/10 dark:border-pink-800",
  };
  const checkColorMap: Record<string, string> = {
    blue: "border-blue-400 bg-blue-500",
    purple: "border-purple-400 bg-purple-500",
    pink: "border-pink-400 bg-pink-500",
  };

  const totalToDelete = Object.values(previewCounts).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Site selector */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-sm">1. Select Site</h2>
        <select
          value={selectedSite}
          onChange={(e) => { setSelectedSite(e.target.value); setResults(null); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="__all__">All sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-sm">2. Date Range</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setResults(null); setPreviewCounts({ AuditorReports: null, InputTable: null, PurplefigureTable: null }); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setResults(null); setPreviewCounts({ AuditorReports: null, InputTable: null, PurplefigureTable: null }); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
        {startDate && endDate && endDate < startDate && (
          <p className="text-xs text-red-500">End date must be after start date</p>
        )}
      </div>

      {/* Table selector */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">3. Select Tables</h2>
          <button onClick={toggleAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {selectedTables.size === 3 ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="space-y-2">
          {(Object.keys(TABLE_META) as TableKey[]).map((key) => {
            const meta = TABLE_META[key];
            const checked = selectedTables.has(key);
            const count = previewCounts[key];
            return (
              <button
                key={key}
                onClick={() => toggleTable(key)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${checked ? colorMap[meta.color] : "hover:bg-muted/40"}`}
              >
                {/* checkbox */}
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? checkColorMap[meta.color] : "border-gray-300 dark:border-gray-600"}`}>
                  {checked && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                {count !== null && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${count > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                    {count} record{count !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={!isValid || previewing || deleting}
          className="flex-1"
        >
          {previewing ? (
            <><span className="h-3.5 w-3.5 mr-2 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />Counting...</>
          ) : "Preview count"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={!isValid || deleting || previewing}
          className="flex-1"
        >
          {deleting ? (
            <><span className="h-3.5 w-3.5 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />Deleting...</>
          ) : "Delete records"}
        </Button>
      </div>

      {/* Preview summary */}
      {Object.values(previewCounts).some((v) => v !== null) && !previewing && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-sm font-medium mb-2">
            {totalToDelete > 0
              ? `${totalToDelete} record${totalToDelete !== 1 ? "s" : ""} would be deleted`
              : "No records found in that date range"}
          </p>
          <div className="space-y-1">
            {(Object.keys(TABLE_META) as TableKey[]).filter((k) => selectedTables.has(k)).map((k) => (
              <div key={k} className="flex justify-between text-xs text-muted-foreground">
                <span>{TABLE_META[k].label}</span>
                <span className="font-medium">{previewCounts[k] ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl border shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-base">Confirm deletion</h3>
            <p className="text-sm text-muted-foreground">
              You are about to permanently delete all records in{" "}
              <span className="font-medium text-foreground">
                {Array.from(selectedTables).map((t) => TABLE_META[t].label).join(", ")}
              </span>{" "}
              for{" "}
              <span className="font-medium text-foreground">
                {selectedSite === "__all__" ? "all sites" : sites.find((s) => s.id === selectedSite)?.name}
              </span>{" "}
              between{" "}
              <span className="font-medium text-foreground">{startDate}</span> and{" "}
              <span className="font-medium text-foreground">{endDate}</span>.
              <br /><br />
              <span className="text-red-500 font-medium">This cannot be undone.</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                Yes, delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-semibold text-sm">Results</h2>
          {results.map((r) => (
            <div key={r.table} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{TABLE_META[r.table].label}</span>
              <div className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {r.deleted} deleted
                </span>
                {r.failed > 0 && (
                  <span className="text-red-500 font-medium">{r.failed} failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Auditor;
