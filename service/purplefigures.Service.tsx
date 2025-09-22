import { client } from "./schemaClient";

    // Query existing records for this siteId and date range
    // const { data: filteredRecords, errors: queryErrors } =
    //   await client.models.purpleTable.listpurpleTableBySiteIdAndRowdate({
    //     siteId,
    //     rowdate: { between: [startdate, enddate] },
    //   });

export const createOrUpdatePurpleDaily = async (
  startdate: string,
  enddate: string,
  payload: Array<{
    siteId: string;
    iccid: string;
    rowdate: string;
    purpleValues: Record<string, string>;
    dayTotal: string;
  }>,
) => {
  try {
    if (!Array.isArray(payload)) throw new Error("Payload must be an array");
    if (payload.length === 0) return [];

    const siteId = payload[0].siteId;

    const { data: filteredRecords, errors: queryErrors } = await client.models.PurpleTable.list({
      filter: {
        and: [
          { siteId: { eq: siteId } },
          { rowdate: { between: [startdate, enddate] } }
        ]
      }
    });

    if (queryErrors) throw queryErrors;

    const results = await Promise.all(
      payload.map(async ({ siteId, iccid, rowdate, purpleValues, dayTotal }) => {
        const existingRecord = filteredRecords.find(
          (record) => record.iccid === iccid && record.rowdate === rowdate
        );

        // Convert purpleValues to JSON string for API compatibility
        const purpleValuesJson = JSON.stringify(purpleValues);

        if (existingRecord) {
          // Update existing record - merge purpleValues
          const existingPurpleValues =
            typeof existingRecord.purpleValues === "object" &&
            existingRecord.purpleValues !== null &&
            !Array.isArray(existingRecord.purpleValues)
              ? (existingRecord.purpleValues as Record<string, string>)
              : {};

          const mergedPurpleValues = { ...existingPurpleValues, ...purpleValues };
          const mergedPurpleValuesJson = JSON.stringify(mergedPurpleValues);

          const { data: updated, errors } = await client.models.PurpleTable.update({
            id: existingRecord.id,
            purpleValues: mergedPurpleValuesJson, // Pass as JSON string
            dayTotal,
          });

          if (errors) throw errors;
          return updated;
        } else {
          // Create new record
          const { data: created, errors } = await client.models.PurpleTable.create({
            siteId,
            iccid,
            rowdate,
            dayTotal,
            purpleValues: purpleValuesJson, // Pass as JSON string
          });

          if (errors) throw errors;
          return created;
        }
      })
    );

    return results;

  } catch (error) {
    console.error("Operation failed:", {
      error,
      input: payload?.[0],
    });
    throw error;
  }
};