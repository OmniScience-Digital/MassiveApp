// app/api/upload-csv/route.ts
import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.filename || !body.headers || !body.rows) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Process single chunk
    const result = await processSingleChunk(body);
    
    return NextResponse.json({
      success: true,
      chunk: body.chunkInfo?.chunkIndex || 0,
      rowsProcessed: body.rows.length,
      data: result,
    });

  } catch (error) {
    console.error("Error processing CSV chunk:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process CSV chunk",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function processSingleChunk(chunkData: any) {
  const payload = {
    startRowIndex: chunkData.globalStartRowIndex,
    totalRows: chunkData.totalRows,
    totalColumns: chunkData.headers.length,
    headers: chunkData.headers,
    rows: chunkData.rows,
    batchId:chunkData.batchId,
  };

  const response = await fetch(
    `${constants.securebaseUrltest}/csvparser`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`External API returned ${response.status}`);
  }

  return await response.json();
}



