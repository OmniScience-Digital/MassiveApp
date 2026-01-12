"use client";

import { useState } from "react";
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

        while (currentDate <= end) {
            dateIndex.push({
                date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
                value: ""
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateIndex;
    };

    // Button to generate Date Index
    const handleGenerateDateIndex = () => {
        // Find RPT Basic Configuration
        const rptConfig = dynamicInputs.find(item =>
            item.inputListName === "RPT Basic Configuration"
        );

        if (!rptConfig) {
            setSuccessful(false);
            setMessage("Please setup RPT Basic Configuration first!");
            setShow(true);
            return;
        }

        // Get dates from configuration
        const monthStart = rptConfig.inputs.find(i => i.label === "Month Start Date and Time")?.value || "";
        const monthEnd = rptConfig.inputs.find(i => i.label === "Month End Date and Time")?.value || "";

        if (!monthStart || !monthEnd) {
            setSuccessful(false);
            setMessage("Please set both Month Start and End dates in Basic Configuration!");
            setShow(true);
            return;
        }

        const dateIndex = generateDateIndex(monthStart, monthEnd);

        // Create Date Index table
        const dateIndexTable: ReportItem["dynamic_tables"][0] = {
            id: Date.now(),
            tableName: "Date Index",
            columns: ["Date", "Date Index", "Tons Achieved"],
            data: dateIndex.map((item, index) => ({
                id: index + 1,
                "Date": item.date,
                "Date Index": "1",  // All rows get "1" initially
                "Tons Achieved": ""
            }))
        };

        // Check if Date Index table already exists
        const existingTableIndex = dynamicTables.findIndex(
            table => table.tableName === "Date Index"
        );

        if (existingTableIndex !== -1) {
            // Replace existing table
            const updatedTables = [...dynamicTables];
            updatedTables[existingTableIndex] = dateIndexTable;
            setDynamicTables(updatedTables);
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
                                        Generate Date Index
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
                                                />
                                            ))}

                                        <div className="text-sm text-muted-foreground">
                                            <p>This table is generated based on the month start and end dates from Basic Configuration. You can update the values for each date.</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 border rounded-lg">
                                        <div className="space-y-4">
                                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                                            <h3 className="text-lg font-medium">No Date Index Table</h3>
                                            <p className="text-muted-foreground">
                                                Click "Generate Date Index" button to create a Date Index table based on your month dates.
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