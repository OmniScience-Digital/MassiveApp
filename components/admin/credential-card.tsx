"use client";

// components/admin/credential-card.tsx

import { useState } from "react";
import { Eye, EyeOff, Copy, Check, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VAULT_KIND_LABELS, VaultKind } from "@/lib/vault-presets";

export type MaskedCredential = {
  id: string;
  kind: string;
  name: string;
  fieldNames: string[];
  notes?: string | null;
  url?: string | null;
  tags: string[];
  updatedBy?: string | null;
  lastRotatedAt?: string | null;
};

export function CredentialCard({
  credential,
  onDeleted,
}: {
  credential: MaskedCredential;
  onDeleted: () => void | Promise<void>;
}) {
  const [revealed, setRevealed] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function toggleReveal() {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/vault/credentials/${credential.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not reveal");
      }
      const body = await res.json();
      setRevealed(body.fields);
      // auto re-mask after 30s, mirroring a clipboard-clear style safeguard
      setTimeout(() => setRevealed(null), 30000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reveal");
    } finally {
      setLoading(false);
    }
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey((k) => (k === label ? null : k)), 1500);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${credential.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/vault/credentials/${credential.id}`, { method: "DELETE" });
      await onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{credential.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">
              {VAULT_KIND_LABELS[credential.kind as VaultKind] ?? credential.kind}
            </Badge>
          </div>
          <div className="flex gap-1">
            {credential.url && (
              <Button variant="ghost" size="icon" asChild>
                <a href={credential.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {credential.fieldNames.map((label) => (
          <div key={label} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2 font-mono">
              <span>{revealed ? revealed[label] ?? "—" : "••••••••"}</span>
              {revealed && (
                <button onClick={() => copyValue(label, revealed[label] ?? "")} className="text-muted-foreground hover:text-foreground">
                  {copiedKey === label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={toggleReveal}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : revealed ? (
            <EyeOff className="mr-2 h-4 w-4" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {revealed ? "Hide" : "Reveal"}
        </Button>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {credential.notes && <p className="text-xs text-muted-foreground">{credential.notes}</p>}
        {credential.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {credential.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}