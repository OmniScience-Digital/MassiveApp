import { ReportItem } from "@/types/schema";
import { client } from "./schemaClient";

export const createDynamicTable = async (
  id: string,
  table: ReportItem["dynamic_tables"],
) => {
  try {
    // Step 1: Fetch the existing site data
    const { data: site, errors } = await client.models.Sites.get({ id });

    if (errors) {
      console.error("Error fetching site:", errors);
      return null;
    }

    if (!site) {
      console.error("Site not found");
      return null;
    }

    // Step 2: Parse `site` if it's a string
    let parsedSite;
    if (typeof site.site === "string") {
      parsedSite = JSON.parse(site.site);
    } else {
      parsedSite = site.site;
    }

    // Step 3: Ensure `dynamic input list` exists as an array
    if (!Array.isArray(parsedSite.dynamic_tables)) {
      parsedSite.dynamic_tables = [];
    }

    let message;

    // Step 4: Check if table exists and update or add new
    table.forEach((newTable: ReportItem["dynamic_tables"][number]) => {
      const existingIndex = parsedSite.dynamic_tables.findIndex(
        (t: ReportItem["dynamic_tables"][number]) => t.id === newTable.id,
      );

      if (existingIndex >= 0) {
        // Update existing table
        parsedSite.dynamic_tables[existingIndex] = {
          ...parsedSite.dynamic_tables[existingIndex],
          ...newTable,
        };

        message = "Table updated successfully";
      } else {
        // Add new table
        parsedSite.dynamic_tables.push(newTable);
        message = "Table created successfully";
      }
    });

    // Step 4: Save the updated site data back to the database
    const updateResponse = await client.models.Sites.update({
      id,
      site: JSON.stringify(parsedSite),
    });

    return { message: message, table: parsedSite.dynamic_tables };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteDynamicTable = async (id: string, deleteId: number) => {
  try {
    // Step 1: Fetch the existing site data
    const { data: site, errors } = await client.models.Sites.get({ id });

    let message;

    if (errors) {
      console.error("Error fetching site:", errors);
      return null;
    }

    if (!site) {
      console.error("Site not found");
      return null;
    }

    // Step 2: Parse `site` if it's a string
    let parsedSite;
    if (typeof site.site === "string") {
      parsedSite = JSON.parse(site.site);
    } else {
      parsedSite = site.site;
    }

    // Step 3: Ensure `dynamic_tables` exists as an array
    if (!Array.isArray(parsedSite.dynamic_tables)) {
      console.error("dynamic_tables is not an array");
      parsedSite.dynamic_tables = []; // Initialize if missing
    }

    // Step 4: Find the index of the table to delete
    const tableIndex = parsedSite.dynamic_tables.findIndex(
      (table: ReportItem["dynamic_tables"][number]) => table.id === deleteId,
    );

    if (tableIndex === -1) {
      console.error(`Table with ID ${deleteId} not found`);
      return null;
    }

    // Step 5: Remove the table from the array
    const deletedTable = parsedSite.dynamic_tables.splice(tableIndex, 1)[0];

    // Step 6: Update the site with the modified dynamic_tables
    const updateResult = await client.models.Sites.update({
      id: site.id,
      site: JSON.stringify(parsedSite),
    });

    if (updateResult.errors) {
      console.error("Error updating site:", updateResult.errors);
      return null;
    }

    return parsedSite.dynamic_tables;
  } catch (error) {
    console.error("Error in deleteDynamicTable:", error);
    return null;
  }
};
