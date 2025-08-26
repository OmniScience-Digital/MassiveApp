"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { client } from "@/service/schemaClient";
import { Loader2, PlayIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/navbar";
import DynamicTable from "@/components/widgets/tables/dynamictable";
import InputList from "@/components/widgets/InputList";
import InputData from "../../../../types/inputdata";
import { Button } from "@/components/ui/button";
import { ReportItem } from '@/types/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

import { runStockpileReport } from "@/app/api/stockpile.route";
import { Switch } from "@/components/ui/switch";
import Timewidget from "@/components/widgets/Date/sitetime";





export default function DashboardPage() {
    const params = useParams();
    const dashboardname = decodeURIComponent(params.name as string).toUpperCase();
    const id = decodeURIComponent(params.id as string);

    const [siteName, setSiteName] = useState("");
    const [sitedata, setSiteData] = useState<ReportItem | null | undefined>(null);
    const [loading, setLoading] = useState(false); // Loading state

    const [scales, setScales] = useState<ReportItem["scales"]>([]);
    const [headers, setHeaders] = useState<ReportItem["headers"]>([]);
    const [primaryScales, setPrimaryScales] = useState<string[]>([]);
    const [formulas, setFormulas] = useState<ReportItem["formulas"]>([]);

    const [dynamicinput, setDynamicInputs] = useState<ReportItem["dynamic_inputs"]>([]);
    const [dynamictables, setDynamictables] = useState<ReportItem["dynamic_tables"]>([]);
    const [loadinbtn, setLoadingBtn] = useState(false);


    const [tableCount, setTableCount] = useState(0);
    const [dbtableCount, setDbTableCount] = useState(0);
    const [inputListCount, setInputListCount] = useState(0);
    const [selectedValue, setSelectedValue] = useState('');
    const [showStockpile, setShowStockpile] = useState(false);
    const [stockpileNumber, setStockpileNumber] = useState("");


    //run report times 
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");


    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState('');

    const initialInputs: InputData[] = [];

    const initialTable: ReportItem["dynamic_tables"] = [
        {

            id: (dbtableCount + 1),
            tableName: 'Dynamic Table',
            columns: ["Column 1", "Column 2"],
            data: [
                { id: 1, "Column 1": "Value 1", "Column 2": "Value 2" },
                { id: 2, "Column 1": "Value 2", "Column 2": "Value 4" },
            ],
        },
    ];


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
            if (typeof site.site === 'string') {
                const parsedSite = JSON.parse(site.site);

                // Ensure the parsed site matches the ReportItem structure
                const formattedSite: ReportItem = {
                    id: site.id,
                    audit: parsedSite.audit,
                    siteStatus: parsedSite.siteStatus,
                    siteConstants: parsedSite.siteConstants,
                    siteTimes: parsedSite.siteTimes,
                    dynamic_inputs: parsedSite.dynamic_inputs || [],
                    dynamic_tables: parsedSite.dynamic_tables || [],
                    scales: parsedSite.scales || [],
                    headers: parsedSite.headers || [],
                    formulas: parsedSite.formulas || [],
                    primaryScales: parsedSite.primaryScales || []
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
            if (typeof site.site === 'string') {
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
            setMessage('Formula deleted successfully');
            setShow(true);


        } catch (error) {
            console.log('Error deleting formula ', error)
            setSuccessful(false);
            setMessage('Failed to delete formula');
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
                setDynamicInputs(siteData.dynamic_inputs);
                setDynamictables(siteData.dynamic_tables);
                setDbTableCount(siteData.dynamic_tables.length);
            }
        };

        fetchData();
    }, []);


    const handleStockpileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStockpileNumber(e.target.value);
    };
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
            setDynamicInputs(siteData.dynamic_inputs);
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
            setMessage("End time must be after start time");
            setShow(true);
            setSuccessful(false);
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

            if (new Date(startTime) > new Date(endTime)) {
                setMessage("End time must be after start time");
                setShow(true);
                setSuccessful(false);
                return;
            }

            const currentDateTime = new Date(getCurrentDateTime());
            if (new Date(startTime) > currentDateTime || new Date(endTime) > currentDateTime) {
                setMessage("Cannot select future dates/times");
                setShow(true);
                setSuccessful(false);
                return;
            }

            setLoadingBtn(true);
            console.log("Querying report from", startTime, "to", endTime);

            let stockpileData = await runStockpileReport(sitedata as ReportItem, { startTime: startTime as string, endTime: endTime as string },stockpileNumber as string);

            if (stockpileData) {
                setLoadingBtn(false);
                setMessage("Report generated  successfully");
                setShow(true);
                setSuccessful(true);
                setStockpileNumber("");
            }

        } catch (error) {
            setLoadingBtn(false);
            setMessage("Failed to generate report");
            setShow(true);
            setSuccessful(false);
            setStockpileNumber("");
            console.log(error);
        }


    };



    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Navbar />
            <h1 className="text-xl font-normal px-2">{dashboardname} DASHBOARD</h1>

            {loading ? (<Loading />) : (

                <main className="flex-1 mt-20">

                    {sitedata && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 p-2 bg-background text-foreground">


                                <div className="p-4 shadow-md shadow-gray-200 border rounded-md flex items-center justify-between bg-background text-foreground">
                                    <span className="bg-background text-foreground text-lg" >{siteName}</span>
                                    <Threewaytoggle onChange={handleToggleChange} runValue={selectedValue} />
                                </div>


                                <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm shadow-gray-200">
                                    <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                            <div className="space-y-2 w-full">
                                                <Label htmlFor="start-time">Start Time</Label>
                                                <Input
                                                    id="start-time"
                                                    type="datetime-local"
                                                    value={startTime}
                                                    onChange={handleStartTimeChange}
                                                    className="w-full"
                                                    min="1968-01-01T00:00"
                                                    max={getCurrentDateTime()}
                                                />
                                            </div>
                                            <div className="space-y-2 w-full">
                                                <Label htmlFor="end-time">End Time</Label>
                                                <Input
                                                    id="end-time"
                                                    type="datetime-local"
                                                    value={endTime}
                                                    onChange={handleEndTimeChange}
                                                    className="w-full"
                                                    min={startTime || undefined}
                                                    max={getCurrentDateTime()}
                                                />
                                            </div>

                                            {/* Toggleable Stockpile Number Input */}
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="stockpile-toggle"
                                                    checked={showStockpile}
                                                    onCheckedChange={setShowStockpile}
                                                />
                                                <Label htmlFor="stockpile-toggle">Add Stockpile Number (optional)</Label>
                                            </div>

                                            {showStockpile && (
                                                <div className="space-y-2 w-full">
                                                    <Label htmlFor="stockpile">Stockpile Number</Label>
                                                    <Input
                                                        id="stockpile"
                                                        type="text"
                                                        value={stockpileNumber}
                                                        onChange={handleStockpileChange}
                                                        className="w-full"
                                                        placeholder="Enter stockpile number"
                                                    />
                                                </div>
                                            )}
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



                            <div className="flex flex-col py-3 px-2">

                                <Tabs defaultValue="iot" className="w-[100%]">
                                    <TabsList>
                                        <TabsTrigger value="iot">IOT</TabsTrigger>
                                        <TabsTrigger value="iotnplc">IOT & PLC</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="iot">

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 p-2">
                                             <Timewidget siteTimes_input={sitedata.siteTimes} fetchData={fetchData} />
                                            <SiteConstants siteConstants={sitedata.siteConstants} fetchData={fetchData} />
                                            <DynamicinputList headers={headers} />

                                            <PrimaryScalesSelector scales={scales} primaryScales={primaryScales} onSave={handleSelectedScales} />


                                            <div className="md:col-span-2">

                                                <FormulaEditor
                                                    scales={scales}
                                                    formulas={formulas}
                                                    onSave={(formula) => {
                                                        // Update your formulas array

                                                        setFormulas(prev => {
                                                            const existingIndex = prev.findIndex(f => f.formulaname === formula.formulaname);
                                                            if (existingIndex >= 0) {
                                                                const updated = [...prev];
                                                                updated[existingIndex] = formula;


                                                                return updated;
                                                            }
                                                            return [...prev, formula];


                                                        });
                                                    }}
                                                    onDelete={({ formulaname }) => {
                                                        // Remove the formula
                                                        console.log("Deleting formula:", formulaname);
                                                        setFormulas(prev => prev.filter(f => f.formulaname !== formulaname));

                                                        handleDelete(formulaname);
                                                    }}
                                                />

                                            </div>


                                            {show && <ResponseModal successful={successful} message={message} setShow={setShow} />}

                                        </div>


                                        <SharedTable title={["Scale", "Iccid", "Mtd Opening"]} scales={scales} fetchData={fetchData} />



                                    </TabsContent>
                                    <TabsContent value="iotnplc">
                                        {/* Dropdown button */}
                                        <div className="px-2 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline">Add Component</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => setInputListCount((prev) => prev + 1)}>
                                                        Add Input List
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setTableCount((prev) => prev + 1)}>
                                                        Add Table
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>


                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 p-2">

                                            {/* this loads from the database   */}
                                            {dynamicinput.map((item, index) => (
                                                <InputList key={index} initialHeaderName={item.inputListName} initialInputs={item.inputs} setDynamicInputs={setDynamicInputs} setInputListCount={setInputListCount} inputListCount={inputListCount} />
                                            ))}

                                            {/* this creates them dynamically */}
                                            {Array.from({ length: inputListCount }).map((_, index) => (
                                                <InputList key={`input-${index}`} initialHeaderName="Custom Header" initialInputs={initialInputs} setDynamicInputs={setDynamicInputs} setInputListCount={setInputListCount} inputListCount={inputListCount} />

                                            ))}

                                        </div>

                                        {/* Render Tables */}


                                        <div className="grid grid-cols-1   lg:grid-cols-2 gap-2 p-2">
                                            {dynamictables.length > 0 && dynamictables.map((item, index) => (
                                                <DynamicTable
                                                    key={index}
                                                    table={[item]}
                                                    setDynamictables={setDynamictables}
                                                    setDbTableCount={setDbTableCount}
                                                    tableCount={dbtableCount}
                                                />
                                            ))}


                                            {Array.from({ length: tableCount }).map((_, index) => (
                                                <DynamicTable key={`table-${index}`} table={initialTable} setDynamictables={setDynamictables} setDbTableCount={setDbTableCount} tableCount={dbtableCount} />
                                            ))}
                                        </div>

                                    </TabsContent>
                                </Tabs>

                            </div>


                        </>)}

                </main>

            )}

            {sitedata && (
                <Footer />
            )}


        </div>
    );
}




