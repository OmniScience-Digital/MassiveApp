// app/api/admin/vault/credentials/[id]/route.ts

import { NextResponse } from "next/server";
import { requireAdmin, vaultDataClient } from "@/lib/admin-auth";
import { decryptFields, encryptFields } from "@/lib/vault-crypto";

// GET: reveal decrypted field values for one credential.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: credential } = await vaultDataClient.models.Credential.get({
    id: params.id,
  });
  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields = decryptFields(credential.fieldsCipher);
  return NextResponse.json({ fields });
}

// PATCH: update a credential's fields/notes/url/tags.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, fields, notes, url, tags } = body as {
    name?: string;
    fields?: Record<string, string>;
    notes?: string;
    url?: string;
    tags?: string[];
  };

  const update: Record<string, unknown> = {
    id: params.id,
    updatedBy: admin.displayName,
  };
  if (name !== undefined) update.name = name;
  if (notes !== undefined) update.notes = notes;
  if (url !== undefined) update.url = url;
  if (tags !== undefined) update.tags = tags;
  if (fields !== undefined) {
    update.fieldsCipher = encryptFields(fields);
    update.fieldNames = Object.keys(fields);
    update.lastRotatedAt = new Date().toISOString();
  }

  const { errors } = await vaultDataClient.models.Credential.update(
    update as { id: string },
  );
  if (errors) {
    return NextResponse.json({ error: errors[0]?.message ?? "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: remove a credential.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await vaultDataClient.models.Credential.delete({ id: params.id });
  return NextResponse.json({ ok: true });
}