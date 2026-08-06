// service/telegramMonitor.Service.tsx
import { TelegramMonitorConfig } from "@/types/schema";
import { client } from "./schemaClient";

// One shared record for the whole monitor (exclusion list, keywords, and
// where alerts get sent) — same pattern as StatusReportConfig.
const GLOBAL_CONFIG_ID = "global";

const emptyConfig: TelegramMonitorConfig = {
  companyUserIds: [],
  keywords: [],
  alertChatId: "",
};

export const getTelegramMonitorConfig = async (): Promise<TelegramMonitorConfig> => {
  try {
    const { data, errors } = await client.models.TelegramMonitorConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    if (errors || !data) return emptyConfig;

    return {
      companyUserIds: (data.companyUserIds ?? []).filter(
        (v): v is string => v !== null,
      ),
      keywords: (data.keywords ?? []).filter((v): v is string => v !== null),
      alertChatId: data.alertChatId ?? "",
    };
  } catch (error) {
    console.error("Error fetching Telegram monitor config:", error);
    return emptyConfig;
  }
};

export const saveTelegramMonitorConfig = async (
  config: TelegramMonitorConfig,
): Promise<TelegramMonitorConfig | null> => {
  try {
    const { data: existing } = await client.models.TelegramMonitorConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    const payload = {
      id: GLOBAL_CONFIG_ID,
      companyUserIds: config.companyUserIds,
      keywords: config.keywords,
      alertChatId: config.alertChatId,
    };

    const response = existing
      ? await client.models.TelegramMonitorConfig.update(payload)
      : await client.models.TelegramMonitorConfig.create(payload);

    if (response.errors) {
      console.error("Error saving Telegram monitor config:", response.errors);
      return null;
    }

    return config;
  } catch (error) {
    console.error("Error saving Telegram monitor config:", error);
    return null;
  }
};