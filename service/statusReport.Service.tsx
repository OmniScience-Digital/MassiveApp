// service/statusReport.Service.tsx
import { StatusCheck } from "@/types/schema";
import { client } from "./schemaClient";

// The Status Report's check criteria are global — one shared config that
// applies to every site (test + prod) — so unlike scales/formulas this is
// NOT stored inside a Sites.site JSON blob. It lives in its own
// StatusReportConfig model as a single well-known record.
const GLOBAL_CONFIG_ID = "global";

export const getStatusReportConfig = async (): Promise<StatusCheck[]> => {
  try {
    const { data, errors } = await client.models.StatusReportConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    if (errors || !data?.checks) {
      return [];
    }

    const parsed =
      typeof data.checks === "string" ? JSON.parse(data.checks) : data.checks;

    return Array.isArray(parsed) ? (parsed as StatusCheck[]) : [];
  } catch (error) {
    console.error("Error fetching status report config:", error);
    return [];
  }
};

export const saveStatusReportConfig = async (
  checks: StatusCheck[],
): Promise<StatusCheck[] | null> => {
  try {
    const { data: existing } = await client.models.StatusReportConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    const payload = JSON.stringify(checks);

    const response = existing
      ? await client.models.StatusReportConfig.update({
          id: GLOBAL_CONFIG_ID,
          checks: payload,
        })
      : await client.models.StatusReportConfig.create({
          id: GLOBAL_CONFIG_ID,
          checks: payload,
        });

    if (response.errors) {
      console.error("Error saving status report config:", response.errors);
      return null;
    }

    return checks;
  } catch (error) {
    console.error("Error saving status report config:", error);
    return null;
  }
};