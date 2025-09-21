import { client } from "./schemaClient";

export const createOrUpdateInputValueTable = async (
  startdate: string,
  enddate: string,
  payload: Array<{
    siteId: string;
    iccid: string;
    rowdate: string;
    inputValues: Record<string, string>;
  }>,
) => {
  try {
    if (!Array.isArray(payload)) throw new Error("Payload must be an array");
    if (payload.length === 0) return [];

    const siteId = payload[0].siteId;

    const { data: filteredRecords, errors: queryErrors } =
      await client.models.InputTable.listInputTableBySiteIdAndRowdate({
        siteId,
        rowdate: { between: [startdate, enddate] },
      });

    if (queryErrors) throw queryErrors;

    const results = await Promise.all(
      payload.map(async ({ siteId, iccid, rowdate, inputValues }) => {
        const existingRecord = filteredRecords.find(
          (record) => record.iccid === iccid && record.rowdate === rowdate
        );

        const inputValuesJson = JSON.stringify(inputValues);

        if (existingRecord) {
          const existingInputValues =
            typeof existingRecord.inputValues === "object" &&
              existingRecord.inputValues !== null &&
              !Array.isArray(existingRecord.inputValues)
              ? (existingRecord.inputValues as Record<string, string>)
              : {};

          const mergedInputValues = { ...existingInputValues, ...inputValues };

          const { data: updated, errors } = await client.models.InputTable.update({
            id: existingRecord.id,
            siteId,
            iccid,
            rowdate,
            inputValues: JSON.stringify(mergedInputValues),
          });

          if (errors) throw errors;
          return updated;
        } else {
          const { data: created, errors } = await client.models.InputTable.create({
            siteId,
            iccid,
            rowdate,
            inputValues: inputValuesJson,
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

