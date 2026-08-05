"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  VaultKind,
  VAULT_KIND_LABELS,
  VAULT_KIND_PRESET_FIELDS,
  VAULT_KIND_DEFAULT_URL,
} from "@/lib/vault-presets";

type FieldRow = { label: string; value: string };

export function AddCredentialDialog({
  onCreated,
}: {
  onCreated: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<VaultKind>("github");
  const [name, setName] = useState("");
  const [url, setUrl] = useState(VAULT_KIND_DEFAULT_URL.github);
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [fields, setFields] = useState<FieldRow[]>(
    VAULT_KIND_PRESET_FIELDS.github.map((label) => ({ label, value: "" })),
  );

  function applyKind(next: VaultKind) {
    setKind(next);
    setUrl(VAULT_KIND_DEFAULT_URL[next]);
    setFields(VAULT_KIND_PRESET_FIELDS[next].map((label) => ({ label, value: "" })));
  }

  function updateField(i: number, patch: Partial<FieldRow>) {
    setFields((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeField(i: number) {
    setFields((rows) => rows.filter((_, idx) => idx !== i));
  }

  function reset() {
    setName("");
    setNotes("");
    setTagsInput("");
    applyKind("github");
    setError("");
  }

  async function handleSave() {
    setError("");
    const cleanFields = fields.filter((f) => f.label.trim() && f.value.trim());
    if (!name.trim() || cleanFields.length === 0) {
      setError("Give it a name and at least one filled-in field.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vault/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          fields: Object.fromEntries(cleanFields.map((f) => [f.label.trim(), f.value])),
          notes: notes.trim() || undefined,
          url: url.trim() || undefined,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save credential");
      }
      reset();
      setOpen(false);
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add credential
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a credential</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => applyKind(v as VaultKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VAULT_KIND_LABELS) as VaultKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {VAULT_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GitHub - Org PAT"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Quick-launch URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFields((f) => [...f, { label: "", value: "" }])}
              >
                <Plus className="mr-1 h-3 w-3" /> Add field
              </Button>
            </div>
            {fields.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="w-2/5"
                  placeholder="Label (e.g. Token)"
                  value={row.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                />
                <Input
                  type="password"
                  className="flex-1"
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => updateField(i, { value: e.target.value })}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="prod, ci"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              placeholder="Anything the next admin should know…"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save credential
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
