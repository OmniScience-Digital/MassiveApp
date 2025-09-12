import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from 'next/server';

//baseUrlprod
//baseUrl
//securebaseUrlprod
//securebaseUrltest



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.filename || !body.headers || !body.rows) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, headers, or rows' },
        { status: 400 }
      );
    }

    // Forward to your audit route
    const response = await fetch(`${constants.securebaseUrltest}/sitesimulator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalRows: body.totalRows,
        totalColumns: body.totalColumns,
        headers: body.headers,
        rows: body.rows,
      }),
    });

    // Check if the external request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      throw new Error(`External API returned ${response.status}: ${errorText}`);
    }

    const externalResponse = await response.json();

    return NextResponse.json({
      success: true,
      message: 'CSV data processed and forwarded successfully',
      data: {
        rowsReceived: body.rows.length,
        columns: body.headers.length,
        filename: body.filename,
        externalResponse: externalResponse // Include the response from the external API
      }
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process CSV data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

