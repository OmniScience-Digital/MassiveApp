// app/(app)/telegrammonitor/page.tsx
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TelegramMonitorConfigPanel from "@/components/widgets/telegramMonitor/TelegramMonitorConfig";

const TelegramMonitorPage = () => {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Telegram Group Monitor</h1>
        <p className="text-sm text-muted-foreground">
          The bot watches monitored Telegram groups for client messages
          (excluding your own team) and alerts you when a keyword is used or
          someone is tagged.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monitor Settings</CardTitle>
          <CardDescription>
            Manage who's excluded from alerts, what keywords to watch for,
            and where alerts get sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TelegramMonitorConfigPanel />
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramMonitorPage;