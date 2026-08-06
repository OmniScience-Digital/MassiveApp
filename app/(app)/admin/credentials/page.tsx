// app/admin/credentials/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AddCredentialDialog } from "@/components/admin/add-credential-dialog";
import { CredentialCard, MaskedCredential } from "@/components/admin/credential-card";

export default function CredentialsVaultPage() {
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<MaskedCredential[]>([]);

  const bootstrap = useCallback(async () => {
    const res = await fetch("/api/admin/vault/bootstrap");
    if (res.ok) {
      const body = await res.json();
      setCredentials(body.credentials);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (loading) {
    return <div className="mx-auto max-w-6xl p-6 pt-24 text-sm text-muted-foreground">Loading vault…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 pt-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Credentials Vault</h1>
        </div>
        <AddCredentialDialog onCreated={bootstrap} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {credentials.map((c) => (
          <CredentialCard key={c.id} credential={c} onDeleted={bootstrap} />
        ))}
        {credentials.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No credentials yet. Add the first one.
          </p>
        )}
      </div>
    </div>
  );
}