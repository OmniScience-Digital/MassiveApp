// app/api/upload-csv/route.ts
import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";



const MAX_ROWS_PER_CHUNK = 4000; // Conservative limit

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.filename || !body.headers || !body.rows) {
      return NextResponse.json(
        { error: "Missing required fields: filename, headers, or rows" },
        { status: 400 },
      );
    }

    // Process with chunking
    const result = await processWithChunking(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      {
        error: "Failed to process CSV data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function processWithChunking(body: any) {
  const totalRows = body.rows.length;
  const totalChunks = Math.ceil(totalRows / MAX_ROWS_PER_CHUNK);

   const startRowIndex = body.rows.findIndex((row: string[]) => 
    row[1] === "1" || row[1] === "1.00"  // Start Flag is at index 1 so we add 1 to eliminate rows
  );

  body.startRowIndex=startRowIndex;
  
  console.log(`Start row index found: ${startRowIndex}`);
  console.log(`Processing ${totalRows} rows in ${totalChunks} chunks`);

  // If it's a small file, process in one go
  if (totalChunks === 1) {
    const result = await processSingleChunk(body);
    return {
      success: true,
      message: "CSV data processed successfully",
      data: {

        rowsReceived: totalRows,
        columns: body.headers.length,
        filename: body.filename,
        externalResponse: result,
      },
    };
  }

  // Process large file in chunks
  const results = [];
  const errors = [];

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startRow = chunkIndex * MAX_ROWS_PER_CHUNK;
    const endRow = Math.min(startRow + MAX_ROWS_PER_CHUNK, totalRows);
    const chunkRows = body.rows.slice(startRow, endRow);

    try {
      console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}`);
      
      const chunkResult = await processSingleChunk({
        ...body,
        rows: chunkRows
      }, chunkIndex);

      results.push({
        chunk: chunkIndex + 1,
        rowsProcessed: chunkRows.length,
        success: true,
      });

      // Small delay between chunks
      if (chunkIndex < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
      errors.push({
        chunk: chunkIndex + 1,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  const totalProcessed = results.reduce((sum, r) => sum + r.rowsProcessed, 0);
  
  return {
    success: errors.length === 0,
    message: errors.length === 0 
      ? `Successfully processed ${totalProcessed} rows in ${totalChunks} chunks`
      : `Processed ${totalProcessed} of ${totalRows} rows with ${errors.length} errors`,
    data: {
      rowsReceived: totalRows,
      rowsProcessed: totalProcessed,
      columns: body.headers.length,
      filename: body.filename,
      totalChunks,
      successfulChunks: results.length,
      failedChunks: errors.length,
    },
  };
}

async function processSingleChunk(chunkData: any, chunkIndex = 0) {
  const payload = {
    startRowIndex:chunkData.startRowIndex,
    totalRows: chunkData.totalRows,
    totalColumns: chunkData.totalColumns,
    headers: chunkData.headers,
    rows: chunkData.rows,
    chunkInfo: chunkData.rows.length < chunkData.totalRows ? {
      chunkIndex,
      isChunked: true,
      chunkRows: chunkData.rows.length,
      totalChunks: Math.ceil(chunkData.totalRows / MAX_ROWS_PER_CHUNK)
    } : undefined
  };

  const response = await fetch(
    `${constants.securebaseUrltest}/sitesimulator`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`External API returned ${response.status}: ${errorText}`);
  }

  return await response.json();
}


