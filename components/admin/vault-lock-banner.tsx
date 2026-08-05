"use client";

import { Lock, Unlock, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LockStatus =
  | { locked: false }
  | { locked: true; holderName: string; isMe: boolean; expiresAt: string };

export function VaultLockBanner({
  status,
  busy,
  onEnter,
  onLeave,
  onTakeover,
}: {
  status: LockStatus | null;
  busy: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onTakeover: () => void;
}) {
  if (!status) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking vault status…
      </div>
    );
  }

  if (!status.locked) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Unlock className="h-4 w-4 text-emerald-600" />
          <span>
            Vault is open. Only one admin can view secrets at a time — entering
            will lock it for everyone else.
          </span>
        </div>
        <Button onClick={onEnter} disabled={busy} size="sm">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
          Enter vault
        </Button>
      </div>
    );
  }

  if (status.isMe) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-emerald-600/40 bg-emerald-600/10 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-emerald-600" />
          <span>
            You're in the vault. It's locked to you until{" "}
            {new Date(status.expiresAt).toLocaleTimeString()} — reveal, add, or edit
            credentials now.
          </span>
        </div>
        <Button onClick={onLeave} disabled={busy} size="sm" variant="outline">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Leave vault
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-600/40 bg-amber-600/10 p-4">
      <div className="flex items-center gap-2 text-sm">
        <Lock className="h-4 w-4 text-amber-600" />
        <span>
          <strong>{status.holderName}</strong> is currently in the vault. Secrets
          are hidden until they leave.
        </span>
      </div>
      <Button onClick={onTakeover} disabled={busy} size="sm" variant="destructive">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
        Take over
      </Button>
    </div>
  );
}
