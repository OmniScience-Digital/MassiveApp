// components/widgets/telegramMonitor/TelegramMonitorConfig.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
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
import { TelegramMonitorConfig } from "@/types/schema";

// Small reusable "add a chip, remove a chip" list — used for both the
// excluded company user IDs and the keyword list below.
function ChipListEditor({
  values,
  onChange,
  placeholder,
  inputType = "text",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  inputType?: string;
}) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...values, trimmed]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type={inputType}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addValue}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground">None added yet</span>
        )}
        {values.map((value) => (
          <Badge key={value} variant="secondary" className="gap-1 pr-1">
            {value}
            <button
              type="button"
              className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              onClick={() => onChange(values.filter((v) => v !== value))}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function TelegramMonitorConfigPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TelegramMonitorConfig>({
    companyUserIds: [],
    keywords: [],
    alertChatId: "",
  });
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    getTelegramMonitorConfig()
      .then(setConfig)
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
          <CardTitle className="text-base">Excluded Company Members</CardTitle>
          <CardDescription>
            Messages from these Telegram user IDs never trigger an alert —
            add every internal staff member's numeric Telegram ID here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChipListEditor
            values={config.companyUserIds}
            placeholder="e.g. 123456789"
            inputType="text"
            onChange={(companyUserIds) =>
              setConfig((prev) => ({ ...prev, companyUserIds }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keywords</CardTitle>
          <CardDescription>
            A client message containing any of these (case-insensitive) will
            raise an alert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChipListEditor
            values={config.keywords}
            placeholder="e.g. refund"
            onChange={(keywords) => setConfig((prev) => ({ ...prev, keywords }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert Destination</CardTitle>
          <CardDescription>
            The Telegram chat ID the bot sends alerts to when a keyword or
            tag match is found (e.g. an internal ops group).
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