// /app/api/get-status/route.ts
import * as constants from "@/app/constants";
import { NextResponse } from "next/server";


//baseUrlprod
//baseUrl
//securebaseUrlprod
//securebaseUrltest


export async function GET() {
  try {
    // Force no caching
    const response = await fetch(`${constants.securebaseUrltest}/simulatorstatus`, {
      cache: 'no-store', // ensures we always hit the backend
    });

    // If Express is down, throw
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);

    const externalResponse = await response.json();

    // Check if backend actually returned data
    if (!externalResponse.data) {
      throw new Error('Backend returned no data');
    }

    // Return the real data
    return NextResponse.json({
      success: true,
      data: externalResponse.data
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching simulator status:', error);

    // Return default "offline" status instead of old data
    return NextResponse.json({
      success: false,
      data: {
        totalRows: 0,
        currentIndex: 0,
        isRunning: false,
        currentICCID: '-',
        currentTime: new Date().toISOString(),
        nextReset: '-'
      },
      error: (error as Error).message || 'Backend unreachable'
    }, { status: 500 });
  }
}
