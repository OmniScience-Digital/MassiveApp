import * as constants from "@/app/constants";

const getPreviousDateFormatted = (now: string) => {
  const prevDate = new Date(now);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split("T")[0];
  return prevDateStr;
};

export const runauditDateReport = async (
  siteid: string,
  date: string,
  isDatelast: boolean,
) => {
  try {
    const prevDate = getPreviousDateFormatted(date);
    const response = await fetch(
      `${constants.securebaseUrlprod}/auditdateroute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteid: siteid,
          params: {
            startTime: prevDate,
            endTime: date,
            isDatelast: isDatelast,
          },
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
