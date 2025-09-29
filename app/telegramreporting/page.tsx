"use client";
import { client } from "@/service/schemaClient";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { EditIcon, ArrowUpDown, Trash2 } from "lucide-react";
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

const Automatedreporting = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const [submittedsites, setSubmitted] = useState<ReportItem[]>([]);
  const [show, setShow] = useState(false); // Loading state
  const [message, setMessage] = useState(""); // Loading state
  const [idtodelete, setId] = useState(""); // Loading state
  const [successful, setSuccessful] = useState(false); // show failer modal or not
  const [opendelete, setOpendelete] = useState(false); // Dialog visibility state for deleting dashboard

  // For UI handling
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [checkedItemsProgressive, setCheckedItemsProgressive] = useState<
    Record<string, boolean>
  >({});
  const [checkedItemsHourly, setCheckedItemshourly] = useState<
    Record<string, boolean>
  >({});

  //stop times state
  const [stopTimes, setStopTimes] = useState<StopTimesState>({
    dayStop: [],
    nightStop: [],
    extraStop: [],
  });

  // listsites function - returns subscription
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
          .filter((site) => site?.siteConstants?.reporttype === "telegram")
          .sort((a, b) =>
            a.siteConstants?.siteName?.localeCompare(b.siteConstants?.siteName),
          );

        setSubmitted(sites as ReportItem[]);
        setLoading(false);
        const uniqueStopTimes = getUniqueStopTimes(sites as ReportItem[]);
        setStopTimes(uniqueStopTimes);
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

  useEffect(() => { }, [stopTimes]); // This will run whenever stopTimes changes

  useEffect(() => {
    if (submittedsites.length > 0) {
      const initialCheckedState = submittedsites.reduce(
        (acc, site) => {
          acc[site.id] = site.audit || false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setCheckedItems(initialCheckedState);

      const initialCheckedStateProgressive = submittedsites.reduce(
        (acc, site) => {
          acc[site.id] = site.progressive || false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setCheckedItemsProgressive(initialCheckedStateProgressive);

      const initialCheckedStateHourly = submittedsites.reduce(
        (acc, site) => {
          acc[site.id] = site.hourly || false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setCheckedItemshourly(initialCheckedStateHourly);
    }
  }, [submittedsites]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = async () => {
    try {
      setOpendelete(false);
      setLoading(true);

      if (!idtodelete) {
        console.warn("No ID provided for deletion.");
        return;
      }

      await client.models.Sites.delete({ id: idtodelete });
    } catch (error) {
      console.error("Error deleting site:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ReportItem) => {
    setSubmitted((prevSubmitted) => [...prevSubmitted, data]); // Append new data to the array
    setLoading(true);

    try {
      // Call the `create` method
      const { errors, data: newSite } = await client.models.Sites.create({
        site: JSON.stringify(data),
      });

      if (errors) {
        console.error("Error creating site:", errors);
        // If no error occurs, set all to false
        setMessage("Failed to  add site verify parameters");
        setSuccessful(false);
        setShow(true);
      } else {
        console.log("Site created:", newSite);
        // If an error occurs, set to true
        setSuccessful(true);
        setShow(true);
        setMessage("Site added successfully");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false); // Ensure loading is set to false
    }
  };

  const handleDelete = async (id: string) => {
    setOpendelete(true);
    setId(id);
  };

  // Redirect to dashboard
  const redirectToDashboard = (name: string, id: string) => {
    const path = name.replace(/\s+/g, "");

    router.push(`/dashboard/${path}/${id}`);
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
      accessorKey: "siteStatus",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Site Status
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
          onClick={() => redirectToDashboard("telegram", row.original.id)} // Log the row ID
        >
          <EditIcon />
        </Button>
      ),
    },
    {
      accessorKey: "manage",
      header: "Manage",
      cell: ({ row }: { row: any }) => (
        <Button
          className="bg-red-500 ml-auto cursor-pointer    "
          onClick={() => handleDelete(row.original.id)} // Log the row ID
        >
          <Trash2 />
        </Button>
      ),
    },
    {
      accessorKey: "audit",
      header: "Audit",
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={checkedItems[row.original.id] || false}
          onCheckedChange={async (checked) => {
            const isChecked = Boolean(checked); // Convert checked value to boolean
            const siteId = row.original.id; // Get the site ID from the row data

            // Update checked state locally
            setCheckedItems((prev) => ({
              ...prev,
              [siteId]: isChecked, // Update the checkbox state for the specific site
            }));

            try {
              // First, retrieve the current site details
              const { data: siteModel, errors } = await client.models.Sites.get(
                { id: siteId },
              );

              if (errors) {
                console.error("Error fetching site:", errors);
                return;
              }

              if (!siteModel?.site) {
                console.warn(`Site not found for ID: ${siteId}`);
                return;
              }

              // Parse the site field if it's a string (e.g., JSON string)
              let parsedSite;
              try {
                parsedSite =
                  typeof siteModel.site === "string"
                    ? JSON.parse(siteModel.site)
                    : siteModel.site;
              } catch (parseError) {
                console.error("Error parsing site data:", parseError);
                return;
              }

              // Now, update the audit value for the site
              const updatedSite = {
                ...parsedSite, // Keep all existing fields
                audit: isChecked, // Update the audit field based on the checkbox
              };

              // Update the site with the new audit value
              await client.models.Sites.update({
                id: siteId,
                site: JSON.stringify(updatedSite), // Store the updated site as a JSON string
              });

              console.log(`Audit status updated for site ID: ${siteId}`);
            } catch (err) {
              console.error(
                `Failed to update progressive status for site ID: ${siteId}`,
                err,
              );
            }
          }}
        />
      ),
    },
    {
      accessorKey: "progressive",
      header: "Progressive",
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={checkedItemsProgressive[row.original.id] || false}
          onCheckedChange={async (checked) => {
            const isChecked = Boolean(checked); // Convert checked value to boolean
            const siteId = row.original.id; // Get the site ID from the row data

            // Update checked state locally
            setCheckedItemsProgressive((prev) => ({
              ...prev,
              [siteId]: isChecked, // Update the checkbox state for the specific site
            }));

            try {
              // First, retrieve the current site details
              const { data: siteModel, errors } = await client.models.Sites.get(
                { id: siteId },
              );

              if (errors) {
                console.error("Error fetching site:", errors);
                return;
              }

              if (!siteModel?.site) {
                console.warn(`Site not found for ID: ${siteId}`);
                return;
              }

              // Parse the site field if it's a string (e.g., JSON string)
              let parsedSite;
              try {
                parsedSite =
                  typeof siteModel.site === "string"
                    ? JSON.parse(siteModel.site)
                    : siteModel.site;
              } catch (parseError) {
                console.error("Error parsing site data:", parseError);
                return;
              }

              // Now, update the audit value for the site
              const updatedSite = {
                ...parsedSite, // Keep all existing fields
                progressive: isChecked, // Update the audit field based on the checkbox
              };

              // Update the site with the new audit value
              await client.models.Sites.update({
                id: siteId,
                site: JSON.stringify(updatedSite), // Store the updated site as a JSON string
              });

              console.log(`Progressive status updated for site ID: ${siteId}`);
            } catch (err) {
              console.error(
                `Failed to update progressive status for site ID: ${siteId}`,
                err,
              );
            }
          }}
        />
      ),
    },
    {
      accessorKey: "hourly",
      header: "Hourly",
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={checkedItemsHourly[row.original.id] || false}
          onCheckedChange={async (checked) => {
            const isChecked = Boolean(checked); // Convert checked value to boolean
            const siteId = row.original.id; // Get the site ID from the row data

            // Update checked state locally
            setCheckedItemshourly((prev) => ({
              ...prev,
              [siteId]: isChecked, // Update the checkbox state for the specific site
            }));

            try {
              // First, retrieve the current site details
              const { data: siteModel, errors } = await client.models.Sites.get(
                { id: siteId },
              );

              if (errors) {
                console.error("Error fetching site:", errors);
                return;
              }

              if (!siteModel?.site) {
                console.warn(`Site not found for ID: ${siteId}`);
                return;
              }

              // Parse the site field if it's a string (e.g., JSON string)
              let parsedSite;
              try {
                parsedSite =
                  typeof siteModel.site === "string"
                    ? JSON.parse(siteModel.site)
                    : siteModel.site;
              } catch (parseError) {
                console.error("Error parsing site data:", parseError);
                return;
              }

              // Now, update the audit value for the site
              const updatedSite = {
                ...parsedSite, // Keep all existing fields
                hourly: isChecked, // Update the hourly field based on the checkbox
              };

              // Update the site with the new audit value
              await client.models.Sites.update({
                id: siteId,
                site: JSON.stringify(updatedSite), // Store the updated site as a JSON string
              });

              console.log(`Hourly status updated for site ID: ${siteId}`);
            } catch (err) {
              console.error(
                `Failed to update progressive status for site ID: ${siteId}`,
                err,
              );
            }
          }}
        />
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
        siteStatus: site.siteStatus || "",
        edit: <EditIcon id={site.id} key={`edit-${site.id}`} />,
        manage: <Trash2 id={site.id} key={`delete-${site.id}`} />,
        audit: checkedItems[site.id] || false, // Use the checkedItems state
        progressive: checkedItemsProgressive[site.id] || false, // Use the checkedItemsProgressive state
        hourly: checkedItemsHourly[site.id] || false, // Use the checkedItemsHourly state
      };
    })
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 p-1 h-f mt-20">
        <div className="flex justify-end mb-2">
          <Button onClick={handleOpenModal} className="ml-auto cursor-pointer">
            Add Site
          </Button>
          <InputModal
            isOpen={isModalOpen}
            reporttype={"telegram"}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
          />
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            {show && (
              <ResponseModal
                successful={successful}
                message={message}
                setShow={setShow}
              />
            )}
            <SiteControls stopTimes={stopTimes} />

            <DataTable
              title={"Automated Reporting Sites"}
              data={data}
              columns={columns}
              pageSize={10}
              storageKey="sitesTablePagination"
            />
          </>
        )}
        {/* Dialog to delete dashboard */}
        <ConfirmDialog
          open={opendelete}
          setOpen={setOpendelete}
          handleConfirm={handleDeleteConfirmation}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Automatedreporting;

function getUniqueStopTimes(
  sites: ReportItem[],
  excludeTimes: string[] = ["23:59"],
) {
  const uniqueDayStops = new Set<string>();
  const uniqueNightStops = new Set<string>();
  const uniqueExtraStops = new Set<string>();

  sites.forEach((site) => {
    const { dayStop, nightStop, extraShiftStop } = site.siteTimes;

    if (dayStop && !excludeTimes.includes(dayStop)) uniqueDayStops.add(dayStop);
    if (nightStop && !excludeTimes.includes(nightStop))
      uniqueNightStops.add(nightStop);
    if (extraShiftStop && !excludeTimes.includes(extraShiftStop))
      uniqueExtraStops.add(extraShiftStop);
  });

  return {
    dayStop: Array.from(uniqueDayStops),
    nightStop: Array.from(uniqueNightStops),
    extraStop: Array.from(uniqueExtraStops),
  };
}
