// import { client } from "./schemaClient";

// export const createOrUpdatePurpleDaily = async (
//   siteId: string,
//   payload: {
//     timestamp: string;
//     data: Array<{
//       iccid: string;
//       purpleValues: Record<string, Record<string, string>>; // day -> hours
//     }>;
//   }
// ) => {
//   try {
//     const { timestamp, data } = payload;

//     if (!Array.isArray(data)) {
//       throw new Error("Data must be an array");
//     }

//     const results: any[] = [];

//     // Loop through each iccid and each day
//     for (const entry of data) {
//       const { iccid, purpleValues } = entry;

//       for (const [date, hours] of Object.entries(purpleValues)) {
//         // 1. Check if a row already exists for siteId + iccid + date
//         const { data: existingRecords, errors: queryErrors } =
//           await client.models.PurpleDaily.list({
//             filter: {
//               siteId: { eq: siteId },
//               iccid: { eq: iccid },
//               date: { eq: date },
//             },
//             limit: 1,
//           });

//         if (queryErrors) throw queryErrors;

//         if (existingRecords.length > 0) {
//           // 2A. Update existing row
//           const existingRow = existingRecords[0];

//           const { data: updated, errors } = await client.models.PurpleDaily.update({
//             id: existingRow.id,
//             siteId,
//             iccid,
//             date,
//             timestamp,
//             purpleValues: JSON.stringify({
//               ...existingRow.purpleValues,
//               ...hours, // merge hours if needed, overwrite conflicts
//             }),
//           });

//           if (errors) throw errors;
//           results.push(updated);
//         } else {
//           // 2B. Create new row
//           const { data: created, errors } = await client.models.PurpleDaily.create({
//             siteId,
//             iccid,
//             date,
//             timestamp,
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



// export const deleteInputValueTable = async (
//     siteId: string,
//     timestamp: string,
//     iccidsToDelete?: string[] // Optional: delete specific ICCIDs only
//   ) => {
//     try {
//       // 1. Find the record to modify
//       const { data: existingRecords, errors: queryErrors } = 
//         await client.models.InputValueTable.list({
//           filter: {
//             siteId: { eq: siteId },
//             timestamp: { eq: timestamp }
//           }
//         });
  
//       if (queryErrors) {
//         console.error("Query error:", queryErrors);
//         throw new Error("Failed to query records");
//       }
  
//       if (existingRecords.length === 0) {
//         console.warn("No record found for deletion");
//         return null;
//       }
  
//       const record = existingRecords[0];
  
//       if (!iccidsToDelete) {
//         // 2A. Delete entire record
//         const { data: deleted, errors } = await client.models.InputValueTable.delete({
//           id: record.id
//         });
//         if (errors) throw errors;
//         return { action: "deleted" };
//       } else {
//         // 2B. Delete specific ICCIDs
//         const currentData = record.data ? 
//           (typeof record.data === 'string' ? 
//             JSON.parse(record.data) : 
//             record.data) : 
//           [];
  
//         const filteredData = currentData.filter(
//           (item: any) => !iccidsToDelete.includes(item.iccid)
//         );
  
//         if (filteredData.length === 0) {
//           // Delete if no data left
//           const { data: deleted, errors } = await client.models.InputValueTable.delete({
//             id: record.id
//           });
//           if (errors) throw errors;
//           return { action: "deleted" };
//         } else {
//           // Update with remaining data
//           const { data: updated, errors } = await client.models.InputValueTable.update({
//             id: record.id,
//             siteId,
//             timestamp,
//             data: filteredData
//           });
//           if (errors) throw errors;
//           return { action: "updated", data: filteredData };
//         }
//       }
//     } catch (error) {
//       console.error("Deletion failed:", error);
//       throw error;
//     }
//   };