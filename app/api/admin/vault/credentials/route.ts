// app/api/admin/vault/credentials/route.ts

import { NextResponse } from "next/server";
import { requireAdmin, vaultDataClient } from "@/lib/admin-auth";
import { encryptFields } from "@/lib/vault-crypto";

// GET: list all credentials, masked — field labels only, never decrypted values.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: credentials } = await vaultDataClient.models.Credential.list();

  const masked = credentials
    .map((c) => ({
      id: c.id,
      kind: c.kind,
      name: c.name,
      fieldNames: c.fieldNames ?? [],
      notes: c.notes,
      url: c.url,
      tags: c.tags ?? [],
      createdBy: c.createdBy,
      updatedBy: c.updatedBy,
      lastRotatedAt: c.lastRotatedAt,
      createdAt: c.createdAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ credentials: masked });
}

// POST: create a new credential. Body:
// { kind, name, fields: {label: value}, notes?, url?, tags? }
// Only allowed while the caller holds the vault lock.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { kind, name, fields, notes, url, tags } = body as {
    kind: string;
    name: string;
    fields: Record<string, string>;
    notes?: string;
    url?: string;
    tags?: string[];
  };

  if (!kind || !name || !fields || Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "kind, name and at least one field are required" },
      { status: 400 },
    );
  }

  const fieldsCipher = encryptFields(fields);

  const { data: created, errors } = await vaultDataClient.models.Credential.create({
    kind,
    name,
    fieldsCipher,
    fieldNames: Object.keys(fields),
    notes,
    url,
    tags: tags ?? [],
    createdBy: admin.displayName,
    updatedBy: admin.displayName,
  });

  if (errors) {
    return NextResponse.json({ error: errors[0]?.message ?? "Create failed" }, { status: 500 });
  }

  return NextResponse.json({ id: created?.id });
}