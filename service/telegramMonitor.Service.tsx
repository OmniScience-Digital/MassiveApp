// service/telegramMonitor.Service.tsx
import { TelegramMonitorConfig } from "@/types/schema";
import { client } from "./schemaClient";

// One shared record for the whole monitor — ignore list + centralized
// alert destination. NOTE: keywords used to live here as one shared global
// list; as of the per-user keyword revision they no longer do — see
// telegramUserKeywords.Service.tsx for the per-person keyword view.
const GLOBAL_CONFIG_ID = "global";

const emptyConfig: TelegramMonitorConfig = {
  companyUserIds: [],
  alertChatId: "",
};

export const getTelegramMonitorConfig = async (): Promise<TelegramMonitorConfig> => {
  try {
    const { data, errors } = await client.models.TelegramMonitorConfig.get({
      id: GLOBAL_CONFIG_ID,
    });

    if (errors) {
      console.error(
        "Error reading Telegram monitor config:",
        JSON.stringify(errors, null, 2),
      );
      return emptyConfig;
    }
    if (!data) {
      console.warn("No Telegram monitor config record found (id: global)");
      return emptyConfig;
    }

    return {
      companyUserIds: (data.companyUserIds ?? []).filter(
        (v): v is string => v !== null,
      ),
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
    const { data: existing, errors: getErrors } =
      await client.models.TelegramMonitorConfig.get({ id: GLOBAL_CONFIG_ID });

    if (getErrors) {
      console.error(
        "Error checking for existing Telegram monitor config:",
        JSON.stringify(getErrors, null, 2),
      );
    }

    // companyUserIds is deliberately NOT included here — it's only ever
    // managed via the ignore / unignore in-chat commands. Sending it back
    // from a possibly-stale dashboard load could overwrite a more recent
    // chat-driven change.
    const payload = {
      id: GLOBAL_CONFIG_ID,
      alertChatId: config.alertChatId,
    };

    const response = existing
      ? await client.models.TelegramMonitorConfig.update(payload)
      : await client.models.TelegramMonitorConfig.create({
          ...payload,
          companyUserIds: [],
        });

    if (response.errors) {
      console.error(
        "Error saving Telegram monitor config:",
        JSON.stringify(response.errors, null, 2),
      );
      return null;
    }

    console.log("Telegram monitor config saved:", response.data);
    return config;
  } catch (error) {
    console.error("Error saving Telegram monitor config:", error);
    return null;
  }
};