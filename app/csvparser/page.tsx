"use client";
import { useState, useRef, ChangeEvent } from "react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, Send, Loader2, AlertCircle, X, FileText } from "lucide-react";

interface CSVData {
  headers: string[];
  rows: string[][];
  rawData: string;
}

interface UploadProgress {
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  status: string;
}

interface BatchProgress {
  batchId: string;        // ID of the batch
  totalExpected: number;  // total rows expected in the batch
  pushed: number;         // rows already pushed/processed
  remaining: number;      // rows left in Redis
}

interface AllBatchesProgressResponse {
  success: boolean;          // indicates if the request succeeded
  batches: BatchProgress[];  // array of all batches with their progress
  timestamp: string;         // timestamp when this status was fetched
}


const CSVParser = () => {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AllBatchesProgressResponse | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_ROWS = 1000;
  const MAX_COLUMNS = 52;
  const CHUNK_SIZE = 500; // 500 rows per chunk = 2 chunks for 1000 rows

  const parseCSV = (text: string): CSVData => {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines
      .slice(1)
      .map((line) => line.split(",").map((c) => c.trim()));
    return { headers, rows, rawData: text };
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setConnectionError(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedData = parseCSV(text);

      // Validate CSV
      if (parsedData.rows.length > MAX_ROWS) {
        setMessage(`CSV exceeds maximum row limit of ${MAX_ROWS}. Found ${parsedData.rows.length} rows.`);
        setShow(true);
        setSuccessful(false);
        setIsLoading(false);
        return;
      }

      if (parsedData.headers.length > MAX_COLUMNS) {
        setMessage(`CSV exceeds maximum column limit of ${MAX_COLUMNS}. Found ${parsedData.headers.length} columns.`);
        setShow(true);
        setSuccessful(false);
        setIsLoading(false);
        return;
      }

      setCsvData(parsedData);
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setCsvData(null);
    setShow(false);
    setConnectionError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendToBackend = async () => {
    if (!csvData) return;
    setIsSending(true);
    setConnectionError(false);

    const totalRows = csvData.rows.length;
    const totalChunks = Math.ceil(totalRows / CHUNK_SIZE);

    // GENERATE BATCH ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;



    const globalStartRowIndex = csvData.rows.findIndex((row: string[]) =>
      row[1] === "1" || row[1] === "1.00"
    );

    setUploadProgress({
      currentChunk: 0,
      totalChunks: totalChunks,
      percentage: 0,
      status: "Starting upload..."
    });

    try {
      const results = [];
      const errors = [];

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startRow = chunkIndex * CHUNK_SIZE;
        const endRow = Math.min(startRow + CHUNK_SIZE, totalRows);
        const chunkRows = csvData.rows.slice(startRow, endRow);

        setUploadProgress({
          currentChunk: chunkIndex + 1,
          totalChunks: totalChunks,
          percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100),
          status: `Uploading chunk ${chunkIndex + 1} of ${totalChunks}...`
        });

        try {
          const payload = {
            filename: fileInputRef.current?.files?.[0]?.name || "uploaded.csv",
            headers: csvData.headers,
            rows: chunkRows,
            totalRows: totalRows,
            totalColumns: csvData.headers.length,
            globalStartRowIndex: globalStartRowIndex,
            batchId: batchId,
            chunkInfo: {
              chunkIndex,
              totalChunks,
            }
          };

          const res = await fetch("/api/csv-parser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await res.json();

          if (res.ok && result.success) {
            results.push(result);
          } else {
            throw new Error(result.error || `Chunk ${chunkIndex + 1} failed`);
          }

          if (chunkIndex < totalChunks - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (error) {
          errors.push({
            chunk: chunkIndex + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const totalProcessed = results.reduce((sum, r) => sum + (r.rowsProcessed || 0), 0);

      if (errors.length === 0) {
        fetch("/api/pushcsv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId }),
        }).catch(console.error);


        setMessage(`✅ Success! Uploaded ${totalProcessed} rows in ${totalChunks} chunks ,starting publish shortly`);
        setSuccessful(true);
      } else {
        setMessage(`⚠ Processed ${totalProcessed} of ${totalRows} rows with ${errors.length} errors`);
        setSuccessful(false);
      }

      setShow(true);



    } catch (error) {
      setConnectionError(true);
      setMessage("Connection Error: Unable to connect to the CSV parser backend.");
      setShow(true);
      setSuccessful(false);
    } finally {
      setIsSending(false);
      setUploadProgress(null);
    }
  };

  const fetchStatus = async () => {
    try {
      clearFile();
      setMessage("");
      setConnectionError(false);
      const res = await fetch("/api/progress-csvparser");

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        setStatus(result.data);
      } else {
        // Clear status if backend returns an error
        setStatus(null);
      }
    } catch (err) {
      console.error("Error fetching status", err);
      // Clear status and show connection error
      setStatus(null);
      setConnectionError(true);
      setMessage(
        "Unable to connect to the server. Please check if the backend is running.",
      );
      setShow(true);
      setSuccessful(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-1 mt-20">
        <div className="container mx-auto p-6 max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                CSV Parser
              </CardTitle>
              <CardDescription>
                Upload CSV (max {MAX_ROWS} rows, max {MAX_COLUMNS-2} columns), then submit by sending.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {show && (
                <div
                  className={`p-4 rounded-md ${successful
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {message}
                </div>
              )}

              {uploadProgress && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      {uploadProgress.status}
                    </span>
                    <span className="text-sm text-blue-700">
                      {uploadProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-1" />
                  )}
                  {isLoading ? "Loading..." : "Browse CSV"}
                </Button>
                <Button
                  onClick={sendToBackend}
                  disabled={isSending || !csvData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  {isSending ? "Sending..." : "Send to Backend"}
                </Button>
                {/* <Button onClick={fetchStatus} variant="outline">
                  <FileText className="w-4 h-4 mr-1" /> Check Status
                </Button> */}
                {csvData && (
                  <Button
                    onClick={clearFile}
                    variant="outline"
                    disabled={isSending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>

                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />

              {csvData && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvData.headers.map((header, i) => (
                          <TableHead key={i}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.rows.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.rows.length > 10 && (
                    <div className="text-sm text-gray-500 mt-2 text-center">
                      Showing first 10 rows of {csvData.rows.length} total rows
                    </div>
                  )}
                </div>
              )}

              {connectionError && (
                <div className="mt-4 p-4 border rounded bg-amber-50 border-amber-200">
                  <div className="flex items-center text-amber-800 mb-2">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <h3 className="font-bold">Connection Error</h3>
                  </div>
                  <p>Unable to connect to the CSV parser backend.</p>
                  <p className="text-sm mt-2">
                    Please ensure the backend server is running and try again.
                  </p>
                </div>
              )}

              {status ? (
                <div className="mt-4 p-4 border rounded bg-gray-50">
                  <h3 className="font-bold mb-2">Batches Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium">Total Batches:</p>
                      <p>{status.batches.length}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Rows Expected:</p>
                      <p>{status.batches.reduce((sum, b) => sum + b.totalExpected, 0)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Pushed:</p>
                      <p>{status.batches.reduce((sum, b) => sum + b.pushed, 0)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Remaining:</p>
                      <p>{status.batches.reduce((sum, b) => sum + b.remaining, 0)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    Last Updated: {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                !connectionError && (
                  <div className="mt-4 p-4 border rounded bg-gray-50 text-center text-gray-500">
                    No progress data available. Click "Check Status" to fetch current progress.
                  </div>
                )
              )}


            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CSVParser;



