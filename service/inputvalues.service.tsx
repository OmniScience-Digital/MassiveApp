import { client } from "./schemaClient";

export const createOrUpdateInputValueTable = async (
    siteId: string,
    payload: {
      timestamp: string;
      data: Array<{
        iccid: string;
        inputValues: Record<string, Record<string, string>>;
      }>;
    }
  ) => {
    try {
      const { timestamp, data } = payload;
  
      // Validate input data
      if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
      }
  
      // 1. Find existing record - ONLY filter by siteId
      const { data: existingRecords, errors: queryErrors } = 
        await client.models.InputValueTable.list({
          filter: {
            siteId: { eq: siteId }
          },
          limit: 1
        });
  
      if (queryErrors) {
        console.error("Query error:", queryErrors);
        throw queryErrors;
      }
  
      const existingRecord = existingRecords[0];
      let result;
  
      // 2. Prepare the data with proper JSON serialization
      const newData = data.map(entry => ({
        iccid: entry.iccid,
        inputValues: entry.inputValues,
        siteId // Include siteId in each entry
      }));
  
      // Ensure data is properly serialized
      const serializedData = JSON.stringify(newData);
  
      if (existingRecord) {
        // 3A. Merge with existing data
        let existingData: any[] = [];
        try {
          existingData = typeof existingRecord.data === 'string' 
            ? JSON.parse(existingRecord.data) 
            : existingRecord.data;
        } catch (e) {
          console.error("Failed to parse existing data:", existingRecord.data);
          throw new Error("Invalid existing data format");
        }
  
        if (!Array.isArray(existingData)) {
          throw new Error("Existing data is not an array");
        }
  
        // Create a map for efficient merging
        const newDataMap = new Map(newData.map(item => [item.iccid, item]));
        const mergedData = existingData.map((item: any) => {
          if (newDataMap.has(item.iccid)) {
            // Deep merge inputValues
            const newItem = newDataMap.get(item.iccid);
            return {
              ...item,
              inputValues: {
                ...item.inputValues,
                ...newItem?.inputValues
              }
            };
          }
          return item;
        });
  
        // Add any completely new entries
        newDataMap.forEach((value, key) => {
          if (!existingData.some((item: any) => item.iccid === key)) {
            mergedData.push(value);
          }
        });
  
        // Update the record with properly serialized data
        const { data: updated, errors } = await client.models.InputValueTable.update({
          id: existingRecord.id,
          siteId,
          timestamp: existingRecord.timestamp, // Keep the original timestamp
          data: JSON.stringify(mergedData) // Explicit serialization
        });
  
        if (errors) throw errors;
        result = updated;
      } else {
        // 3B. Create new record with properly serialized data
        const { data: created, errors } = await client.models.InputValueTable.create({
          siteId,
          timestamp, // Use the provided timestamp for new records
          data: serializedData // Use the pre-serialized data
        });
  
        if (errors) throw errors;
        result = created;
      }
  

      
      return result;
  
    } catch (error) {
      console.error("Operation failed:", {
        error,
        input: {
          siteId,
          timestamp: payload.timestamp,
          dataSample: payload.data?.[0] // Log first item for debugging
        }
      });
      throw error;
    }
  };



export const deleteInputValueTable = async (
    siteId: string,
    timestamp: string,
    iccidsToDelete?: string[] // Optional: delete specific ICCIDs only
  ) => {
    try {
      // 1. Find the record to modify
      const { data: existingRecords, errors: queryErrors } = 
        await client.models.InputValueTable.list({
          filter: {
            siteId: { eq: siteId },
            timestamp: { eq: timestamp }
          }
        });
  
      if (queryErrors) {
        console.error("Query error:", queryErrors);
        throw new Error("Failed to query records");
      }
  
      if (existingRecords.length === 0) {
        console.warn("No record found for deletion");
        return null;
      }
  
      const record = existingRecords[0];
  
      if (!iccidsToDelete) {
        // 2A. Delete entire record
        const { data: deleted, errors } = await client.models.InputValueTable.delete({
          id: record.id
        });
        if (errors) throw errors;
        return { action: "deleted" };
      } else {
        // 2B. Delete specific ICCIDs
        const currentData = record.data ? 
          (typeof record.data === 'string' ? 
            JSON.parse(record.data) : 
            record.data) : 
          [];
  
        const filteredData = currentData.filter(
          (item: any) => !iccidsToDelete.includes(item.iccid)
        );
  
        if (filteredData.length === 0) {
          // Delete if no data left
          const { data: deleted, errors } = await client.models.InputValueTable.delete({
            id: record.id
          });
          if (errors) throw errors;
          return { action: "deleted" };
        } else {
          // Update with remaining data
          const { data: updated, errors } = await client.models.InputValueTable.update({
            id: record.id,
            siteId,
            timestamp,
            data: filteredData
          });
          if (errors) throw errors;
          return { action: "updated", data: filteredData };
        }
      }
    } catch (error) {
      console.error("Deletion failed:", error);
      throw error;
    }
  };