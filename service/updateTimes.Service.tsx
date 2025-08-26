import { client } from "./schemaClient";

export const updateSiteTimesById = async (
    id: string,
    newSiteTimes: {
      monthstart: string;
      dayStart: string;
      dayStop: string;
      nightStart: string;
      nightStop: string;
      extraShiftStart: string;
      extraShiftStop: string;
    }
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
  
      // Step 3: Update only `siteTimes`
      const updatedSite = {
        ...parsedSite,
        siteTimes: newSiteTimes, // Replace only the siteTimes object
      };
  
      // Step 4: Save the updated data back
      const updateResponse = await client.models.Sites.update({
        id,
        site: JSON.stringify(updatedSite), // Convert back to string if necessary
      });
  
      // Step 5: Check if the update was successful
      if (updateResponse.errors) {
        console.error("Error updating site:", updateResponse.errors);
        return null;
      }
  
      return updatedSite; // Return the updated site object
  
    } catch (error) {
      console.error("Unexpected error:", error);
      return null;
    }
  };

