import { client } from "./schemaClient";

// export const createOrUpdatePurpleDaily = async (
//   siteId: string,
//   payload: {
//     data: Array<{
//       iccid: string;
//       purpleValues: Record<string, Record<string, string>>; // day -> hours
//     }>;
//   }
// ) => {
//   try {
//     const { data } = payload;

//     if (!Array.isArray(data)) {
//       throw new Error("Data must be an array");
//     }

//     const results: any[] = [];

//     var count =1;
//     // Loop through each iccid and each day
//     for (const entry of data) {
//       const { iccid, purpleValues } = entry;

//       for (const [date, hours] of Object.entries(purpleValues)) {
//         // 1. Check if a row already exists for siteId + iccid + date
//         const { data: existingRecords, errors: queryErrors } =
//             await client.models.Purplefigures.listPurplefiguresByDate({date});

//         if (queryErrors) throw queryErrors;

//         const existingRowArray = existingRecords.filter(
//         item => item.siteId === siteId && item.iccid === iccid
//         );

        
//         if (existingRowArray.length > 0) {
//           // 2A. Update existing row
//           const existingRow = existingRowArray[0];

//           const existingPurpleValues =
//             typeof existingRow.purpleValues === "string"
//               ? JSON.parse(existingRow.purpleValues)
//               : existingRow.purpleValues || {};

//           const { data: updated, errors } = await client.models.Purplefigures.update({
//             id: existingRow.id,
//             siteId,
//             iccid,
//             date,
//             purpleValues: JSON.stringify({
//               ...existingPurpleValues,
//               ...hours, 
//             }),
//           });

//           if (errors) throw errors;
//           results.push(updated);
//         } else {
//           // 2B. Create new row
//           const { data: created, errors } = await client.models.Purplefigures.create({
//             siteId,
//             iccid,
//             date,
//             purpleValues: JSON.stringify(hours),
//           });

//           if (errors) throw errors;
//           results.push(created);
//         }
//       }
//     }

//     return results;
//   } catch (error) {
//     console.error("Operation failed:", {
//       error,
//       inputSample: payload.data?.[0],
//     });
//     throw error;
//   }
// };


interface datesAudit {
  startDate: string;
  endDate: string;
}


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

            if (existingRow) {
              // Update existing row
              const existingPurpleValues =
                typeof existingRow.purpleValues === "string"
                  ? JSON.parse(existingRow.purpleValues)
                  : existingRow.purpleValues || {};

              const { data: updated, errors } = await client.models.Purplefigures.update({
                id: existingRow.id,
                siteId,
                iccid,
                date,
                purpleValues: JSON.stringify({ ...existingPurpleValues, ...hours }),
              });

              if (errors) throw errors;
              return updated;
            } else {
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

