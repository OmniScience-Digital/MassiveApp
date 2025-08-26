"use client"; // Required for client-side interactivity

import { useState, useEffect } from "react";
import { client } from "@/service/schemaClient";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDashboard } from "./dialog";
import { ConfirmDialog } from "../../components/widgets/deletedialog";
import Loading from "@/components/widgets/loading"; // Import the Loading component
import { DataItem } from "@/types/schema";



export default function Home() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<string[]>([]);
  const [dataArray, setData] = useState<DataItem[]>([]); // Correctly typed
  const [open, setOpen] = useState(false); // Dialog visibility state for adding dashboard
  const [opendelete, setOpendelete] = useState(false); // Dialog visibility state for deleting dashboard
  const [name, setName] = useState(""); // Empty by default
  const [loading, setLoading] = useState(true); // Loading state
  const [dashboardToDelete, setDashboardToDelete] = useState<number | null>(null); // Index of dashboard to delete

  // Fetch dashboards
  function listdashboards() {
    setLoading(true);

    client.models.Dashboards.observeQuery().subscribe({
      next: (data) => {
        const dashboards = data.items
          .map((dashboard) => dashboard.items)
          .flat()
          .filter((item): item is string => item !== null)
          .map((item) => item.toLowerCase())
          .sort(); // Sort alphabetically
        setDashboards(dashboards);
        setLoading(false);
        setData(data.items as DataItem[]); // Cast to the correct type
      },
      error: () => {
        setLoading(false);
      },
    });
  }

  useEffect(() => {
    listdashboards();
  }, []);

  // Add a new dashboard
  const addDashboard = async () => {
    if (!name.trim()) return;

    setOpen(false); 
    setLoading(true);
    const { errors, data: newDashboard } = await client.models.Dashboards.create({
      items: name,
    });
    setName("");

    if (errors) {
      console.error("Error creating dashboard:", errors);
    } else {
      console.log("Dashboard created:", newDashboard);
      setDashboards([...dashboards, name]);
      setLoading(false);
      
    }
  };

  // Redirect to dashboard
  const redirectToDashboard = (name: string) => {
    
    let path = name.replace(/\s+/g, '');
     router.push(`/${path}`);

  };

  // Delete dashboard at a specific index
  const deleteDashboard = async (index: number) => {

    
    const dashboardName = dashboards[index]; // Get the name of the dashboard to delete
   
    const foundItem = dataArray.find((item) => item.items.toUpperCase() === dashboardName.toUpperCase()); // Find the item in dataArray
    console.log(foundItem)
    setLoading(true);
    if (foundItem) {
      // Delete from the database
      const { errors } = await client.models.Dashboards.delete({ id: foundItem.id });

      if (errors) {
        console.error("Error deleting dashboard:", errors);
      } else {
        // Update local state
        const updatedDashboards = dashboards.filter((_, i) => i !== index);
        setDashboards(updatedDashboards);
        console.log("Dashboard deleted:", foundItem);
      }
    }
    setLoading(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    if (dashboardToDelete !== null) {
      deleteDashboard(dashboardToDelete);
      setDashboardToDelete(null);
      setOpendelete(false);

    }
  };

  return (
    <div className="flex flex-col bg-background text-foreground p-1">
      <div className="flex-1">
       {!loading && <h1 className="text-2xl font-bold mb-4">Manage Dashboards</h1>}

        <div className="m-2">
          {loading ? (
            <Loading />
          ) : (
            <ul className="space-y-2 m-2">
              {dashboards.map((dashboard, index) => (
                <li
                  key={index}
                  className="p-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                  onClick={() => redirectToDashboard(dashboard)}
                >
                  <span>{dashboard}</span>
                  <Trash2
                    className="h-4 w-4 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop event propagation
                      setDashboardToDelete(index);
                      setOpendelete(true);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Button
        className="fixed bottom-8 right-8 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialog to Add Dashboard */}
      <DialogDashboard
        open={open}
        setOpen={setOpen}
        name={name}
        setName={setName}
        addDashboard={addDashboard}
      />

      {/* Dialog to delete dashboard */}
      <ConfirmDialog
        open={opendelete}
        setOpen={setOpendelete}
        handleConfirm={handleDeleteConfirmation}
      />
    </div>
  );
}