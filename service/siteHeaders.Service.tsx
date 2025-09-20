import { client } from "./schemaClient";
import { ReportItem } from "@/types/schema";

interface HeaderProps {
  headername: string;
}

export const createSiteHeaders = async (id: string, headers: HeaderProps) => {
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

    // Step 3: Ensure `scales` exists as an array, then add the new scale
    if (!Array.isArray(parsedSite.headers)) {
      parsedSite.headers = []; // Initialize if not an array
    }

    parsedSite.headers.push(headers); // Add the new header

    // Step 4: Save the updated site data back to the database
    const updateResponse = await client.models.Sites.update({
      id,
      site: JSON.stringify(parsedSite), // Convert back to string if necessary
    });

    if (updateResponse.errors) {
      console.error("Error updating site:", updateResponse.errors);
      return null;
    }

    return parsedSite;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
};

export const deleteSiteHeader = async (id: string, headers: HeaderProps) => {
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

    // Step 2: Parse `site.site` if it's a string
    let parsedSite;
    if (typeof site.site === "string") {
      parsedSite = JSON.parse(site.site);
    } else {
      parsedSite = site.site;
    }

    // Step 3: Ensure `headers` exists as an array
    if (!Array.isArray(parsedSite.headers)) {
      parsedSite.headers = [];
    }

    // Step 4: Remove the specified header
    parsedSite.headers = parsedSite.headers.filter(
      (header: HeaderProps) => header.headername !== headers.headername,
    );

    // Step 5: Save the updated site data back to the database
    const updateResponse = await client.models.Sites.update({
      id,
      site: JSON.stringify(parsedSite),
    });

    if (updateResponse.errors) {
      console.error("Error updating site:", updateResponse.errors);
      return null;
    }

    return parsedSite;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
};
