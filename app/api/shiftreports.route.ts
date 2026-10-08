import * as constants from "@/app/constants";
import { ReportItem } from "@/types/schema";

export const runShiftReport = async (sitedata: ReportItem, shift: string) => {
  try {
    const response = await fetch(
      `${constants.securebaseUrlprod}/telegramshiftroute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "", 
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

    return await response.json();
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
    const response = await fetch(
      `${constants.securebaseUrlprod}/runtelegramReportwithDate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "", 
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

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// Runs the hourly Telegram report for one site on demand (same as the scheduled hourly run).
export const runHourlyReport = async (
  sitedata: ReportItem,
  // endTime is the END of the hour: 08:00 reports 07:00-08:00 on endDate (default today).
  // Omit both for the latest hour.
  options: { endDate?: string; endTime?: string } = {},
) => {
  try {
    const response = await fetch(`${constants.securebaseUrlprod}/runhourlyreport`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "",
      },
      body: JSON.stringify({ sitedata: sitedata, ...options }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status: ${response.status}`);
    }

    return data as { status: "sent" | "skipped"; message: string };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};