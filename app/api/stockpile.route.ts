import * as constants from "@/app/constants";
import { ReportItem } from "@/types/schema";

export const runStockpileReport = async (
  sitedata: ReportItem,
  params: { startTime: string; endTime: string },
  reqstockpileNumber: string,
) => {
  try {
    const { startTime, endTime } = params;

    if (reqstockpileNumber.trim() === "") {
      reqstockpileNumber = "";
    }

    const response = await fetch(`${constants.securebaseUrlprod}/stockpile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sitedata: sitedata,
        startTime: startTime,
        endTime: endTime,
        reqstockpileNumber,
      }),
    });

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
