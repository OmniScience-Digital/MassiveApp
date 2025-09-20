import InputData from "@/types/inputdata";
import { client } from "./schemaClient";

export const createDynamicList = async (
  id: string,
  inputobj: {
    inputListName: string;
    inputs: InputData[];
  },
) => {
  try {
    if (inputobj.inputListName === "Custom Header") return "rename";

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
    if (!Array.isArray(parsedSite.dynamic_inputs)) {
      parsedSite.dynamic_inputs = [];
    }

    // Check for extra spaces or case mismatches
    const normalizedInputListName = inputobj.inputListName.trim().toLowerCase();

    // Step 5: Find if the inputListName already exists
    const existsIndex = parsedSite.dynamic_inputs.findIndex(
      (I: any) =>
        I.inputListName.trim().toLowerCase() === normalizedInputListName,
    );

    // If the input list exists, update it; otherwise, push a new one
    if (existsIndex !== -1) {
      // Do NOT allow renaming, only update inputs
      parsedSite.dynamic_inputs[existsIndex].inputs = inputobj.inputs;

      // Save the update
      const updateResponse = await client.models.Sites.update({
        id,
        site: JSON.stringify(parsedSite),
      });

      if (updateResponse.errors) {
        console.error("Error updating site:", updateResponse.errors);
        return null;
      }

      return "updated";
    } else {
      parsedSite.dynamic_inputs.push(inputobj);
    }

    // Step 4: Save the updated site data back to the database
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
    console.log("Error creating a formula:", error);
    return null;
  }
};

export const deleteDynamicList = async (
  id: string,
  inputobj: {
    inputListName: string;
    inputs: InputData[];
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

    // Step 3: Ensure `dynamic input list` exists as an array
    if (!Array.isArray(parsedSite.dynamic_inputs)) {
      parsedSite.dynamic_inputs = [];
    }

    // Check for extra spaces or case mismatches
    const normalizedInputListName = inputobj.inputListName.trim().toLowerCase();

    // Step 5: Find if the inputListName already exists
    const existsIndex = parsedSite.dynamic_inputs.findIndex(
      (I: any) =>
        I.inputListName.trim().toLowerCase() === normalizedInputListName,
    );

    // If the input list exists, update it; otherwise, push a new one
    if (existsIndex !== -1) {
      existsIndex > -1 && existsIndex < parsedSite.dynamic_inputs.length
        ? parsedSite.dynamic_inputs.splice(existsIndex, 1)
        : null;
    } else {
      return -1;
    }

    // Step 4: Save the updated site data back to the database
    const updateResponse = await client.models.Sites.update({
      id,
      site: JSON.stringify(parsedSite),
    });

    if (updateResponse.errors) {
      console.error("Error updating site:", updateResponse.errors);
      return null;
    }

    return parsedSite.dynamic_inputs;
  } catch (error) {
    console.log("Error creating a formula:", error);
    return null;
  }
};
