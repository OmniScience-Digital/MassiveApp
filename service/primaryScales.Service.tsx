import { client } from "./schemaClient";

export const updatePrimaryScales = async (
    id: string,
    primaryScales: string[]
) => {
    try {
        console.log("Updating site:", id);
        console.log("New primary scales:", primaryScales);

        // 1. Fetch existing site data
        const { data: site, errors } = await client.models.Sites.get({ id });

        if (errors) {
            console.error("Error fetching site:", errors);
            return null;
        }

        if (!site) {
            console.error("Site not found");
            return null;
        }

        // 2. Parse site data with proper type handling
        let parsedSite: any;
        if (typeof site.site === "string") {
            try {
                parsedSite = JSON.parse(site.site);
            } catch (e) {
                console.error("Failed to parse site data:", e);
                return null;
            }
        } else if (typeof site.site === "object" && site.site !== null) {
            // Create a proper copy of the object
            parsedSite = Array.isArray(site.site) 
                ? [...site.site] 
                : { ...site.site };
        } else {
            console.error("Invalid site data format");
            return null;
        }

        // 3. Update primaryScales
        parsedSite.primaryScales = Array.isArray(primaryScales) 
            ? [...primaryScales] 
            : [];

        console.log("Updated site config:", JSON.stringify(parsedSite, null, 2));

        // 4. Save changes
        const updateResponse = await client.models.Sites.update({
            id,
            site: JSON.stringify(parsedSite),
        });

        if (updateResponse.errors) {
            console.error("Update failed:", updateResponse.errors);
            return null;
        }

        return parsedSite;
    } catch (error) {
        console.error("Update error:", error);
        return null;
    }
};