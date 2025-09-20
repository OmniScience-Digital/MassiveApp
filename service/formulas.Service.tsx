import { client } from "./schemaClient";

export const createFormula = async (
  id: string,
  formulaobj: {
    formulaname: string;
    formula: string;
    virtualformula: boolean;
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

    // Step 3: Ensure `formulas` exists as an array
    if (!Array.isArray(parsedSite.formulas)) {
      parsedSite.formulas = [];
    }

    const exists = parsedSite.formulas.find(
      (f: any) => f.formulaname === formulaobj.formulaname,
    );

    if (!exists) {
      parsedSite.formulas.push(formulaobj);

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
    } else {
      throw new Error(`Formula "${formulaobj.formulaname}" already exists.`);
    }
  } catch (error) {
    console.log("Error creating a formula:", error);
    return null;
  }
};

export const deleteFormula = async (id: string, formulaname: string) => {
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

    const exists = parsedSite.formulas.find(
      (f: any) => f.formulaname === formulaname,
    );

    if (exists) {
      console.log("Deleting formula:", exists);
      parsedSite.formulas = parsedSite.formulas.filter(
        (f: any) => f.formulaname !== formulaname,
      );
    } else {
      console.log("Formula not found:", formulaname);
    }

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
    console.log("Error creating a formula :", error);
  }
};

export const updateFormula = async (
  id: string,
  formulaobj: {
    formulaname: string;
    formula: string;
    virtualformula: boolean;
  },
) => {
  try {
    // [1] Fetch site data
    const { data: site, errors } = await client.models.Sites.get({ id });
    if (errors || !site) {
      console.error("Site error:", errors || "Not found");
      return null;
    }

    // [2] Parse site data
    const parsedSite =
      typeof site.site === "string" ? JSON.parse(site.site) : site.site;

    // [3] Initialize formulas array
    if (!Array.isArray(parsedSite.formulas)) {
      parsedSite.formulas = [];
    }

    // [4] Find and FULLY update formula
    const index = parsedSite.formulas.findIndex(
      (f: any) => f.formulaname === formulaobj.formulaname,
    );

    if (index !== -1) {
      // Update ALL properties including virtualformula
      parsedSite.formulas[index] = {
        ...parsedSite.formulas[index], // Keep existing fields
        ...formulaobj, // Override with new values
      };
    } else {
      parsedSite.formulas.push(formulaobj);
    }

    // [5] Save updates
    const updateResponse = await client.models.Sites.update({
      id,
      site: JSON.stringify(parsedSite),
    });

    return updateResponse.errors ? null : parsedSite;
  } catch (error) {
    console.error("Update failed:", error);
    return null;
  }
};
