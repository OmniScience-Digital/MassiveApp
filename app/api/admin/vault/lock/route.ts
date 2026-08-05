import { NextResponse } from "next/server";
import { requireAdmin, vaultDataClient } from "@/lib/admin-auth";

const LOCK_ID = "GLOBAL";
const LOCK_TTL_MS = 3 * 60 * 1000; // 3 minutes, refreshed by heartbeat

async function logAudit(
  action: string,
  actor: { userId: string; displayName: string },
  detail?: string,
) {
  await vaultDataClient.models.VaultAuditLog.create({
    action,
    actorId: actor.userId,
    actorName: actor.displayName,
    detail,
    timestamp: new Date().toISOString(),
  });
}

// GET: current lock status (who holds it, if anyone, and whether it's expired)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: lock } = await vaultDataClient.models.VaultLock.get({
    lockId: LOCK_ID,
  });

  if (!lock || new Date(lock.expiresAt) < new Date()) {
    return NextResponse.json({ locked: false });
  }

  return NextResponse.json({
    locked: true,
    holderId: lock.holderId,
    holderName: lock.holderName,
    isMe: lock.holderId === admin.userId,
    expiresAt: lock.expiresAt,
  });
}

// POST: acquire the lock (fails if someone else currently holds a non-expired lock)
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existing } = await vaultDataClient.models.VaultLock.get({
    lockId: LOCK_ID,
  });

  const now = new Date();
  if (existing && new Date(existing.expiresAt) > now && existing.holderId !== admin.userId) {
    return NextResponse.json(
      {
        error: "Vault is in use",
        holderName: existing.holderName,
        expiresAt: existing.expiresAt,
      },
      { status: 409 },
    );
  }

  const acquiredAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS).toISOString();

  await vaultDataClient.models.VaultLock.create(
    {
      lockId: LOCK_ID,
      holderId: admin.userId,
      holderName: admin.displayName,
      acquiredAt,
      expiresAt,
    },
    // upsert semantics — overwrite any expired/prior lock
  ).catch(() =>
    vaultDataClient.models.VaultLock.update({
      lockId: LOCK_ID,
      holderId: admin.userId,
      holderName: admin.displayName,
      acquiredAt,
      expiresAt,
    }),
  );

  await logAudit("lock", admin);
  return NextResponse.json({ locked: true, expiresAt });
}

// PATCH: heartbeat — extend the lock's expiry while the holder is still active
export async function PATCH() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existing } = await vaultDataClient.models.VaultLock.get({
    lockId: LOCK_ID,
  });

  if (!existing || existing.holderId !== admin.userId) {
    return NextResponse.json({ error: "You do not hold the lock" }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString();
  await vaultDataClient.models.VaultLock.update({
    lockId: LOCK_ID,
    expiresAt,
  });

  return NextResponse.json({ locked: true, expiresAt });
}

// DELETE: release the lock. ?takeover=1 lets another admin forcibly reclaim it
// (loudly logged) if the holder walked away without releasing it.
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const isTakeover = url.searchParams.get("takeover") === "1";

  const { data: existing } = await vaultDataClient.models.VaultLock.get({
    lockId: LOCK_ID,
  });

  if (existing && existing.holderId !== admin.userId && !isTakeover) {
    return NextResponse.json({ error: "You do not hold the lock" }, { status: 409 });
  }

  await vaultDataClient.models.VaultLock.delete({ lockId: LOCK_ID });

  if (isTakeover && existing && existing.holderId !== admin.userId) {
    await logAudit(
      "takeover",
      admin,
      `Force-released lock held by ${existing.holderName}`,
    );
  } else {
    await logAudit("unlock", admin);
  }

  return NextResponse.json({ locked: false });
}
