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
import { ArrowUpDown, EditIcon } from "lucide-react";

const Auditor = () => {
  const [loading, setLoading] = useState(false); // Loading state
  const [submittedsites, setSubmitted] = useState<ReportItem[]>([]);
  const router = useRouter();

  // listsites function
  function listsites() {
    setLoading(true);
    return client.models.Sites.observeQuery().subscribe({
      next: (data) => {
        const sites = data.items
          .map((report) => {
            const parsedSite =
              typeof report.site === "string" ? JSON.parse(report.site) : {};
            parsedSite.id = report.id;
            return parsedSite;
          })
          .filter((site) => site.audit === true)
          .sort((a, b) =>
            a.siteConstants?.siteName?.localeCompare(b.siteConstants?.siteName),
          );

        setSubmitted(sites as ReportItem[]);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }

  useEffect(() => {
    const subscription = listsites();

    // Cleanup function - unsubscribe when component unmounts
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);
  
  // Redirect to dashboard
  const redirectToDashboard = (name: string, id: string) => {
    router.push(`/auditinDashboard/${name}/${id}`);
  };
  //table data
  const columns: ColumnDef<object, any>[] = [
    {
      accessorKey: "sitename",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Site Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "monthStart",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Month Start
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "dayStop",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Day Stop
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "nightStop",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Night Stop
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },

    {
      accessorKey: "edit",
      header: "Edit",
      cell: ({ row }: { row: any }) => (
        <Button
          className="ml-auto cursor-pointer"
          onClick={() =>
            redirectToDashboard(row.original.sitename, row.original.id)
          } // Log the row ID
        >
          <EditIcon />
        </Button>
      ),
    },
  ];

  const data = Array.isArray(submittedsites)
    ? submittedsites.map((site) => {
      const input = site.siteConstants || {};
      const site_time = site.siteTimes || {};

      return {
        id: site.id || "",
        sitename: input.siteName || "",
        monthStart: site_time.monthstart || "",
        dayStop: site_time.dayStop || "",
        nightStop: site_time.nightStop || "",
        edit: <EditIcon id={site.id} key={`edit-${site.id}`} />,
      };
    })
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 p-1 h-f mt-20">
        {loading ? (
          <Loading />
        ) : (
          <>
            <DataTable
              title={"Auditing  Sites"}
              data={data}
              columns={columns}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Auditor;
