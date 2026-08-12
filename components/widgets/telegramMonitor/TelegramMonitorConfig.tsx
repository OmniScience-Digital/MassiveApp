// components/widgets/telegramMonitor/TelegramMonitorConfig.tsx
"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ResponseModal from "../response";
import Loading from "@/components/widgets/loading";
import {
  getTelegramMonitorConfig,
  saveTelegramMonitorConfig,
} from "@/service/telegramMonitor.Service";
import { listUserKeywords } from "@/service/telegramUserKeywords.Service";
import { TelegramMonitorConfig, UserKeywordEntry } from "@/types/schema";

export default function TelegramMonitorConfigPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TelegramMonitorConfig>({
    companyUserIds: [],
    alertChatId: "",
  });
  const [userKeywords, setUserKeywords] = useState<UserKeywordEntry[]>([]);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getTelegramMonitorConfig(), listUserKeywords()])
      .then(([cfg, keywords]) => {
        setConfig(cfg);
        setUserKeywords(keywords);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveTelegramMonitorConfig(config);
      setSuccessful(!!result);
      setMessage(result ? "Monitor settings saved" : "Failed to save settings");
    } catch {
      setSuccessful(false);
      setMessage("Unexpected error while saving");
    } finally {
      setShow(true);
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Excluded Company Members (Ignore List)</CardTitle>
          <CardDescription>
            When one of these people sends a client message, keyword matches
            route to the centralized alert chat below instead of a personal
            DM. Tag matches always go centralized regardless. Managed only
            from inside Telegram by a group admin — tag the bot and send{" "}
            <code className="text-xs">ignore @username</code> to add someone,
            or <code className="text-xs">unignore @username</code> to remove
            them (e.g. <code className="text-xs">@your_bot ignore @username</code>).
            This list is read-only here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {config.companyUserIds.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No one excluded yet
              </span>
            )}
            {config.companyUserIds.map((value) => (
              <Badge key={value} variant="secondary">
                {value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Keywords (Per Person)</CardTitle>
          <CardDescription>
            Each staff member manages their own keyword list by tagging the
            bot in a monitored group: <code className="text-xs">@your_bot keyword = flow, scale</code>{" "}
            to add, <code className="text-xs">@your_bot delete_keyword = flow</code>{" "}
            to remove one, or <code className="text-xs">@your_bot print_keyword</code>{" "}
            to see their own list in chat. A client message matching someone's
            keyword is sent to that person directly. This view is read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userKeywords.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No one has set personal keywords yet
            </span>
          )}
          <div className="space-y-3">
            {userKeywords.map((entry) => (
              <div key={entry.userId} className="border rounded-md p-3">
                <div className="text-sm font-medium mb-1">
                  {entry.displayName || entry.username || `id:${entry.userId}`}
                  {entry.username && entry.displayName && (
                    <span className="text-muted-foreground font-normal"> (@{entry.username})</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.keywords.length === 0 && (
                    <span className="text-xs text-muted-foreground">No keywords set</span>
                  )}
                  {entry.keywords.map((kw) => (
                    <Badge key={kw} variant="secondary">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Centralized Alert Chat</CardTitle>
          <CardDescription>
            The Telegram chat ID that receives: tag-match alerts (always),
            and keyword-match alerts from anyone on the ignore list above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={config.alertChatId}
            placeholder="e.g. -100123456789"
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, alertChatId: e.target.value }))
            }
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {saving ? (
          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
          </Button>
        ) : (
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        )}
      </div>

      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}
    </div>
  );
}