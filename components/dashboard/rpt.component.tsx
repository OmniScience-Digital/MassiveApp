"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InputList from "@/components/widgets/InputList";
import DynamicTable from "@/components/widgets/tables/dynamictable";
import { ReportItem } from "@/types/schema";
import { Plus, Calendar } from "lucide-react";
import { DynamicInputItem } from "@/types/dynamic-inputs";
import ResponseModal from "../widgets/response";

interface RPTPROPS {
    rptInputs: DynamicInputItem[],
    rpt_dynamictables: ReportItem["dynamic_tables"],
}

export default function Rpt({ rptInputs, rpt_dynamictables }: RPTPROPS) {
    const params = useParams();
    const id = decodeURIComponent(params.id as string);

    // States for RPT configuration
    const [dynamicInputs, setDynamicInputs] = useState<DynamicInputItem[]>(rptInputs);
    const [dynamicTables, setDynamicTables] = useState<ReportItem["dynamic_tables"]>(rpt_dynamictables);
    const [inputListCount, setInputListCount] = useState(0);
    const [dbTableCount, setDbTableCount] = useState(0);

    //response hooks
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");

    // Function to generate date index between two dates
    const generateDateIndex = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return [];

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Generate all dates between start and end (inclusive)
        const currentDate = new Date(start);
        const dateIndex = [];

        while (currentDate < end) {
            dateIndex.push({
                date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
                value: ""
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateIndex;
    };

    // Pull the currently configured month start/end so we can react to changes
    const rptConfig = dynamicInputs.find(
        item => item.inputListName === "RPT Basic Configuration"
    );
    const monthStart = rptConfig?.inputs.find(i => i.label === "Month Start Date and Time")?.value || "";
    const monthEnd = rptConfig?.inputs.find(i => i.label === "Month End Date and Time")?.value || "";

    // Build a fresh Date Index table (all rows default to "1")
    const buildDateIndexTable = (
        existingId?: ReportItem["dynamic_tables"][0]["id"],
    ): ReportItem["dynamic_tables"][0] => {
        const dateIndex = generateDateIndex(monthStart, monthEnd);
        return {
            id: existingId ?? Date.now(),
            tableName: "Date Index",
            columns: ["Date", "Date Index"],
            data: dateIndex.map((item, index) => ({
                id: index + 1,
                "Date": item.date,
                "Date Index": "1", // All rows get "1" initially
            })),
        };
    };

    // Auto-regenerate the Date Index table whenever the configured month
    // start/end dates change, so the table always matches the configuration
    // without needing a manual "Generate Date Index" click.
    useEffect(() => {
        if (!monthStart || !monthEnd) return;

        setDynamicTables(prev => {
            const existingIndex = prev.findIndex(
                table => table.tableName === "Date Index"
            );
            const existing = existingIndex !== -1 ? prev[existingIndex] : undefined;
            const freshTable = buildDateIndexTable(existing?.id);

            // Skip the update if the date range hasn't actually changed, so we
            // don't clobber values the user has already edited on every render.
            if (existing) {
                const existingDates = existing.data.map(row => row["Date"]).join(",");
                const newDates = freshTable.data.map(row => row["Date"]).join(",");
                if (existingDates === newDates) return prev;

                const updated = [...prev];
                updated[existingIndex] = freshTable;
                return updated;
            }

            return [...prev, freshTable];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthStart, monthEnd]);

    // Button to generate Date Index
    const handleGenerateDateIndex = () => {
        // Find RPT Basic Configuration
        if (!rptConfig) {
            setSuccessful(false);
            setMessage("Please setup RPT Basic Configuration first!");
            setShow(true);
            return;
        }

        if (!monthStart || !monthEnd) {
            setSuccessful(false);
            setMessage("Please set both Month Start and End dates in Basic Configuration!");
            setShow(true);
            return;
        }

        // Check if Date Index table already exists
        const existingTable = dynamicTables.find(
            table => table.tableName === "Date Index"
        );
        const dateIndexTable = buildDateIndexTable(existingTable?.id);

        if (existingTable) {
            // Replace existing table
            setDynamicTables(prev =>
                prev.map(table =>
                    table.tableName === "Date Index" ? dateIndexTable : table
                )
            );
        } else {
            // Add new table
            setDynamicTables(prev => [...prev, dateIndexTable]);
        }

    };

    // Button to create RPT Scale Table
    const handleCreateRptScaleTable = () => {
        // Check if RPT Scale table already exists
        const hasRptScale = dynamicTables.some(table =>
            table.tableName === "RPT Scale Table"
        );

        if (hasRptScale) {
            setSuccessful(false);
            setMessage("RPT Scale Table already exists!");
            setShow(true);
            return;
        }

        // Create RPT Scale Table
        const rptScaleTable: ReportItem["dynamic_tables"][0] = {
            id: Date.now() + 1, // Different ID from Date Index
            tableName: "RPT Scale Table",
            columns: ["RPT Key", "RPT Value"],
            data: [
                { id: 1, "RPT Key": "", "RPT Value": "" }
            ]
        };

        setDynamicTables(prev => [...prev, rptScaleTable]);

    };

    const handleAddRptConfig = () => {
        // Check if RPT config already exists
        const hasExistingRptConfig = dynamicInputs.some(item =>
            item.inputListName === "RPT Basic Configuration"
        );

        if (hasExistingRptConfig) {
            setSuccessful(false);
            setMessage("RPT Configuration already exists!");
            setShow(true);
            return;
        }

        // 1. Add InputList for basic configuration

        const basicConfigInput: DynamicInputItem = {
            id: `rpt-basic-${Date.now()}`,
            inputListName: "RPT Basic Configuration",
            inputs: [
                {
                    type: "text",
                    value: "",
                    label: "RPT Sitename",
                    isEditing: false
                },
                {
                    type: "number",
                    value: "",
                    label: "Total Monthly Fixed Cost",
                    isEditing: false
                },
                {
                    type: "number",
                    value: "",
                    label: "Total Monthly Maintenance Budget",
                    isEditing: false
                },
                {
                    type: "number",
                    value: "",
                    label: "Total Minimum Return",
                    isEditing: false
                },
                {
                    type: "datetime-local",
                    value: "",
                    label: "Month Start Date and Time",
                    isEditing: false
                },
                {
                    type: "datetime-local",
                    value: "",
                    label: "Month End Date and Time",
                    isEditing: false
                },

                {
                    type: "number",
                    value: "",
                    label: "Target Tons",
                    isEditing: false
                },
                {
                    type: "number",
                    value: "",
                    label: "Minimum Tons",
                    isEditing: false
                }
            ]
        };

        // 2. Also create RPT Scale Table when setting up configuration
        const rptScaleTable: ReportItem["dynamic_tables"][0] = {
            id: Date.now() + 1,
            tableName: "RPT Scale Table",
            columns: ["RPT Key", "RPT Value"],
            data: [
                { id: 1, "RPT Key": "", "RPT Value": "" }
            ]
        };

        // Update states
        setDynamicInputs(prev => [...prev, basicConfigInput]);
        setDynamicTables(prev => [...prev, rptScaleTable]);
        setInputListCount(prev => prev + 1);

        setSuccessful(true);
        setMessage("RPT Configuration setup successfully! RPT Scale Table created.");
        setShow(true);
    };


    // Handle updates from InputList
    const handleUpdateInputList = (updatedData: DynamicInputItem) => {
        if (!updatedData.id) return;

        setDynamicInputs(prev =>
            prev.map(item =>
                item.id === updatedData.id ? { ...item, ...updatedData } : item
            )
        );
    };

    // Handle table saved
    const handleTableSaved = (savedTables: ReportItem["dynamic_tables"]) => {
        setDynamicTables(savedTables);
    };

    const handleDeleteTable = (tableId: number) => {

        // Remove the table from state
        setDynamicTables(prev => {
            const updated = prev.filter(table => {
                // For tables with string IDs (like "rpt-basic-123")
                if (typeof table.id === 'string' && table.id === tableId.toString()) {
                    return false;
                }
                // For tables with numeric IDs
                if (table.id === tableId) {
                    return false;
                }
                return true;
            });


            return updated;
        });
    };


    // Check if we have RPT configuration
    const hasRptConfig = dynamicInputs.some(item =>
        item.inputListName === "RPT Basic Configuration"
    );

    // Check if Date Index table exists
    const hasDateIndex = dynamicTables.some(table =>
        table.tableName === "Date Index"
    );

    // Check if RPT Scale table exists
    const hasRptScale = dynamicTables.some(table =>
        table.tableName === "RPT Scale Table"
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>RPT (Rand Per Ton) Configuration</CardTitle>
                            <CardDescription>
                                Configure monthly RPT reporting parameters
                            </CardDescription>
                        </div>

                        {!hasRptConfig && (
                            <Button
                                onClick={handleAddRptConfig}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Setup RPT Configuration
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    {hasRptConfig ? (
                        <Tabs defaultValue="basic-config" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic-config">Basic Configuration</TabsTrigger>
                                <TabsTrigger value="date-index">Date Index</TabsTrigger>
                                <TabsTrigger value="rpt-scale">RPT Scale</TabsTrigger>
                            </TabsList>

                            {/* Basic Configuration Tab */}
                            <TabsContent value="basic-config" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {dynamicInputs
                                        .filter(item => item.inputListName === "RPT Basic Configuration")
                                        .map((item, index) => (
                                            <div key={item.id} className="col-span-full">
                                                <InputList
                                                    id={item.id}
                                                    initialHeaderName={item.inputListName}
                                                    initialInputs={item.inputs}
                                                    setDynamicInputs={setDynamicInputs}
                                                    setInputListCount={setInputListCount}
                                                    inputListCount={inputListCount}
                                                    onUpdate={handleUpdateInputList}
                                                    title={"rpt"}
                                                />
                                            </div>
                                        ))}
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    <p>Set the month period, target tons, and minimum tons. Then go to Date Index tab to generate the table.</p>
                                </div>
                            </TabsContent>

                            {/* Date Index Tab */}
                            <TabsContent value="date-index" className="space-y-4 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Date Index Table</h3>
                                    <Button
                                        onClick={handleGenerateDateIndex}
                                        className="flex items-center gap-2"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        Regenerate Date Index
                                    </Button>
                                </div>

                                {hasDateIndex ? (
                                    <>
                                        {dynamicTables
                                            .filter(table => table.tableName === "Date Index")
                                            .map((table, index) => (
                                                <DynamicTable
                                                    key={table.id}
                                                    table={[table]}
                                                    setDynamictables={setDynamicTables}
                                                    setDbTableCount={setDbTableCount}
                                                    tableCount={dbTableCount}
                                                    onSave={handleTableSaved}
                                                    title={"rpt"}
                                                    onDelete={handleDeleteTable}
                                                />
                                            ))}

                                        <div className="text-sm text-muted-foreground">
                                            <p>This table auto-updates whenever the month start/end dates change in Basic Configuration. Use "Regenerate Date Index" to force a refresh, or update the values for each date directly below.</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 border rounded-lg">
                                        <div className="space-y-4">
                                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                                            <h3 className="text-lg font-medium">No Date Index Table</h3>
                                            <p className="text-muted-foreground">
                                                Set Month Start and End dates in Basic Configuration to auto-generate a Date Index table, or click "Regenerate Date Index" to build it now.
                                            </p>
                                            <div className="pt-4">
                                                <p className="text-sm font-medium mb-2">Requirements:</p>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    <li>• Month Start Date must be set in Basic Configuration</li>
                                                    <li>• Month End Date must be set in Basic Configuration</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* RPT Scale Tab */}
                            <TabsContent value="rpt-scale" className="space-y-4 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">RPT Scale Table</h3>
                                    {!hasRptScale && (
                                        <Button
                                            onClick={handleCreateRptScaleTable}
                                            className="flex items-center gap-2"
                                            variant="outline"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create RPT Scale Table
                                        </Button>
                                    )}
                                </div>

                                {hasRptScale ? (
                                    <>
                                        {dynamicTables
                                            .filter(table => table.tableName === "RPT Scale Table")
                                            .map((table, index) => (
                                                <DynamicTable
                                                    key={table.id}
                                                    table={[table]}
                                                    setDynamictables={setDynamicTables}
                                                    setDbTableCount={setDbTableCount}
                                                    tableCount={dbTableCount}
                                                    onSave={handleTableSaved}
                                                    title={"rpt"}
                                                    onDelete={handleDeleteTable}
                                                />
                                            ))}

                                        <div className="text-sm text-muted-foreground">
                                            <p>Configure the RPT scale with tons ranges and corresponding RPT values.</p>
                                            <p className="mt-2">
                                                <strong>Tip:</strong> Add multiple rows to create different RPT ranges (e.g., 0-1000 tons = R10, 1001-2000 tons = R12, etc.)
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 border rounded-lg">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">No RPT Scale Table</h3>
                                            <p className="text-muted-foreground">
                                                Click "Create RPT Scale Table" button to create a table for configuring RPT values.
                                            </p>
                                            <div className="pt-4">
                                                <p className="text-sm font-medium mb-2">What is RPT Scale?</p>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    <li>• Defines Rand Per Ton values for different production ranges</li>
                                                    <li>• Example: 0-1000 tons = R10 per ton</li>
                                                    <li>• Example: 1001-2000 tons = R12 per ton</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="text-center py-8 border rounded-lg">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">No RPT Configuration Found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Click "Setup RPT Configuration" to create the necessary components for RPT reporting.
                                </p>
                                <Button
                                    onClick={handleAddRptConfig}
                                    className="flex items-center gap-2 mx-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                    Setup RPT Configuration
                                </Button>
                            </div>
                        </div>
                    )}
                    {show && (
                        <ResponseModal
                            successful={successful}
                            message={message}
                            setShow={setShow}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}