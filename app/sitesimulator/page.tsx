"use client";
import { useState, useRef, ChangeEvent, useEffect } from "react";
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
import { Upload, FileText, X, Send, Loader2, AlertCircle } from "lucide-react";

interface CSVData {
  headers: string[];
  rows: string[][];
  rawData: string;
}

interface SimulationStatus {
  totalRows: number;
  currentIndex: number;
  isRunning: boolean;
  currentICCID?: string;
  currentTime: string;
  nextReset: string;
}

const SiteSimulator = () => {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");
  const [connectionError, setConnectionError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear status when component mounts to prevent stale data
  useEffect(() => {
    setStatus(null);
    setConnectionError(false);
  }, []);

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
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(parseCSV(text));
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setCsvData(null);
    setStatus(null);
    setConnectionError(false);
    setMessage(" ");
    setShow(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendToBackend = async () => {
    if (!csvData) return;
    setIsSending(true);
    try {
      const payload = {
        filename: fileInputRef.current?.files?.[0]?.name || "uploaded.csv",
        headers: csvData.headers,
        rows: csvData.rows,
        rawData: csvData.rawData,
        totalRows: csvData.rows.length,
        totalColumns: csvData.headers.length,
      };
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      setMessage(result.message || "CSV sent successfully!");
      setShow(true);
      setSuccessful(res.ok);
    } catch (error) {
      setMessage("Error sending CSV: " + error);
      setShow(true);
      setSuccessful(false);
    } finally {
      setIsSending(false);
    }
  };

  const fetchStatus = async () => {
    try {
      setConnectionError(false);
      const res = await fetch("/api/get-status");

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const result = await res.json();
      console.log;

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

  const stopSimulation = async () => {
    try {
      const res = await fetch("/api/stop-simulator", { method: "POST" });
      const result = await res.json();

      setMessage(result.data?.message || "Simulation stopped");
      setShow(true);
      setSuccessful(res.ok);
      fetchStatus(); // refresh status after stopping
    } catch (err) {
      setMessage(`Error stopping simulation: ${err}`);
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
                CSV Upload & Simulator Control
              </CardTitle>
              <CardDescription>
                Upload CSV, check status, and control simulation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {show && (
                <div
                  className={`p-4 rounded-md ${
                    successful
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {message}
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
                <Button onClick={handleClear} variant="outline">
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
                <Button onClick={fetchStatus} variant="outline">
                  <FileText className="w-4 h-4 mr-1" /> Check Status
                </Button>
                <Button
                  onClick={stopSimulation}
                  variant="destructive"
                  disabled={!status?.isRunning}
                >
                  Stop Simulator
                </Button>
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
                  <p>Unable to connect to the simulator backend.</p>
                  <p className="text-sm mt-2">
                    Please ensure the backend server is running and try again.
                  </p>
                </div>
              )}

              {status ? (
                <div className="mt-4 p-4 border rounded bg-gray-50">
                  <h3 className="font-bold mb-2">Simulator Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium">Running:</p>
                      <p
                        className={
                          status.isRunning ? "text-green-600" : "text-red-600"
                        }
                      >
                        {status.isRunning ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Total Rows:</p>
                      <p>{status.totalRows}</p>
                    </div>
                    <div>
                      <p className="font-medium">Current Index:</p>
                      <p>{status.currentIndex}</p>
                    </div>
                    <div>
                      <p className="font-medium">Current ICCID:</p>
                      <p>{status.currentICCID || "-"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Next Reset:</p>
                      <p>{status.nextReset}</p>
                    </div>
                    <div>
                      <p className="font-medium">Last Updated:</p>
                      <p>{new Date(status.currentTime).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                !connectionError && (
                  <div className="mt-4 p-4 border rounded bg-gray-50 text-center text-gray-500">
                    No status data available. Click "Check Status" to fetch
                    current status.
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

export default SiteSimulator;
