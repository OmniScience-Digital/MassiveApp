"use client";

import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type AuditEntry = {
  id: string;
  action: string;
  actorName: string;
  credentialName?: string | null;
  detail?: string | null;
  timestamp: string;
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  view: "secondary",
  create: "default",
  update: "outline",
  delete: "destructive",
  lock: "outline",
  unlock: "outline",
  takeover: "destructive",
};

export function AuditLogPanel({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <Badge variant={ACTION_VARIANT[e.action] ?? "outline"} className="mr-2 align-middle">
                    {e.action}
                  </Badge>
                  <span className="font-medium">{e.actorName}</span>
                  {e.credentialName && <span className="text-muted-foreground"> · {e.credentialName}</span>}
                  {e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
