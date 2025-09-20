import * as constants from "@/app/constants";
import { ReportItem } from "@/types/schema";

//baseUrlprod
//baseUrl
//securebaseUrlprod
//securebaseUrltest

export const runShiftReport = async (sitedata: ReportItem, shift: string) => {
  try {
    const response = await fetch(
      `${constants.securebaseUrltest}/telegramshiftroute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sitedata: sitedata,
          shift: shift.trim(),
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

export const runtelegramReportwithDate = async (
  sitedata: ReportItem,
  params: { startTime: string; endTime: string; shift: string },
) => {
  try {
    console.log(params);

    const response = await fetch(
      `${constants.securebaseUrltest}/runtelegramReportwithDate`,
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

export const MassrunShiftReport = async (
  selectedTime: string,
  reportType: string,
  siteStatus: string,
) => {
  try {
    const response = await fetch(
      `${constants.securebaseUrltest}/masstelegramshiftroute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stoptime: selectedTime,
          shift: reportType.trim(),
          siteStatus: siteStatus.trim(),
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
