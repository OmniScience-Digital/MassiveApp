// /app/api/stop-simulator/route.ts
import * as constants from "@/app/constants";
import { NextResponse } from "next/server";

//baseUrlprod
//baseUrl
//securebaseUrlprod
//securebaseUrltest

export async function POST() {
  try {
    console.log("Stop simulation called");

    // Force no caching
    const response = await fetch(
      `${constants.securebaseUrltest}/stopsimulator`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", 
      },
    );

    // Detect backend failure
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);

    const externalResponse = await response.json();

    // If backend returns nothing
    if (!externalResponse) throw new Error("Backend returned no data");

    return NextResponse.json(
      {
        success: true,
        data: externalResponse,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error stopping simulator:", error);

    // Return safe default
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: (error as Error).message || "Backend unreachable",
      },
      { status: 500 },
    );
  }
}
