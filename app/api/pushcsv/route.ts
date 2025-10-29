import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json();
    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    // Fire and forget (no await)
    fetch(`${constants.securebaseUrltest}/csvparserUpload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId }),
    }).catch((err) => console.error("Trigger failed:", err));

    // Immediately return to frontend
    return NextResponse.json({
      success: true,
      message: `Triggered backend processing for batchId: ${batchId}`,
    });
  } catch (error) {
    console.error("Error in progress POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
