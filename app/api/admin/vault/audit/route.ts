import { NextResponse } from "next/server";
import { requireAdmin, vaultDataClient } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: logs } = await vaultDataClient.models.VaultAuditLog.list();

  const sorted = logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return NextResponse.json({ logs: sorted.slice(0, 100) });
}
