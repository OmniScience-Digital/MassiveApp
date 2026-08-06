// app/api/admin/vault/bootstrap/route.ts
import { NextResponse } from "next/server";
import { requireAdmin, vaultDataClient } from "@/lib/admin-auth";

// GET: everything the vault page needs on load, in one admin check.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: creds } = await vaultDataClient.models.Credential.list();

  const credentials = creds
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
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ credentials });
}