import { NextResponse } from "next/server";
import { requireAdmin, vaultDataClient } from "@/lib/admin-auth";
import { decryptFields, encryptFields } from "@/lib/vault-crypto";

async function assertHoldsLock(userId: string) {
  const { data: lock } = await vaultDataClient.models.VaultLock.get({
    lockId: "GLOBAL",
  });
  return !!lock && lock.holderId === userId && new Date(lock.expiresAt) > new Date();
}

// GET: reveal decrypted field values for one credential. Requires the lock.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!(await assertHoldsLock(admin.userId))) {
    return NextResponse.json(
      { error: "You must hold the vault lock to reveal a credential" },
      { status: 409 },
    );
  }

  const { data: credential } = await vaultDataClient.models.Credential.get({
    id: params.id,
  });
  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields = decryptFields(credential.fieldsCipher);

  await vaultDataClient.models.VaultAuditLog.create({
    action: "view",
    actorId: admin.userId,
    actorName: admin.displayName,
    credentialId: credential.id,
    credentialName: credential.name,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ fields });
}

// PATCH: update a credential's fields/notes/url/tags. Requires the lock.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!(await assertHoldsLock(admin.userId))) {
    return NextResponse.json(
      { error: "You must hold the vault lock to edit a credential" },
      { status: 409 },
    );
  }

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

  const { data: updated, errors } = await vaultDataClient.models.Credential.update(
    update as { id: string },
  );
  if (errors) {
    return NextResponse.json({ error: errors[0]?.message ?? "Update failed" }, { status: 500 });
  }

  await vaultDataClient.models.VaultAuditLog.create({
    action: "update",
    actorId: admin.userId,
    actorName: admin.displayName,
    credentialId: params.id,
    credentialName: updated?.name,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

// DELETE: remove a credential. Requires the lock.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!(await assertHoldsLock(admin.userId))) {
    return NextResponse.json(
      { error: "You must hold the vault lock to delete a credential" },
      { status: 409 },
    );
  }

  const { data: existing } = await vaultDataClient.models.Credential.get({
    id: params.id,
  });

  await vaultDataClient.models.Credential.delete({ id: params.id });

  await vaultDataClient.models.VaultAuditLog.create({
    action: "delete",
    actorId: admin.userId,
    actorName: admin.displayName,
    credentialId: params.id,
    credentialName: existing?.name,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
