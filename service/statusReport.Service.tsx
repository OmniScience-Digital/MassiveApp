// service/statusReport.Service.tsx
import { StatusReportConfig, SiteStatusReportConfig } from "@/types/schema";
import { client } from "./schemaClient";

// The Status Report's check criteria are one shared record, but now scoped
// per site + per scale internally — every site still runs in the
// twice-daily report, this just controls what's checked and how for each
// one. Stored as a single well-known record, same pattern as before.
const GLOBAL_CONFIG_ID = "global";

export const getStatusReportConfig = async (): Promise<StatusReportConfig> => {
  try {
    const { data, errors } = await client.models.StatusReportConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    if (errors || !data?.checks) {
      return { sites: {} };
    }

    const parsed =
      typeof data.checks === "string" ? JSON.parse(data.checks) : data.checks;

    if (parsed && typeof parsed === "object" && parsed.sites) {
      return parsed as StatusReportConfig;
    }
    return { sites: {} };
  } catch (error) {
    console.error("Error fetching status report config:", error);
    return { sites: {} };
  }
};

export const saveSiteStatusReportConfig = async (
  siteId: string,
  siteConfig: SiteStatusReportConfig,
): Promise<StatusReportConfig | null> => {
  try {
    const current = await getStatusReportConfig();
    const updated: StatusReportConfig = {
      sites: { ...current.sites, [siteId]: siteConfig },
    };

    const { data: existing } = await client.models.StatusReportConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    const payload = JSON.stringify(updated);

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

    return updated;
  } catch (error) {
    console.error("Error saving status report config:", error);
    return null;
  }
};