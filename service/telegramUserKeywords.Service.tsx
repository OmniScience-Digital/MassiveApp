// service/telegramUserKeywords.Service.tsx
import { UserKeywordEntry } from "@/types/schema";
import { client } from "./schemaClient";

// Read-only by design — these records are only ever written via the
// @<bot> keyword=..., delete_keyword=..., print_keyword chat commands
// (self-service, restricted to known internal staff). The dashboard just
// shows the current state for visibility.
export const listUserKeywords = async (): Promise<UserKeywordEntry[]> => {
  try {
    const { data, errors } = await client.models.TelegramUserKeyword.list();

    if (errors) {
      console.error(
        "Error listing Telegram user keywords:",
        JSON.stringify(errors, null, 2),
      );
      return [];
    }

    return (data ?? []).map((row) => ({
      userId: row.id,
      username: row.username ?? undefined,
      displayName: row.displayName ?? undefined,
      keywords: (row.keywords ?? []).filter((v): v is string => v !== null),
    }));
  } catch (error) {
    console.error("Error fetching Telegram user keywords:", error);
    return [];
  }
};