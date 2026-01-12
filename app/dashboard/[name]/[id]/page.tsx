"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { client } from "@/service/schemaClient";
import { Loader2, PlayIcon, Clock, Settings, Calculator, Table, Ruler, Scale } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import DynamicTable from "@/components/widgets/tables/dynamictable";
import InputList from "@/components/widgets/InputList";
import { Button } from "@/components/ui/button";
import { ReportItem } from "@/types/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Threewaytoggle from "@/components/widgets/threewaytoggle";
import Loading from "@/components/widgets/loading";
import SiteConstants from "@/components/widgets/siteconstants/siteConstants";
import DynamicinputList from "@/components/widgets/headers/dynamicinputList";
import SharedTable from "@/components/widgets/scales/Scales";
import Footer from "@/components/layout/footer";
import { FormulaEditor } from "@/components/widgets/tables/formulaEditor";
import { PrimaryScalesSelector } from "@/components/widgets/PrimaryScalesSelector";
import ResponseModal from "@/components/widgets/response";
import { deleteFormula } from "@/service/formulas.Service";
import Timewidget from "@/components/widgets/Date/sitetime";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import {
    runShiftReport,
    runtelegramReportwithDate,
} from "@/app/api/shiftreports.route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Rpt from "@/components/dashboard/rpt.component";
import { DynamicInputItem, InputData } from "@/types/dynamic-inputs";



export default function DashboardPage() {
    const params = useParams();
    const dashboardname = decodeURIComponent(params.name as string).toUpperCase();
    const id = decodeURIComponent(params.id as string);

    const [siteName, setSiteName] = useState("");
    const [sitedata, setSiteData] = useState<ReportItem | null | undefined>(null);
    const [loading, setLoading] = useState(false);
    const [shift, setShift] = useState<string>("");
    const [scales, setScales] = useState<ReportItem["scales"]>([]);
    const [headers, setHeaders] = useState<ReportItem["headers"]>([]);
    const [primaryScales, setPrimaryScales] = useState<string[]>([]);
    const [formulas, setFormulas] = useState<ReportItem["formulas"]>([]);
    const [dynamicInputs, setDynamicInputs] = useState<DynamicInputItem[]>([]);
    const [rptdynamicInputs, setrptDynamicInputs] = useState<DynamicInputItem[]>([]);
    const [dynamictables, setDynamictables] = useState<ReportItem["dynamic_tables"]>([]);
    const [rpt_dynamictables, setrptDynamictables] = useState<ReportItem["dynamic_tables"]>([]);
    const [tableCount, setTableCount] = useState(0);
    const [dbtableCount, setDbTableCount] = useState(0);
    const [inputListCount, setInputListCount] = useState(0);
    const [selectedValue, setSelectedValue] = useState("");
    const [runreport, setRunreport] = useState(false);
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loadinbtn, setLoadingBtn] = useState(false);
    const [selectedShift, setSelectedShift] = useState("");

    const initialInputs: InputData[] = [];

    const initialTable: ReportItem["dynamic_tables"] = [
        {
            id: dbtableCount + 1,
            tableName: "Dynamic Table",
            columns: ["scalename", "iccid"],
            data: [
                { id: 1, "Column 1": "Value 1", "Column 2": "Value 2" },
                { id: 2, "Column 1": "Value 2", "Column 2": "Value 4" },
            ],
        },
    ];


    const handleShiftChange = (value: string) => {
        if (value) {
            setShift(value);
        }
    };

    const getSiteByid = async () => {
        setLoading(true);
        // get a specific item
        try {
            const { data: site, errors } = await client.models.Sites.get({
                id: id,
            });

            if (errors) {
                console.error("Error fetching site:", errors);
                setLoading(false);
                return null; // Handle error properly
            }

            if (!site) {
                // Return null if site is null
                console.error("Site not found");
                setLoading(false);
                return null;
            }

            // Check if 'site' contains the correct structure and parse if necessary
            if (typeof site.site === "string") {
                const parsedSite = JSON.parse(site.site);

                // Ensure the parsed site matches the ReportItem structure
                const formattedSite: ReportItem = {
                    id: site.id,
                    audit: parsedSite.audit,
                    progressive: parsedSite.progressive,
                    hourly: parsedSite.hourly,
                    rpt: parsedSite.rpt,
                    siteStatus: parsedSite.siteStatus,
                    siteConstants: parsedSite.siteConstants,
                    siteTimes: parsedSite.siteTimes,
                    dynamic_inputs: parsedSite.dynamic_inputs || [],
                    dynamic_tables: parsedSite.dynamic_tables || [],
                    rpt_inputs: parsedSite.rpt_inputs || [],
                    rpt_tables: parsedSite.rpt_tables || [],
                    scales: parsedSite.scales || [],
                    headers: parsedSite.headers || [],
                    formulas: parsedSite.formulas || [],
                    primaryScales: parsedSite.primaryScales || [],
                };

                setLoading(false);
                return formattedSite; // Return the formatted site as ReportItem
            }

            return null; // Return null if site doesn't match expected structure
        } catch (error) {
            console.error("Unexpected error:", error);
            return null; // Ensure function returns a value in case of an error
        }
    };

    const updateSiteStatusById = async (id: string, newSiteStatus: string) => {
        try {
            // First, retrieve the current site details
            const { data: site, errors } = await client.models.Sites.get({ id });

            if (errors) {
                console.error("Error fetching site:", errors);
                setLoading(false);
                return null; // Handle error properly
            }

            if (!site) {
                console.error("Site not found");
                setLoading(false);
                return null;
            }

            // Check if 'site' contains the correct structure and parse if necessary
            let parsedSite;
            if (typeof site.site === "string") {
                parsedSite = JSON.parse(site.site);
            } else {
                parsedSite = site.site;
            }

            // Ensure the parsed site matches the ReportItem structure
            const updatedSite = {
                ...parsedSite, // Keep all existing fields
                siteStatus: newSiteStatus, // Update the siteStatus with the new value
            };

            // Now you need to update the site in the database with the new site status
            const updateResponse = await client.models.Sites.update({
                id, // ID of the site to update
                site: JSON.stringify(updatedSite), // Directly pass the updated site
            });

            // Check if the update was successful
            if (updateResponse.errors) {
                console.error("Error updating site:", updateResponse.errors);

                return null; // Handle error properly
            }

            return updatedSite; // Return the updated site
        } catch (error) {
            console.error("Unexpected error:", error);

            return null; // Ensure function returns a value in case of an error
        }
    };

    const handleDelete = async (formulaname: string) => {
        try {
            await deleteFormula(id as string, formulaname as string);
            setSuccessful(true);
            setMessage("Formula deleted successfully");
            setShow(true);
        } catch (error) {
            console.log("Error deleting formula ", error);
            setSuccessful(false);
            setMessage("Failed to delete formula");
            setShow(true);
        }
    };

    //get site by id
    useEffect(() => {
        const fetchData = async () => {
            const siteData = await getSiteByid();

            if (siteData) {
                setSiteData(siteData); // Set the correctly formatted site data
                setSiteName(siteData.siteConstants.siteName);
                setSelectedValue(siteData.siteStatus);
                setScales(siteData.scales);
                setHeaders(siteData.headers);
                setFormulas(siteData.formulas);
                setPrimaryScales(siteData.primaryScales);
                // Add ids to existing dynamic inputs
                const inputsWithIds: DynamicInputItem[] = siteData.dynamic_inputs.map((item, index) => ({
                    ...item,
                    id: (item as any).id || Date.now() + index
                }));
                const rptinputsWithIds: DynamicInputItem[] = siteData?.rpt_inputs?.map((item, index) => ({
                    ...item,
                    id: (item as any).id || Date.now() + index
                })) || [];
                setrptDynamicInputs(rptinputsWithIds);
                setDynamicInputs(inputsWithIds);
                setDynamictables(siteData.dynamic_tables);
                setrptDynamictables(siteData?.rpt_tables ?? []);
                setDbTableCount(siteData.dynamic_tables.length);
            }
        };

        fetchData();
    }, []);

    //upon updates
    const fetchData = async () => {
        const siteData = await getSiteByid();

        if (siteData) {
            setSiteData(siteData); // Set the correctly formatted site data
            setSiteName(siteData.siteConstants.siteName);
            setSelectedValue(siteData.siteStatus);
            setScales(siteData.scales);
            setHeaders(siteData.headers);
            setFormulas(siteData.formulas);
            setPrimaryScales(siteData.primaryScales);
            // Add ids to existing dynamic inputs
            const inputsWithIds: DynamicInputItem[] = siteData.dynamic_inputs.map((item, index) => ({
                ...item,
                id: (item as any).id || Date.now() + index
            }));
            setDynamicInputs(inputsWithIds);
            setDynamictables(siteData.dynamic_tables);
        }
    };

    const handleToggleChange = async (newValue: string) => {
        setSelectedValue(newValue);
        await updateSiteStatusById(id, newValue);
    };

    const handleSelectedScales = (selectedScales: string[]) => {
        console.log(`Selected scales: ${selectedScales.join(", ")}`);
    };

    const logSelectedShift = async (shift: string) => {
        try {
            if (!shift || shift.trim() === "") {
                setLoadingBtn(false);
                setMessage("Please select shift");
                setShow(true);
                setSuccessful(false);
                setLoadingBtn(false);
                setRunreport(false);
                return;
            }

            if (shift === "Day Shift") {
                shift = "day";
            } else if (shift === "Night Shift") {
                shift = "night";
            }

            const shiftData = await runShiftReport(
                sitedata as ReportItem,
                shift as string,
            );

            setLoadingBtn(false);
            setMessage("Data fetched successfully");
            setShow(true);
            setSuccessful(true);
        } catch (error) {
            setLoadingBtn(false);
            setMessage("Failed to fetch data");
            setShow(true);
            setSuccessful(false);
            console.log(error);
        } finally {
            setLoadingBtn(false);
            setRunreport(false);
        }
    };

    // Get current datetime in format compatible with datetime-local input
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = e.target.value;
        setStartTime(newStartTime);
        if (endTime && newStartTime > endTime) {
            setEndTime("");
        }
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndTime = e.target.value;
        if (!startTime || newEndTime > startTime) {
            setEndTime(newEndTime);
        } else {
            if (new Date(endTime) < new Date(startTime)) {
                setMessage("End time must be after start time");
                setShow(true);
                setSuccessful(false);
            } else {
                setEndTime(newEndTime);
            }
        }
    };

    const handleQueryReport = async () => {
        try {
            if (!startTime || !endTime) {
                setMessage("Please select both start and end times");
                setShow(true);
                setSuccessful(false);
                return;
            }

            if (!shift || shift === "") {
                setMessage("Please select  shift");
                setShow(true);
                setSuccessful(false);
                return;
            }

            const currentDateTime = new Date(getCurrentDateTime());
            if (
                new Date(startTime) > currentDateTime ||
                new Date(endTime) > currentDateTime
            ) {
                setMessage("Cannot select future dates/times");
                setShow(true);
                setSuccessful(false);
                return;
            }

            setLoadingBtn(true);
            console.log("Querying report from", startTime, "to", endTime);

            const shiftData = await runtelegramReportwithDate(
                sitedata as ReportItem,
                {
                    startTime: startTime as string,
                    endTime: endTime as string,
                    shift: shift as string,
                },
            );

            setLoadingBtn(false);
            setMessage("Data fetched  successfully");
            setShow(true);
            setSuccessful(true);
        } catch (error) {
            setLoadingBtn(false);
            setMessage("Failed to fetch data");
            setShow(true);
            setSuccessful(false);
            console.log(error);
        }
    };

    // Handle adding a new input list
    const handleAddInputList = () => {
        const newInputList: DynamicInputItem = {
            id: Date.now(), // unique ID
            inputListName: "Custom Header",
            inputs: initialInputs
        };
        setDynamicInputs([...dynamicInputs, newInputList]);
        setInputListCount(prev => prev + 1);
    };

    // Handle updates from child InputList

    const handleUpdateInputList = (updatedData: DynamicInputItem) => {

        if (!updatedData.id) return;

        setDynamicInputs(prev => {
            const updated = prev.map(item => {
                // Compare IDs as strings to avoid type issues
                if (item.id?.toString() === updatedData.id?.toString()) {
                    return {
                        ...item,
                        inputListName: updatedData.inputListName || item.inputListName,
                        inputs: updatedData.inputs || item.inputs
                    };
                }
                return item;
            });

            return updated;
        });
    };

    const handleDeleteTable = (tableId: number) => {

        if (tableId === dbtableCount + 1 || tableId <= dbtableCount) {
            // This is  an unsaved table
            // Remove from dynamictables state
            setDynamictables(prev => {

                const filtered = prev.filter(table => {

                    // If table has the same temporary ID or is the last unsaved one
                    if (table.id === tableId) {
                        return false; // Remove this table
                    }
                    return true;
                });

                return filtered;
            });

            // Decrement tableCount for unsaved tables
            setTableCount(prev => Math.max(0, prev - 1));
            return;
        }

        // For saved tables from database
        setDynamictables(prev => {
            const filtered = prev.filter(table => table.id !== tableId);
            console.log("Deleting saved table. Remaining:", filtered);
            return filtered;
        });
    };
    const handleTableSaved = (savedTables: ReportItem["dynamic_tables"]) => {
        // Update the dynamictables state with saved data from database
        setDynamictables(savedTables);
        // Reset tableCount to remove the temporary "new table" UI
        setTableCount(0);
        // Update the db table count
        setDbTableCount(savedTables.length);
    };



    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Navbar />



            {loading ? (
                <Loading />
            ) : (

                <main className="flex-1 overflow-auto">
                    {sitedata && (
                        <>
                            {/* Dashboard Header */}
                            <div className="px-4 py-2 border-b">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <h1 className="text-2xl font-bold">{dashboardname} DASHBOARD</h1>
                                        <p className="text-sm text-muted-foreground">Manage site configuration and reports</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold">{siteName}</span>
                                        <Threewaytoggle
                                            onChange={handleToggleChange}
                                            runValue={selectedValue}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Quick Actions Section - Always visible */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 p-2 bg-background text-foreground">
                                <div className="p-4 shadow-md border shadow-gray-200 rounded-md flex items-center justify-between bg-background text-foreground">
                                    <span className="bg-background text-foreground text-lg">
                                        {siteName}
                                    </span>
                                    <Threewaytoggle
                                        onChange={handleToggleChange}
                                        runValue={selectedValue}
                                    />
                                </div>

                                <div className="p-4 shadow-md border shadow-gray-200 rounded-md bg-background text-foreground items-center flex justify-between">
                                    {sitedata && (
                                        <div className="flex items-center space-x-4">
                                            {sitedata.siteTimes.dayStop !== "23:59" && (
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name="shift"
                                                        value="Day Shift"
                                                        checked={selectedShift === "Day Shift"}
                                                        onChange={() => setSelectedShift("Day Shift")}
                                                    />
                                                    <span>Day Shift</span>
                                                </label>
                                            )}

                                            {sitedata.siteTimes.nightStop !== "23:59" && (
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name="shift"
                                                        value="night"
                                                        checked={selectedShift === "Night Shift"}
                                                        onChange={() => setSelectedShift("Night Shift")}
                                                    />
                                                    <span>Night Shift</span>
                                                </label>
                                            )}

                                            {sitedata.siteTimes.extraShiftStop !== "23:59" && (
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name="shift"
                                                        value="Extra Shift"
                                                        checked={selectedShift === "Extra Shift"}
                                                        onChange={() => setSelectedShift("Extra Shift")}
                                                    />
                                                    <span>Extra Shift</span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => {
                                            logSelectedShift(selectedShift);
                                            setRunreport(true);
                                        }}
                                    >
                                        {runreport ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <PlayIcon />
                                        )}
                                        Run Report
                                    </Button>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm shadow-gray-200">
                                    <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                            <div className="space-y-2 w-full ">
                                                <Label htmlFor="start-time">Start Time</Label>
                                                <Input
                                                    id="start-time"
                                                    type="date"
                                                    value={startTime}
                                                    onChange={handleStartTimeChange}
                                                    className="w-full cursor-pointer"
                                                    min="1968-01-01T00:00"
                                                    max={getCurrentDateTime()}
                                                />
                                            </div>
                                            <div className="space-y-2 w-full">
                                                <Label htmlFor="end-time">End Time</Label>
                                                <Input
                                                    id="end-time"
                                                    type="date"
                                                    value={endTime}
                                                    onChange={handleEndTimeChange}
                                                    className="w-full cursor-pointer"
                                                    min={startTime || undefined}
                                                    max={getCurrentDateTime()}
                                                />
                                            </div>
                                            <div className="flex flex-col y-0 w-full md:w-auto">
                                                <RadioGroup
                                                    value={shift}
                                                    onValueChange={handleShiftChange}
                                                    className="flex gap-2"
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <RadioGroupItem value="day" id="day" />
                                                        <Label htmlFor="day">Day</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <RadioGroupItem value="night" id="night" />
                                                        <Label htmlFor="night">Night</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>

                                        {loadinbtn ? (
                                            <Button disabled className="font-normal">
                                                <Loader2 className="animate-spin" />
                                                Please wait
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleQueryReport}
                                                className="w-full md:w-auto h-10"
                                            >
                                                Query Report
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Main Configuration Tabs */}
                            <Tabs defaultValue="schedules" className="w-full p-4">
                                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                                    <TabsTrigger value="schedules" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span className="hidden sm:inline">Schedules</span>
                                    </TabsTrigger>

                                    <TabsTrigger value="configuration" className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        <span className="hidden sm:inline">Configuration</span>
                                    </TabsTrigger>

                                    <TabsTrigger value="formulas" className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4" />
                                        <span className="hidden sm:inline">Formulas</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="scales" className="flex items-center gap-2">
                                        <Scale className="h-4 w-4" />
                                        <span className="hidden sm:inline">Scales</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="rpt" className="flex items-center gap-2">
                                        <Ruler className="h-4 w-4" />
                                        <span className="hidden sm:inline">Rand Per Ton</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="custom" className="flex items-center gap-2">
                                        <Table className="h-4 w-4" />
                                        <span className="hidden sm:inline">Custom Data</span>
                                    </TabsTrigger>

                                </TabsList>

                                {/* Schedules Tab */}
                                <TabsContent value="schedules" className="space-y-4 mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Site Schedules</CardTitle>
                                            <CardDescription>Configure shift timings and operation hours</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Timewidget
                                                siteTimes_input={sitedata.siteTimes}
                                                fetchData={fetchData}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Configuration Tab */}
                                <TabsContent value="configuration" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Site Constants</CardTitle>
                                                <CardDescription>Basic site information</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <SiteConstants
                                                    siteConstants={sitedata.siteConstants}
                                                    fetchData={fetchData}
                                                />
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Site Headers</CardTitle>
                                                <CardDescription>Report headers and labels</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <DynamicinputList headers={headers} />
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Primary Scales</CardTitle>
                                                <CardDescription>Select main scales for reporting</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <PrimaryScalesSelector
                                                    scales={scales}
                                                    primaryScales={primaryScales}
                                                    onSave={handleSelectedScales}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>


                                {/* Formulas Tab */}
                                <TabsContent value="formulas" className="space-y-4 mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Formula Management</CardTitle>
                                            <CardDescription>Create and manage calculation formulas</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <FormulaEditor
                                                scales={scales}
                                                formulas={formulas}
                                                onSave={(formula) => {
                                                    setFormulas((prev) => {
                                                        const existingIndex = prev.findIndex(
                                                            (f) => f.formulaname === formula.formulaname,
                                                        );
                                                        if (existingIndex >= 0) {
                                                            const updated = [...prev];
                                                            updated[existingIndex] = formula;
                                                            return updated;
                                                        }
                                                        return [...prev, formula];
                                                    });
                                                }}
                                                onDelete={({ formulaname }) => {
                                                    setFormulas((prev) =>
                                                        prev.filter((f) => f.formulaname !== formulaname),
                                                    );
                                                    handleDelete(formulaname);
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Scales Tab */}
                                <TabsContent value="scales" className="space-y-4 mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Scale Management</CardTitle>
                                            <CardDescription>View and manage all scales</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <SharedTable
                                                title={["Scale", "Iccid", "Mtd Opening"]}
                                                scales={scales}
                                                fetchData={fetchData}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                {/* RPT */}
                                <TabsContent value="rpt" className="space-y-4 mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">RPT Config</CardTitle>
                                            <CardDescription>Rand Per Ton Configuration</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Rpt rptInputs={rptdynamicInputs} rpt_dynamictables={rpt_dynamictables} />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Custom Data Tab */}
                                <TabsContent value="custom">
                                    {/* Dropdown button */}
                                    <div className="px-2 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline">Add Component</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={handleAddInputList}
                                                >
                                                    Add Input List
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => setTableCount((prev) => prev + 1)}
                                                >
                                                    Add Table
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 p-2">
                                        {/* this loads from the database   */}
                                        {dynamicInputs.map((item, index) => (
                                            <InputList
                                                key={item.id || index}
                                                id={item.id}
                                                initialHeaderName={item.inputListName}
                                                initialInputs={item.inputs}
                                                setDynamicInputs={setDynamicInputs}
                                                setInputListCount={setInputListCount}
                                                inputListCount={inputListCount}
                                                onUpdate={handleUpdateInputList}
                                                title="custom"

                                            />
                                        ))}

                                    </div>


                                    {/* Render Tables */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
                                        {/* Render existing tables from database */}
                                        {dynamictables.map((item, index) => (
                                            <DynamicTable
                                                key={item.id || index}
                                                table={[item]}
                                                setDynamictables={setDynamictables}
                                                setDbTableCount={setDbTableCount}
                                                tableCount={dbtableCount}
                                                onSave={handleTableSaved}
                                                onDelete={handleDeleteTable}
                                                title="custom"
                                            />
                                        ))}

                                        {/* Render new tables being created */}
                                        {Array.from({ length: tableCount }).map((_, index) => (
                                            <DynamicTable
                                                key={`new-table-${Date.now()}-${index}`}
                                                table={initialTable}
                                                setDynamictables={setDynamictables}
                                                setDbTableCount={setDbTableCount}
                                                tableCount={dbtableCount}
                                                onSave={handleTableSaved}
                                                onDelete={handleDeleteTable}
                                                title="custom"
                                            />
                                        ))}
                                    </div>
                                </TabsContent>

                            </Tabs>
                        </>
                    )}
                </main>
            )}

            {show && (
                <ResponseModal
                    successful={successful}
                    message={message}
                    setShow={setShow}
                />
            )}

            {sitedata && <Footer />}
        </div>
    );
}