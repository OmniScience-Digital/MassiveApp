import { client } from "./schemaClient";


export const createOrUpdatePurpleDaily = async (
  siteId: string,
  payload: {
    data: Array<{
      iccid: string;
      purpleValues: Record<string, Record<string, string>>; // day -> hours
    }>;
  }
) => {
  try {
    const { data } = payload;

    if (!Array.isArray(data)) {
      throw new Error("Data must be an array");
    }

    const promises: Promise<any>[] = [];

    for (const entry of data) {
      const { iccid, purpleValues } = entry;

      for (const [date, hours] of Object.entries(purpleValues)) {
        // Wrap each async operation in a promise
        promises.push(
          (async () => {
            // Fetch existing records for the date
            const { data: existingRecords, errors: queryErrors } =
              await client.models.Purplefigures.listPurplefiguresByDate({ date });

            if (queryErrors) throw queryErrors;

            // Find matching row for siteId + iccid
            const existingRow = existingRecords.find(
              item => item.siteId === siteId && item.iccid === iccid
            );

            console.log(existingRow);
            console.log(entry);
            

            if (existingRow) {

              // Update existing row only if values actually change
              const existingPurpleValues =
                typeof existingRow.purpleValues === "string"
                  ? JSON.parse(existingRow.purpleValues)
                  : existingRow.purpleValues || {};

          
                // const { data: updated, errors } = await client.models.Purplefigures.update({
                //   id: existingRow.id,
                //   siteId: existingRow.siteId,   
                //   iccid: existingRow.iccid,     
                //   date: existingRow.date,       
                //   purpleValues: JSON.stringify({ ...existingPurpleValues, ...hours }),
                // });

                // const { data: updated, errors } = await client.models.Purplefigures.update({
                //     id: exactRecord[0].id,
                //     siteId: exactRecord[0].siteId, // Must match exactly
                //     date: exactRecord[0].date,     // Must match exactly  
                //     iccid: exactRecord[0].iccid,
                //     purpleValues: { ...existingPurpleValues, ...hours }
                //   });

                // if (errors) throw errors;
                // return updated;
           

            } else {
              console.log('not existingRow');
              // Create new row
              const { data: created, errors } = await client.models.Purplefigures.create({
                siteId,
                iccid,
                date,
                purpleValues: JSON.stringify(hours),
              });

              if (errors) throw errors;
              return created;
            }
          })()
        );
      }
    }

    // Wait for all updates/creates to finish in parallel
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Operation failed:", {
      error,
      inputSample: payload.data?.[0],
    });
    throw error;
  }
};

