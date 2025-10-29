// /app/api/get-status/route.ts
import * as constants from "@/app/constants";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Force no caching
    const response = await fetch(`${constants.securebaseUrltest}/csvparsergetStatus`, {
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Backend returned ${response.status}`);

    const externalResponse = await response.json();

    if (!externalResponse.batches) {
      throw new Error("Backend returned no batch data");
    }

    // Compute summary totals
    const totalBatches = externalResponse.batches.length;
    const totalRows = externalResponse.batches.reduce(
      (sum: number, b: any) => sum + b.totalExpected,
      0
    );
    const totalPushed = externalResponse.batches.reduce(
      (sum: number, b: any) => sum + b.pushed,
      0
    );
    const totalRemaining = externalResponse.batches.reduce(
      (sum: number, b: any) => sum + b.remaining,
      0
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          totalBatches,
          totalRows,
          totalPushed,
          totalRemaining,
          batches: externalResponse.batches,
          timestamp: externalResponse.timestamp,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching batches progress:", error);

    // Return default offline/empty response
    return NextResponse.json(
      {
        success: false,
        data: {
          totalBatches: 0,
          totalRows: 0,
          totalPushed: 0,
          totalRemaining: 0,
          batches: [],
          timestamp: new Date().toISOString(),
        },
        error: (error as Error).message || "Backend unreachable",
      },
      { status: 500 }
    );
  }
}
