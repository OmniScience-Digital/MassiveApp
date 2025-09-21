import { client } from "./schemaClient";

export const createOrUpdateInputValueTable = async (
  payload: Array<{
    siteId: string;
    iccid: string;
    rowdate: string;
    inputValues: Record<string, string>;
  }>,
) => {
  try {
    // Validate input data
    if (!Array.isArray(payload)) {
      throw new Error("Payload must be an array");
    }

    const results = [];

    for (const item of payload) {
      const { siteId, iccid, rowdate, inputValues } = item;

      // 1. Check if record already exists

      const { data: filteredRecords, errors: queryErrors } =
        await client.models.InputTable.listInputTableBySiteIdAndRowdate({
          siteId: siteId,
          rowdate: { eq: rowdate }, // This must be a filter object
        });

      // Then filter by iccid in memory
      const existingRecords = filteredRecords.filter(
        (record) => record.iccid === iccid,
      );

      if (queryErrors) {
        console.error("Query error:", queryErrors);
        throw queryErrors;
      }

      const existingRecord = existingRecords[0];
      let result;

      // Convert inputValues to JSON string to ensure proper format
      const inputValuesJson = JSON.stringify(inputValues);

      if (existingRecord) {
        // 2A. Update existing record - safely handle inputValues
        const existingInputValues =
          typeof existingRecord.inputValues === "object" &&
          existingRecord.inputValues !== null &&
          !Array.isArray(existingRecord.inputValues)
            ? (existingRecord.inputValues as Record<string, string>)
            : {};

        // Merge values and convert to JSON string
        const mergedInputValues = {
          ...existingInputValues,
          ...inputValues,
        };

        const { data: updated, errors } = await client.models.InputTable.update(
          {
            id: existingRecord.id,
            siteId,
            iccid,
            rowdate,
            inputValues: JSON.stringify(mergedInputValues),
          },
        );

        if (errors) throw errors;
        result = updated;
      } else {
        // 2B. Create new record - convert inputValues to JSON string
        const { data: created, errors } = await client.models.InputTable.create(
          {
            siteId,
            iccid,
            rowdate,
            inputValues: inputValuesJson, // Use JSON string
          },
        );

        if (errors) throw errors;
        result = created;
      }

      results.push(result);
    }

    return results;
  } catch (error) {
    console.error("Operation failed:", {
      error,
      input: payload?.[0], // Log first item for debugging
    });
    throw error;
  }
};

