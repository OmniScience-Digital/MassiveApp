"use client";
import { client } from "@/service/schemaClient";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { EditIcon, ArrowUpDown, Trash2, Copy } from "lucide-react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import InputModal from "@/components/dashboard/addsitedialog";
import { ReportItem, StopTimesState } from "@/types/schema";
import ResponseModal from "@/components/widgets/response";
import Loading from "@/components/widgets/loading";
import { ConfirmDialog } from "@/components/widgets/deletedialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteControls } from "@/components/dashboard/shiftreportMassrun";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

async function toggleSiteField(siteId: string, field: string, value: boolean) {
  const { data: siteModel, errors } = await client.models.Sites.get({ id: siteId });
  if (errors || !siteModel?.site) return;
  const parsed = typeof siteModel.site === "string" ? JSON.parse(siteModel.site) : siteModel.site;
  await client.models.Sites.update({ id: siteId, site: JSON.stringify({ ...parsed, [field]: value }) });
}

function getUniqueStopTimes(sites: ReportItem[], excludeTimes = ["23:59"]) {
  const d = new Set<string>(), n = new Set<string>(), e = new Set<string>();
  sites.forEach(({ siteTimes }) => {
    if (siteTimes.dayStop && !excludeTimes.includes(siteTimes.dayStop)) d.add(siteTimes.dayStop);
    if (siteTimes.nightStop && !excludeTimes.includes(siteTimes.nightStop)) n.add(siteTimes.nightStop);
    if (siteTimes.extraShiftStop && !excludeTimes.includes(siteTimes.extraShiftStop)) e.add(siteTimes.extraShiftStop);
  });
  return { dayStop: [...d], nightStop: [...n], extraStop: [...e] };
}

const Automatedreporting = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedsites, setSubmitted] = useState<ReportItem[]>([]);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [idtodelete, setId] = useState("");
  const [successful, setSuccessful] = useState(false);
  const [opendelete, setOpendelete] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "prod" | "test" | "off">("all");
  const [savingField, setSavingField] = useState<string | null>(null);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [checkedItemsProgressive, setCheckedItemsProgressive] = useState<Record<string, boolean>>({});
  const [checkedItemsHourly, setCheckedItemshourly] = useState<Record<string, boolean>>({});
  const [checkedItemsFTP, setCheckedItemsFTP] = useState<Record<string, boolean>>({});
  const [stopTimes, setStopTimes] = useState<StopTimesState>({ dayStop: [], nightStop: [], extraStop: [] });

  useEffect(() => {
    setLoading(true);
    const sub = client.models.Sites.observeQuery().subscribe({
      next: (data) => {
        const sites = data.items
          .map((r) => { const p = typeof r.site === "string" ? JSON.parse(r.site) : {}; p.id = r.id; return p; })
          .filter((s) => s?.siteConstants?.reporttype === "telegram")
          .sort((a, b) => a.siteConstants?.siteName?.localeCompare(b.siteConstants?.siteName));
        setSubmitted(sites as ReportItem[]);
        setStopTimes(getUniqueStopTimes(sites as ReportItem[]));
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!submittedsites.length) return;
    const toMap = (f: keyof ReportItem) =>
      submittedsites.reduce((acc, s) => { acc[s.id] = Boolean(s[f]); return acc; }, {} as Record<string, boolean>);
    setCheckedItems(toMap("audit"));
    setCheckedItemsProgressive(toMap("progressive"));
    setCheckedItemshourly(toMap("hourly"));
    setCheckedItemsFTP(toMap("ftp"));
  }, [submittedsites]);

  const handleSubmit = async (data: ReportItem) => {
    setLoading(true);
    try {
      const { errors } = await client.models.Sites.create({ site: JSON.stringify(data) });
      setSuccessful(!errors);
      setMessage(errors ? "Failed to add site" : "Site added successfully");
      setShow(true);
    } catch { setSuccessful(false); setMessage("Unexpected error"); setShow(true); }
    finally { setLoading(false); }
  };

  const handleDeleteConfirmation = async () => {
    try { setOpendelete(false); setLoading(true); if (idtodelete) await client.models.Sites.delete({ id: idtodelete }); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const filteredData = submittedsites
    .filter((s) => statusFilter === "all" || (s.siteStatus || "off").toLowerCase() === statusFilter)
    .map((site) => ({
      id: site.id || "",
      sitename: site.siteConstants?.siteName || "",
      monthStart: site.siteTimes?.monthstart || "",
      siteStatus: site.siteStatus || "off",
      audit: checkedItems[site.id] || false,
      progressive: checkedItemsProgressive[site.id] || false,
      hourly: checkedItemsHourly[site.id] || false,
      ftp: checkedItemsFTP[site.id] || false,
    }));

  const makeCheckboxCol = (
    key: string, label: string,
    state: Record<string, boolean>,
    setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ): ColumnDef<object, any> => {
    const allChecked = filteredData.length > 0 && filteredData.every((r) => state[r.id]);
    return {
      accessorKey: key,
      header: () => (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium">{label}</span>
          <Checkbox checked={allChecked} title={`Toggle all ${label}`}
            onCheckedChange={async (checked) => {
              const val = Boolean(checked);
              setState((prev) => { const u = { ...prev }; filteredData.forEach((r) => { u[r.id] = val; }); return u; });
              await Promise.all(filteredData.map((r) => toggleSiteField(r.id, key, val)));
            }}
          />
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const siteId = row.original.id;
        const fk = `${key}-${siteId}`;
        return (
          <div className="flex items-center justify-center gap-1">
            <Checkbox checked={state[siteId] || false}
              onCheckedChange={async (checked) => {
                const isChecked = Boolean(checked);
                setState((prev) => ({ ...prev, [siteId]: isChecked }));
                setSavingField(fk);
                try { await toggleSiteField(siteId, key, isChecked); }
                catch { setState((prev) => ({ ...prev, [siteId]: !isChecked })); }
                finally { setSavingField(null); }
              }}
            />
            {savingField === fk && <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />}
          </div>
        );
      },
    };
  };

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
      accessorKey: "siteStatus",
      header: "Status",
      cell: ({ row }: { row: any }) => <StatusBadge status={row.original.siteStatus} />,
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" title="Edit site" onClick={() => router.push(`/dashboard/telegram/${row.original.id}`)}>
            <EditIcon className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" title="Copy site" onClick={() => setIsModalOpen(true)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="destructive" title="Delete site" onClick={() => { setOpendelete(true); setId(row.original.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    makeCheckboxCol("audit", "Audit", checkedItems, setCheckedItems),
    makeCheckboxCol("progressive", "Progressive", checkedItemsProgressive, setCheckedItemsProgressive),
    makeCheckboxCol("hourly", "Hourly", checkedItemsHourly, setCheckedItemshourly),
    makeCheckboxCol("ftp", "FTP", checkedItemsFTP, setCheckedItemsFTP),
  ];

  const prodCount = submittedsites.filter((s) => (s.siteStatus || "").toLowerCase() === "prod").length;
  const testCount = submittedsites.filter((s) => (s.siteStatus || "").toLowerCase() === "test").length;
  const offCount = submittedsites.filter((s) => (s.siteStatus || "off").toLowerCase() === "off").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-2 mt-20">
        {loading ? <Loading /> : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-semibold">Automated Reporting</h1>
                <span className="text-sm text-muted-foreground">{submittedsites.length} sites</span>
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500" />{prodCount} prod
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />{testCount} test
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />{offCount} off
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border overflow-hidden text-xs">
                  {(["all", "prod", "test", "off"] as const).map((f) => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 capitalize transition-colors ${statusFilter === f ? "bg-gray-700 text-white" : "hover:bg-muted"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <Button onClick={() => setIsModalOpen(true)} size="sm">+ Add Site</Button>
              </div>
            </div>

            <InputModal isOpen={isModalOpen} reporttype="telegram" onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} existingSites={submittedsites} />
            {show && <ResponseModal successful={successful} message={message} setShow={setShow} />}
            <SiteControls stopTimes={stopTimes} />
            <DataTable title="" data={filteredData} columns={columns} pageSize={10} storageKey="telegramSitesTablePagination" />
          </>
        )}
        <ConfirmDialog open={opendelete} setOpen={setOpendelete} handleConfirm={handleDeleteConfirmation} />
      </main>
      <Footer />
    </div>
  );
};

export default Automatedreporting;
