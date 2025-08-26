import { client } from "./schemaClient";

interface HourValues {
  [hour: string]: number; // e.g. { "00": 1.2, "01": 1.5 }
}

interface PurpleFigureRecord {
  id?: string;
  siteId: string;
  iccid: string;
  date: string;
  hourValues: HourValues;
  timestamp: string;
}



export const savePurpleFiguresData = async (
  siteId: string,
  payload: PurpleFigureRecord[]
) => {
  // Convert date to AWSDate format (YYYY-MM-DD)
  const toAWSDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  try {

    // get a specific item

  
    const BATCH_SIZE = 5;
    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const batch = payload.slice(i, i + BATCH_SIZE);

      

      await Promise.all(batch.map(async (record) => {
        try {
          const awsDate = toAWSDate(record.date); 

          const { data: dateMatches } = await client.models.Purplefigures.list({
            filter: {
              date: { eq: awsDate } // Uses your date index
            },
            limit: 100 // Adjust based on daily record volume
          });

          const matchingRecord = dateMatches.find(item => 
            item.siteId === record.siteId && 
            item.iccid === record.iccid
          );


          const { data: existingRecords } = await client.models.Purplefigures.list({
          filter: {
            and: [
              { siteId: { eq: record.siteId } },
              { iccid: { eq: record.iccid } },
              { date: { eq: awsDate } }
            ]
          },
          limit: 1, 
        });

          const uniqueRecord = {
            ...record,
            date: awsDate 
          };

          

         
          if (existingRecords?.length) {
            await client.models.Purplefigures.update({
              id: existingRecords[0].id,
              ...uniqueRecord 
            });
          } else {
            
           const createRecord = await client.models.Purplefigures.create(uniqueRecord);
           console.log(createRecord);
          }

        } catch (error) {
          console.error(`Error processing ICCID ${record.iccid}:`, error);
        }
      }));
    }
  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error;
  }
};


