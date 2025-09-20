import { client } from "./schemaClient";

export const createTelegramScale = async (
  id: string,
  scale: {
    scalename: string;
    iccid: string;
    openingScaletons: string;
  },
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

    // Step 3: Ensure `scales` exists as an array, then add the new scale
    if (!Array.isArray(parsedSite.scales)) {
      parsedSite.scales = []; // Initialize if not an array
    }

    parsedSite.scales.push(scale); // Add the new scale

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

export const updateTelegramScale = async (
  id: string,
  row: {
    scalename: string;
    iccid: string;
    openingScaletons: string;
  },
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

    // Step 3: Ensure `scales` exists as an array, then add the new scale
    if (!Array.isArray(parsedSite.scales)) {
      parsedSite.scales = []; // Initialize if not an array
    }

    parsedSite.scales = parsedSite.scales.map((scale: any) =>
      scale.scalename === row.scalename ? { ...scale, ...row } : scale,
    );

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

export const deleteTelegramScale = async (
  id: string,
  row: {
    scalename: string;
    iccid: string;
  },
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

    // Step 3: Ensure `scales` exists as an array, then add the new scale
    if (!Array.isArray(parsedSite.scales)) {
      parsedSite.scales = []; // Initialize if not an array
    }

    parsedSite.scales = parsedSite.scales.filter(
      (scale: any) => scale.scalename !== row.scalename,
    );

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
