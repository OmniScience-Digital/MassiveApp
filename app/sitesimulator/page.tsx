'use client'
import { useState, useRef, ChangeEvent } from 'react';
import Footer from '@/components/layout/footer'
import Navbar from '@/components/layout/navbar'
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Send, Loader2 } from 'lucide-react';

interface CSVData {
    headers: string[];
    rows: string[][];
    rawData: string; // Store original CSV text
}


const SiteSimulator = () => {

    const [csvData, setCsvData] = useState<CSVData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState('');

    const parseCSV = (text: string): CSVData => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return { headers: [], rows: [], rawData: text };
        }

        const headers = lines[0].split(',').map(header => header.trim());
        const rows = lines.slice(1).map(line =>
            line.split(',').map(cell => cell.trim())
        ).filter(row => row.some(cell => cell !== ''));

        return { headers, rows, rawData: text };
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            console.error('Please upload a CSV file');
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsedData = parseCSV(text);
                setCsvData(parsedData);
            } catch (error) {
                console.error('Error parsing CSV:', error);
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            console.error('Error reading file');
            setIsLoading(false);
        };

        reader.readAsText(file);
    };

    const handleClear = () => {
        setCsvData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const sendToBackend = async () => {
        if (!csvData) {
            console.error('No CSV data to send');
            return;
        }

        setIsSending(true);

        try {
            // Prepare the data to send
            const payload = {
                filename: fileInputRef.current?.files?.[0]?.name || 'uploaded.csv',
                headers: csvData.headers,
                rows: csvData.rows,
                rawData: csvData.rawData,
                totalRows: csvData.rows.length,
                totalColumns: csvData.headers.length
            };


            // Replace this with your actual API endpoint
            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                setMessage(`✅ CSV data sent successfully to backend!`);
                setShow(true);
                setSuccessful(true);
            } else {
                console.error('❌ Failed to send CSV data:', response.statusText);
                setMessage(`Failed to upload Csv data: ${response.statusText}`);
                setShow(true);
                setSuccessful(false);
            }
        } catch (error) {
            console.error('❌ Error sending CSV data:', error);

            setMessage(`Error sending Csv data: ${error}`);
            setShow(true);
            setSuccessful(false);
        } finally {
            setIsSending(false);
        }
    };

    // Alternative: Send as FormData with file
    const sendFileToBackend = async () => {
        if (!fileInputRef.current?.files?.[0]) {
            console.error('No file selected');
            return;
        }

        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append('csvFile', fileInputRef.current.files[0]);

            console.log('Sending file to backend...');

            // Replace this with your actual API endpoint
            const response = await fetch('/api/upload-csv-file', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Backend response:', result);
                console.log('✅ CSV file sent successfully to backend!');
            } else {
                console.error('❌ Failed to send CSV file:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error sending CSV file:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 p-1 h-f mt-20">

                <div className="container mx-auto p-6 max-w-6xl">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">CSV Upload</CardTitle>
                            <CardDescription>
                                Upload a CSV file and send it to your backend
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {/* Upload Section */}
                            {show && (
                                <div className={`p-4 rounded-md ${successful
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    }`}>
                                    {message}
                                </div>
                            )}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".csv"
                                    className="hidden"
                                />

                                <div className="space-y-4">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />

                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            Drag and drop your CSV file
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            or
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleUploadClick}
                                        disabled={isLoading}
                                        className="gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {isLoading ? 'Processing...' : 'Browse Files'}
                                    </Button>

                                    <p className="text-xs text-gray-500">
                                        Supports .csv files only
                                    </p>
                                </div>
                            </div>

                            {/* Data Preview and Actions */}
                            {csvData && (
                                <div className="space-y-6">
                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold">
                                                {csvData.rows.length} rows loaded
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClear}
                                                className="gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Clear
                                            </Button>

                                            <Button
                                                onClick={sendToBackend}
                                                disabled={isSending}
                                                className="gap-2 bg-green-600 hover:bg-green-700"
                                            >
                                                {isSending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                {isSending ? 'Sending...' : 'Send to Backend'}
                                            </Button>

                                            {/* Alternative: Send file directly */}
                                            <Button
                                                onClick={sendFileToBackend}
                                                disabled={isSending}
                                                variant="outline"
                                                className="gap-2"
                                            >
                                                {isSending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                Send File
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {csvData.headers.map((header, index) => (
                                                            <TableHead key={index} className="font-bold bg-muted/50">
                                                                {header}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                                                        <TableRow key={rowIndex}>
                                                            {row.map((cell, cellIndex) => (
                                                                <TableCell key={cellIndex}>
                                                                    {cell}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                    {csvData.rows.length > 10 && (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={csvData.headers.length}
                                                                className="text-center text-muted-foreground py-4"
                                                            >
                                                                Showing first 10 of {csvData.rows.length} rows
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="text-center p-3 bg-muted rounded-lg">
                                            <div className="font-semibold">Columns</div>
                                            <div className="text-2xl font-bold text-primary">
                                                {csvData.headers.length}
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-muted rounded-lg">
                                            <div className="font-semibold">Rows</div>
                                            <div className="text-2xl font-bold text-primary">
                                                {csvData.rows.length}
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-muted rounded-lg">
                                            <div className="font-semibold">File Type</div>
                                            <div className="text-2xl font-bold text-primary">CSV</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </main>
            <Footer />

        </div>
    )
}

export default SiteSimulator


