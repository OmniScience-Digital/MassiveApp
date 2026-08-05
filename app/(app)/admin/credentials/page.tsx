"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { VaultLockBanner, LockStatus } from "@/components/admin/vault-lock-banner";
import { AddCredentialDialog } from "@/components/admin/add-credential-dialog";
import { CredentialCard, MaskedCredential } from "@/components/admin/credential-card";
import { AuditLogPanel, AuditEntry } from "@/components/admin/audit-log-panel";

export default function CredentialsVaultPage() {
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [lockBusy, setLockBusy] = useState(false);
  const [credentials, setCredentials] = useState<MaskedCredential[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshLock = useCallback(async () => {
    const res = await fetch("/api/admin/vault/lock");
    if (res.ok) setLockStatus(await res.json());
  }, []);

  const refreshCredentials = useCallback(async () => {
    const res = await fetch("/api/admin/vault/credentials");
    if (res.ok) setCredentials((await res.json()).credentials);
  }, []);

  const refreshAudit = useCallback(async () => {
    const res = await fetch("/api/admin/vault/audit");
    if (res.ok) setAudit((await res.json()).logs);
  }, []);

  useEffect(() => {
    refreshLock();
    refreshCredentials();
    refreshAudit();
    const poll = setInterval(() => {
      refreshLock();
    }, 15000);
    return () => clearInterval(poll);
  }, [refreshLock, refreshCredentials, refreshAudit]);

  // Heartbeat to keep the lock alive while this admin is actively in the vault,
  // and release it automatically if they navigate away.
  useEffect(() => {
    if (lockStatus?.locked && lockStatus.isMe) {
      heartbeatRef.current = setInterval(() => {
        fetch("/api/admin/vault/lock", { method: "PATCH" });
      }, 60000);
      return () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      };
    }
  }, [lockStatus]);

  useEffect(() => {
    const releaseOnLeave = () => {
      navigator.sendBeacon?.("/api/admin/vault/lock", "");
    };
    window.addEventListener("beforeunload", releaseOnLeave);
    return () => window.removeEventListener("beforeunload", releaseOnLeave);
  }, []);

  async function handleEnter() {
    setLockBusy(true);
    try {
      const res = await fetch("/api/admin/vault/lock", { method: "POST" });
      if (res.ok) await refreshLock();
      else await refreshLock();
    } finally {
      setLockBusy(false);
    }
  }

  async function handleLeave() {
    setLockBusy(true);
    try {
      await fetch("/api/admin/vault/lock", { method: "DELETE" });
      await refreshLock();
      await refreshAudit();
    } finally {
      setLockBusy(false);
    }
  }

  async function handleTakeover() {
    setLockBusy(true);
    try {
      await fetch("/api/admin/vault/lock?takeover=1", { method: "DELETE" });
      await handleEnter();
      await refreshAudit();
    } finally {
      setLockBusy(false);
    }
  }

  const canReveal = !!lockStatus?.locked && lockStatus.isMe;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 pt-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Credentials Vault</h1>
        </div>
        {canReveal && (
          <AddCredentialDialog
            onCreated={async () => {
              await refreshCredentials();
              await refreshAudit();
            }}
          />
        )}
      </div>

      <VaultLockBanner
        status={lockStatus}
        busy={lockBusy}
        onEnter={handleEnter}
        onLeave={handleLeave}
        onTakeover={handleTakeover}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {credentials.map((c) => (
          <CredentialCard
            key={c.id}
            credential={c}
            canReveal={canReveal}
            onDeleted={async () => {
              await refreshCredentials();
              await refreshAudit();
            }}
          />
        ))}
        {credentials.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No credentials yet. Enter the vault and add the first one.
          </p>
        )}
      </div>

      <AuditLogPanel entries={audit} />
    </div>
  );
}
