"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { client } from "@/service/schemaClient";
import { ReportItem } from "@/types/schema";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, EditIcon, ClipboardList, Database, Download, Upload, Trash2 } from "lucide-react";

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
    { accessorKey: "dayStop", header: "Day Stop" },
    { accessorKey: "nightStop", header: "Night Stop" },
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

        {view === "home" && (
          <div className="max-w-2xl mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-1">Auditing</h1>
            <p className="text-sm text-muted-foreground mb-8">Choose what you want to do.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Download, delete, and re-import records from AuditorReports, InputTable or PurplefigureTable.
                </p>
              </button>
            </div>
          </div>
        )}

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
// CSV helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeCell(val: any): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function recordsToCsv(table: TableKey, records: any[]): string {
  if (records.length === 0) return "";

  if (table === "AuditorReports") {
    const header = "siteId,date,scales";
    const rows = records.map((r) =>
      [escapeCell(r.siteId), escapeCell(r.date), escapeCell(JSON.stringify(r.scales))].join(",")
    );
    return [header, ...rows].join("\n");
  }

  if (table === "InputTable") {
    const header = "siteId,iccid,rowdate,inputValues";
    const rows = records.map((r) =>
      [escapeCell(r.siteId), escapeCell(r.iccid), escapeCell(r.rowdate), escapeCell(JSON.stringify(r.inputValues))].join(",")
    );
    return [header, ...rows].join("\n");
  }

  // PurplefigureTable
  const header = "siteId,iccid,rowdate,purpleValues,dayTotal";
  const rows = records.map((r) =>
    [escapeCell(r.siteId), escapeCell(r.iccid), escapeCell(r.rowdate), escapeCell(JSON.stringify(r.purpleValues)), escapeCell(r.dayTotal)].join(",")
  );
  return [header, ...rows].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse a CSV string back into row objects for the given table
function parseCsv(table: TableKey, csv: string): any[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  // Simple CSV parser that handles quoted fields (including embedded commas/newlines)
  function splitRow(line: string): string[] {
    const cells: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuote = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') { inQuote = true; }
        else if (ch === ',') { cells.push(cur); cur = ""; }
        else { cur += ch; }
      }
    }
    cells.push(cur);
    return cells;
  }

  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    try {
      if (table === "AuditorReports") {
        rows.push({ siteId: cells[0], date: cells[1], scales: JSON.parse(cells[2] || "[]") });
      } else if (table === "InputTable") {
        rows.push({ siteId: cells[0], iccid: cells[1], rowdate: cells[2], inputValues: JSON.parse(cells[3] || "{}") });
      } else {
        rows.push({ siteId: cells[0], iccid: cells[1], rowdate: cells[2], purpleValues: JSON.parse(cells[3] || "{}"), dayTotal: cells[4] });
      }
    } catch {
      // skip malformed rows
    }
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// DataManager
// ─────────────────────────────────────────────────────────────────────────────

type TableKey = "AuditorReports" | "InputTable" | "PurplefigureTable";

const TABLE_META: Record<TableKey, { label: string; color: string; description: string }> = {
  AuditorReports:    { label: "Auditor Reports",  color: "blue",   description: "Scale runtime and audit data" },
  InputTable:        { label: "Input Data",        color: "purple", description: "Hourly input values per ICCID" },
  PurplefigureTable: { label: "Purple Figures",    color: "pink",   description: "Daily purple figure totals per ICCID" },
};

type DeleteResult = { table: TableKey; downloaded: number; deleted: number; failed: number };
type ImportResult = { table: TableKey; imported: number; failed: number };
type SiteOption   = { id: string; name: string };

function DataManager() {
  const [sites, setSites]                   = useState<SiteOption[]>([]);
  const [selectedSite, setSelectedSite]     = useState<string>("__all__");
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [selectedTables, setSelectedTables] = useState<Set<TableKey>>(new Set());
  const [deleting, setDeleting]             = useState(false);
  const [results, setResults]               = useState<DeleteResult[] | null>(null);
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [previewCounts, setPreviewCounts]   = useState<Record<TableKey, number | null>>({
    AuditorReports: null, InputTable: null, PurplefigureTable: null,
  });
  const [previewing, setPreviewing]         = useState(false);

  // Re-import state
  const [importResults, setImportResults]   = useState<ImportResult[] | null>(null);
  const [importing, setImporting]           = useState(false);
  const [importError, setImportError]       = useState<string | null>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

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

  const resetPreview = () =>
    setPreviewCounts({ AuditorReports: null, InputTable: null, PurplefigureTable: null });

  const toggleTable = (t: TableKey) => {
    setSelectedTables((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
    setResults(null); resetPreview();
  };
  const toggleAll = () => {
    setSelectedTables(selectedTables.size === 3 ? new Set() : new Set(["AuditorReports", "InputTable", "PurplefigureTable"] as TableKey[]));
    setResults(null);
  };

  const isValid = !!(startDate && endDate && endDate >= startDate && selectedTables.size > 0);

  // ── Fetch all matching records for a given table + siteIds ──
  async function fetchRecords(table: TableKey, siteIds: string[]): Promise<any[]> {
    const all: any[] = [];
    for (const siteId of siteIds) {
      if (table === "AuditorReports") {
        const { data } = await client.models.AuditorReports.listAuditorReportsBySiteIdAndDate({
          siteId, date: { between: [startDate, endDate] },
        });
        all.push(...data);
      } else if (table === "InputTable") {
        const { data } = await client.models.InputTable.listInputTableBySiteIdAndRowdate({
          siteId, rowdate: { between: [startDate, endDate] },
        });
        all.push(...data);
      } else {
        const { data } = await client.models.PurplefigureTable.listPurplefigureTableBySiteIdAndRowdate({
          siteId, rowdate: { between: [startDate, endDate] },
        });
        all.push(...data);
      }
    }
    return all;
  }

  // ── Preview ──
  const handlePreview = async () => {
    if (!isValid) return;
    setPreviewing(true); resetPreview();
    const siteIds = selectedSite === "__all__" ? sites.map((s) => s.id) : [selectedSite];
    const counts: Record<TableKey, number> = { AuditorReports: 0, InputTable: 0, PurplefigureTable: 0 };
    await Promise.all(
      Array.from(selectedTables).map(async (table) => {
        const records = await fetchRecords(table, siteIds);
        counts[table] = records.length;
      })
    );
    setPreviewCounts(counts);
    setPreviewing(false);
  };

  // ── Download CSV then Delete ──
  const handleDownloadAndDelete = async () => {
    if (!isValid) return;
    setDeleting(true); setConfirmOpen(false); setResults(null);

    const siteIds = selectedSite === "__all__" ? sites.map((s) => s.id) : [selectedSite];
    const siteName = selectedSite === "__all__" ? "all-sites" : (sites.find((s) => s.id === selectedSite)?.name ?? selectedSite);
    const resultList: DeleteResult[] = [];

    for (const table of Array.from(selectedTables)) {
      let downloaded = 0, deleted = 0, failed = 0;
      try {
        const records = await fetchRecords(table, siteIds);
        downloaded = records.length;

        // Download CSV before touching anything
        if (records.length > 0) {
          const csv = recordsToCsv(table, records);
          downloadCsv(`${table}_${siteName}_${startDate}_to_${endDate}.csv`, csv);
        }

        // Delete in batches of 10
        const BATCH = 10;
        for (let i = 0; i < records.length; i += BATCH) {
          const batch = records.slice(i, i + BATCH);
          const settled = await Promise.allSettled(
            batch.map((r: any) => {
              if (table === "AuditorReports")    return client.models.AuditorReports.delete({ id: r.id });
              if (table === "InputTable")        return client.models.InputTable.delete({ id: r.id });
              return client.models.PurplefigureTable.delete({ id: r.id });
            })
          );
          settled.forEach((r) => (r.status === "fulfilled" ? deleted++ : failed++));
        }
      } catch { failed++; }
      resultList.push({ table, downloaded, deleted, failed });
    }

    setResults(resultList);
    setDeleting(false);
    resetPreview();
  };

  // ── Re-import from CSV ──
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Infer table from filename prefix
    const name = file.name;
    const table: TableKey | null =
      name.startsWith("AuditorReports")    ? "AuditorReports"
      : name.startsWith("InputTable")      ? "InputTable"
      : name.startsWith("PurplefigureTable") ? "PurplefigureTable"
      : null;

    if (!table) {
      setImportError("Cannot detect table from filename. File must start with AuditorReports, InputTable, or PurplefigureTable.");
      e.target.value = "";
      return;
    }

    setImportError(null);
    setImporting(true);
    setImportResults(null);

    const text = await file.text();
    const rows = parseCsv(table, text);

    if (rows.length === 0) {
      setImportError("No valid rows found in CSV.");
      setImporting(false);
      e.target.value = "";
      return;
    }

    let imported = 0, failed = 0;
    const BATCH = 10;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        batch.map((row: any) => {
          // Write back with exact original field values — DB assigns new id/createdAt/updatedAt
          if (table === "AuditorReports") {
            return client.models.AuditorReports.create({
              siteId:  row.siteId,
              date:    row.date,
              scales:  row.scales,
            });
          }
          if (table === "InputTable") {
            return client.models.InputTable.create({
              siteId:      row.siteId,
              iccid:       row.iccid,
              rowdate:     row.rowdate,
              inputValues: row.inputValues,
            });
          }
          // PurplefigureTable
          return client.models.PurplefigureTable.create({
            siteId:       row.siteId,
            iccid:        row.iccid,
            rowdate:      row.rowdate,
            purpleValues: row.purpleValues,
            dayTotal:     row.dayTotal,
          });
        })
      );
      settled.forEach((r) => (r.status === "fulfilled" ? imported++ : failed++));
    }

    setImportResults([{ table, imported, failed }]);
    setImporting(false);
    e.target.value = "";
  };

  // ── UI helpers ──
  const colorMap: Record<string, string> = {
    blue:   "border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800",
    purple: "border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800",
    pink:   "border-pink-200 bg-pink-50 dark:bg-pink-900/10 dark:border-pink-800",
  };
  const checkColorMap: Record<string, string> = {
    blue:   "border-blue-400 bg-blue-500",
    purple: "border-purple-400 bg-purple-500",
    pink:   "border-pink-400 bg-pink-500",
  };
  const totalToDelete = Object.values(previewCounts).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── 1. Site selector ── */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-sm">1. Select Site</h2>
        <select
          value={selectedSite}
          onChange={(e) => { setSelectedSite(e.target.value); setResults(null); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="__all__">All sites</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* ── 2. Date range ── */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-sm">2. Date Range</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
            <input type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setResults(null); resetPreview(); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End date</label>
            <input type="date" value={endDate} min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setResults(null); resetPreview(); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
        {startDate && endDate && endDate < startDate && (
          <p className="text-xs text-red-500">End date must be after start date</p>
        )}
      </div>

      {/* ── 3. Table selector ── */}
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
              <button key={key} onClick={() => toggleTable(key)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${checked ? colorMap[meta.color] : "hover:bg-muted/40"}`}
              >
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

      {/* ── Actions ── */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handlePreview} disabled={!isValid || previewing || deleting} className="flex-1">
          {previewing
            ? <><span className="h-3.5 w-3.5 mr-2 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />Counting...</>
            : "Preview count"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={!isValid || deleting || previewing}
          className="flex-1 gap-2"
        >
          <Download className="h-4 w-4" />
          {deleting
            ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Working...</>
            : "Download & Delete"}
        </Button>
      </div>

      {/* Preview summary */}
      {Object.values(previewCounts).some((v) => v !== null) && !previewing && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-sm font-medium mb-2">
            {totalToDelete > 0
              ? `${totalToDelete} record${totalToDelete !== 1 ? "s" : ""} would be downloaded and deleted`
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

      {/* Results */}
      {results && (
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-semibold text-sm">Results</h2>
          {results.map((r) => (
            <div key={r.table} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{TABLE_META[r.table].label}</span>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <Download className="h-3 w-3" />{r.downloaded} downloaded
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <Trash2 className="h-3 w-3" />{r.deleted} deleted
                </span>
                {r.failed > 0 && (
                  <span className="text-red-500 font-medium">{r.failed} failed</span>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            CSV files were saved to your downloads folder. Use the re-import section below to restore them.
          </p>
        </div>
      )}

      {/* ── Divider ── */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">Re-import data</span>
        </div>
      </div>

      {/* ── Re-import section ── */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 shrink-0">
            <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Re-import from CSV</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a previously downloaded CSV to restore records with their exact original timestamps (siteId, date/rowdate, and all values).
              The filename must start with <code className="font-mono">AuditorReports</code>, <code className="font-mono">InputTable</code>, or <code className="font-mono">PurplefigureTable</code>.
            </p>
          </div>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-gray-400 hover:bg-muted/20 transition-all"
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Click to select CSV file</p>
          <p className="text-xs text-muted-foreground">AuditorReports_*.csv · InputTable_*.csv · PurplefigureTable_*.csv</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImportFile}
        />

        {importing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            Importing rows…
          </div>
        )}

        {importError && (
          <p className="text-sm text-red-500">{importError}</p>
        )}

        {importResults && (
          <div className="space-y-1">
            {importResults.map((r) => (
              <div key={r.table} className="flex items-center justify-between text-sm rounded-lg border bg-green-50 dark:bg-green-900/10 px-3 py-2">
                <span className="font-medium">{TABLE_META[r.table].label}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600 dark:text-green-400 font-medium">{r.imported} imported</span>
                  {r.failed > 0 && <span className="text-red-500 font-medium">{r.failed} failed</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl border shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-base">Confirm Download & Delete</h3>
            <p className="text-sm text-muted-foreground">
              Records in{" "}
              <span className="font-medium text-foreground">
                {Array.from(selectedTables).map((t) => TABLE_META[t].label).join(", ")}
              </span>{" "}
              for{" "}
              <span className="font-medium text-foreground">
                {selectedSite === "__all__" ? "all sites" : sites.find((s) => s.id === selectedSite)?.name}
              </span>{" "}
              between{" "}
              <span className="font-medium text-foreground">{startDate}</span> and{" "}
              <span className="font-medium text-foreground">{endDate}</span>{" "}
              will be <span className="text-blue-600 font-medium">downloaded as CSV</span> first, then{" "}
              <span className="text-red-500 font-medium">permanently deleted</span>.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">Cancel</Button>
              <Button variant="destructive" onClick={handleDownloadAndDelete} className="flex-1 gap-1">
                <Download className="h-4 w-4" /> Download & Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auditor;