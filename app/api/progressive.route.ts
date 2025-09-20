import * as constants from "@/app/constants";
import { ReportItem } from "@/types/schema";

//baseUrlprod
//baseUrl
//securebaseUrlprod
//securebaseUrltest

export const runprogressiveShiftReport = async (
  sitedata: ReportItem,
  params: { startTime: string; endTime: string },
) => {
  try {
    const response = await fetch(
      `${constants.securebaseUrltest}/progressiveshiftroute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sitedata: sitedata,
          params: params,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
