"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { client } from "@/service/schemaClient";
import { ReportItem, RuntimesAudit } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import RuntimeTable from "@/components/widgets/tables/runtimeTable";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { normalize } from "@/utils/runtimeUtils";

const AuditingDashboard = () => {
    const params = useParams();
    const router = useRouter();
    const id = decodeURIComponent(params.id as string);
    const dashboardname = decodeURIComponent(params.name as string).toUpperCase();

    const [siteName, setSiteName] = useState(dashboardname);
    const [siteData, setSiteData] = useState<RuntimesAudit[] | null>(null);
    const [allSites, setAllSites] = useState<{ id: string; name: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    //store input values
    const [currentIccidIndex, setCurrentIccidIndex] = useState(0);
    const [currentIccid, setCurrentIccid] = useState('');

    const [hasCalculated, setHasCalculated] = useState(false);
    const [hours, setHours] = useState([""]);
    const [allIccids, setAllIccids] = useState([""]);
    const [inputValues, setInputValues] = useState<Record<string, Record<string, string>>>({});
    const [calculatedValues, setCalculatedValues] = useState<Record<string, Record<string, number>>>({});
    const [allCalculatedValues, setAllCalculatedValues] = useState<Record<string, Record<string, Record<string, number>>>>({});
    const [allInputValues, setAllInputValues] = useState<Record<string, Record<string, Record<string, string>>>>({});

    //save start and end date
    const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

    // Reset ICCID-related states when site changes
    useEffect(() => {
        setCurrentIccidIndex(0);
        setCurrentIccid('');
        setAllIccids(['']);
        setInputValues({});
        setCalculatedValues({});
        setAllCalculatedValues({});
        setAllInputValues({});
        setHasCalculated(false);
    }, [id]);

    // Fetch all audit sites for navigation
    useEffect(() => {
        const fetchAuditSites = async () => {
            setLoading(true);
            try {
                const { data: allSites } = await client.models.Sites.list();

                const auditSites = allSites
                    .map((site) => {
                        const siteData =
                            typeof site.site === "string"
                                ? JSON.parse(site.site)
                                : site.site || {};
                        return {
                            id: site.id,
                            name: siteData.siteConstants?.siteName || "Unnamed Site",
                            audit: siteData.audit || false,
                        };
                    })
                    .filter((site) => site.audit === true)
                    .sort((a, b) => a.name.localeCompare(b.name));

                setAllSites(auditSites);

                const index = auditSites.findIndex((site) => site.id === id);
                setCurrentIndex(index >= 0 ? index : 0);
            } catch (error) {
                console.error("Error fetching sites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditSites();
    }, [id]);

    useEffect(() => {
        if (siteData && siteData.length > 0) {
            setMessage("Data fetched successfully");
            setShow(true);
            setSuccessful(true);
        }
    }, [siteData]);

    const navigateToSite = (siteId: string, siteName: string) => {
        setLoading(true);
        router.push(
            `/auditinDashboard/${encodeURIComponent(siteName)}/${encodeURIComponent(siteId)}`,
        );
    };

    const goToPreviousSite = () => {
        if (currentIndex > 0) {
            const prevSite = allSites[currentIndex - 1];
            navigateToSite(prevSite.id, prevSite.name);
        }
    };

    const goToNextSite = () => {
        if (currentIndex < allSites.length - 1) {
            const nextSite = allSites[currentIndex + 1];
            navigateToSite(nextSite.id, nextSite.name);
        }
    };

    const handleSiteSelect = (value: string) => {
        const selectedSite = allSites.find((site) => site.id === value);
        if (selectedSite) {
            navigateToSite(selectedSite.id, selectedSite.name);
        }
    };

    const getPreviousDate = () => {
        const now = new Date();
        now.setDate(now.getDate() - 1);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const getCurrentDateAtSix = () => {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedTime = e.target.value;
        const sixAM = getCurrentDateAtSix();

        if (selectedTime > sixAM) {
            setEndTime(sixAM);
        } else {
            setEndTime(selectedTime);
        }
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = e.target.value;
        setStartTime(newStartTime);
        setShow(false);

        if (endTime && newStartTime > endTime) {
            setEndTime("");
        }
    };

    const getSiteTelegramDataByid = async () => {
        try {
            const { data: site, errors } = await client.models.Sites.get({
                id: id,
            });

            if (errors) {
                console.error("Error fetching site:", errors);
                setMessage(`Error fetching site from telegram table: ${errors}`);
                setShow(true);
                setSuccessful(false);
                return null;
            }

            if (!site) {
                console.error("Site not found");
                setMessage(`Site not found: ${errors}`);
                setShow(true);
                setSuccessful(false);
                return null;
            }

            if (typeof site.site === "string") {
                const parsedSite = JSON.parse(site.site);
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
                    primaryScales: parsedSite.primaryScales || [],
                };
                return formattedSite;
            }

            return null;
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    };

    const getSiteByid = async (
        startTime: string,
        endTime: string,
    ): Promise<RuntimesAudit[] | null> => {
        try {
            const startDate = startTime.split("T")[0];
            const endDate = endTime.split("T")[0];

            setDateRange({
                startDate: startTime.split("T")[0],
                endDate: endTime.split("T")[0],
            });

            const { data: sites, errors } =
                await client.models.AuditorReports.listAuditorReportsBySiteIdAndDate({
                    siteId: id,
                    date: {
                        between: [startDate, endDate],
                    },
                });

            if (errors) {
                console.error("Error fetching site:", errors);
                setMessage(`Error fetching site: ${errors}`);
                setShow(true);
                setSuccessful(false);
                return null;
            }

            if (!sites || sites.length < 1) {
                setMessage("Site not found");
                setShow(true);
                setSuccessful(false);
                return null;
            }

            const reportData = await getSiteTelegramDataByid();
            return sites.map((site) => {
                let parsedScales: any[] = [];
                try {
                    if (typeof site.scales === "string") {
                        const clean = site.scales
                            .replace(/\\"/g, '"')
                            .replace(/^"+|"+$/g, "");

                        parsedScales = JSON.parse(clean);
                    } else if (Array.isArray(site.scales)) {
                        parsedScales = site.scales;
                    }
                } catch {
                    parsedScales = [];
                }

                if (reportData) {
                    if (
                        (reportData.siteConstants.siteType === "Iot Based" ||
                            reportData.siteConstants.siteType
                                .toLowerCase()
                                .replace(/\s+/g, "") === "iot") &&
                        Array.isArray(parsedScales)
                    ) {
                        const scaleNameMap = Object.fromEntries(
                            reportData.scales.map(({ iccid, scalename }) => [
                                iccid,
                                scalename,
                            ]),
                        );
                        parsedScales = parsedScales.map((scale) => {
                            const scalename = scaleNameMap[scale.iccid];
                            return scalename
                                ? { ...scale, iccid: `${scalename}-${scale.iccid}` }
                                : scale;
                        });
                    } else if (
                        (reportData.siteConstants.siteType
                            .toLowerCase()
                            .replace(/\s+/g, "") === "plcbased" ||
                            reportData.siteConstants.siteType
                                .toLowerCase()
                                .replace(/\s+/g, "") === "plc") &&
                        Array.isArray(parsedScales)
                    ) {
                        const plcFlowTable = reportData?.dynamic_tables?.find(
                            (table) =>
                                table.tableName.toLowerCase().replace(/\s+/g, "") === "plcflow",
                        );
                        if (plcFlowTable) {
                            const scaleNameMap = Object.fromEntries(
                                plcFlowTable.data.map((item) => [
                                    item.iccid.trim(),
                                    item.scalename,
                                ]),
                            );
                            parsedScales = parsedScales.map((scale) => {
                                const trimmedIccid = scale.iccid.trim();
                                const scalename = scaleNameMap[trimmedIccid];
                                return scalename
                                    ? { ...scale, iccid: `${scalename}-${trimmedIccid}` }
                                    : scale;
                            });
                        }
                    } else if (
                        reportData.siteConstants.siteType
                            .toLowerCase()
                            .replace(/\s+/g, "") === "iotnplc" &&
                        Array.isArray(parsedScales)
                    ) {
                        const scaleNameMap = Object.fromEntries(
                            reportData.scales.map(({ iccid, scalename }) => [
                                iccid,
                                scalename,
                            ]),
                        );
                        parsedScales = parsedScales.map((scale) => {
                            const scalename = scaleNameMap[scale.iccid];
                            return scalename
                                ? { ...scale, iccid: `${scalename}-${scale.iccid}` }
                                : scale;
                        });

                        const plcFlowTable = reportData?.dynamic_tables?.find((table) =>
                            table.tableName
                                .toLowerCase()
                                .replace(/\s+/g, "")
                                .includes("flow"),
                        );

                        if (plcFlowTable) {
                            const scaleNameMap = Object.fromEntries(
                                plcFlowTable.data.map((item) => [
                                    item.iccid.trim(),
                                    item.scalename,
                                ]),
                            );
                            parsedScales = parsedScales.map((scale) => {
                                const trimmedIccid = scale.iccid.trim();
                                const scalename = scaleNameMap[trimmedIccid];
                                return scalename
                                    ? { ...scale, iccid: `${scalename}_${trimmedIccid}` }
                                    : scale;
                            });
                        }
                    }
                }

                return {
                    id: site.siteId ?? "",
                    date: site.date,
                    scales: parsedScales,
                };
            });
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    };

    // Fetch site input table values
    const getSiteTableValues = async (startTime: string, endTime: string) => {
        try {
            const startDate = startTime.split("T")[0];
            const endDate = endTime.split("T")[0];

            const { data: inputvalues, errors } = await client.models.InputTable.listInputTableBySiteIdAndRowdate({
                siteId: id,
                rowdate: {
                    between: [startDate, endDate],
                }
            });

         
            if (errors) {
                console.error("Error fetching input values:", errors);
                return [];
            }

            return inputvalues.map((inputvalue) => {
                // Safe parsing function
                const parseInputValues = (input: any): Record<string, string> => {
                    try {
                        let data: any;

                        if (typeof input === "string") {
                            data = JSON.parse(input);
                        } else {
                            data = input;
                        }

                        if (!data || typeof data !== "object" || Array.isArray(data)) {
                            return {};
                        }

                        const result: Record<string, string> = {};
                        for (const [key, value] of Object.entries(data)) {
                            result[key] = value !== null && value !== undefined ? String(value) : "";
                        }

                        return result;
                    } catch (error) {
                        console.error("Error parsing inputValues:", error);
                        return {};
                    }
                };

                return {
                    id: inputvalue.id,
                    siteId: inputvalue.siteId,
                    iccid: inputvalue.iccid,
                    rowdate: inputvalue.rowdate,
                    inputValues: parseInputValues(inputvalue.inputValues)
                };
            });
        } catch (error) {
            console.error("Error in getSiteTableValues:", error);
            return [];
        }
    };

    // Fetch purple figures values
    const getPurpleTableValues = async (startTime: string, endTime: string) => {
        try {
            const startDate = startTime.split("T")[0];
            const endDate = endTime.split("T")[0];

            const { data: purplevalues, errors } =
                await client.models.Purplefigures.listPurplefiguresBySiteIdAndDate({
                    siteId: id,
                    date: { between: [startDate, endDate] },
                });

            if (errors) {
                console.error("Error fetching purple figures:", errors);
                return {};
            }

            const processedData: Record<
                string,
                Record<string, Record<string, number>>
            > = {};

            purplevalues.forEach((entry: any) => {
                const iccid = entry.iccid;
                const date = entry.date;

                if (!processedData[iccid]) {
                    processedData[iccid] = {};
                }

                if (!processedData[iccid][date]) {
                    processedData[iccid][date] = {};
                }

                // Parse the purpleValues JSON string first
                let parsedPurpleValues: Record<string, any> = {};

                try {
                    if (typeof entry.purpleValues === "string") {
                        parsedPurpleValues = JSON.parse(entry.purpleValues);
                    } else if (typeof entry.purpleValues === "object") {
                        parsedPurpleValues = entry.purpleValues;
                    }
                } catch (parseError) {
                    console.error(
                        "Error parsing purpleValues JSON:",
                        parseError,
                        "for entry:",
                        entry,
                    );
                    parsedPurpleValues = {};
                }

                // Process the parsed purpleValues
                Object.entries(parsedPurpleValues).forEach(([hour, value]) => {
                    let numericValue: number;

                    if (typeof value === "string") {
                        numericValue = parseFloat(value) || 0;
                    } else if (typeof value === "number") {
                        numericValue = value;
                    } else {
                        numericValue = 0;
                    }

                    processedData[iccid][date][hour] = numericValue;
                });
            });

            return processedData;
        } catch (error) {
            console.error("Error in getPurpleTableValues:", error);
            return {};
        }
    };

    // Fetch input values and purple values
    const fetchInputValues = useCallback(async (startTime: string, endTime: string) => {
        try {
            const [iccidInputValues, iccidPurpleValues] = await Promise.all([
                getSiteTableValues(startTime, endTime),
                getPurpleTableValues(startTime, endTime),
            ]);

            const loadedInputValues: Record<string, Record<string, Record<string, string>>> = {};
            const loadedPurpleValues: Record<string, Record<string, Record<string, number>>> = iccidPurpleValues;

            // Process input values correctly
            iccidInputValues.forEach((entry: any) => {
                const iccid = entry.iccid;
                const date = entry.rowdate; // Use rowdate instead of looking for date in nested structure

                if (!loadedInputValues[iccid]) {
                    loadedInputValues[iccid] = {};
                }

                if (!loadedInputValues[iccid][date]) {
                    loadedInputValues[iccid][date] = {};
                }

                // Directly use the parsed inputValues
                if (entry.inputValues && typeof entry.inputValues === "object") {
                    Object.entries(entry.inputValues).forEach(([hour, value]) => {
                        loadedInputValues[iccid][date][hour] = value as string;
                    });
                }
            });

            //update states
            setAllInputValues((prev) => ({
                ...prev,
                ...loadedInputValues,
            }));
            setAllCalculatedValues((prev) => ({
                ...prev,
                ...loadedPurpleValues,
            }));


            // Update current ICCID values
            const normalizedCurrent = normalize(currentIccid);
            const matchedInputKey = Object.keys(loadedInputValues).find(
                (key) => normalize(key) === normalizedCurrent
            );
            const matchedPurpleKey = Object.keys(loadedPurpleValues).find(
                (key) => normalize(key) === normalizedCurrent,
            );

            if (matchedInputKey) {
                setInputValues(loadedInputValues[matchedInputKey] || {});
            } else {
                setInputValues({});
            }
            if (matchedPurpleKey) {
                setCalculatedValues(loadedPurpleValues[matchedPurpleKey] || {});
            } else {
                setCalculatedValues({});
            }
            // Enable save button if purple values exist
            if (Object.keys(loadedPurpleValues).length > 0) {
                setHasCalculated(true);
            }

        } catch (error) {
            console.error("Error in fetchInputValues:", error);
            setMessage(`Failed to fetch values: ${error}`);
            setShow(true);
            setSuccessful(false);
        }
    }, [id, currentIccid]);

    // Update inputValues and calculatedValues when currentIccid changes
    useEffect(() => {
        const normalizedCurrent = normalize(currentIccid);
        const matchedInputKey = Object.keys(allInputValues).find(
            (key) => normalize(key) === normalizedCurrent,
        );
        const matchedPurpleKey = Object.keys(allCalculatedValues).find(
            (key) => normalize(key) === normalizedCurrent,
        );

        if (matchedInputKey) {
            setInputValues(allInputValues[matchedInputKey]);
        } else {
            setInputValues({});
        }

        if (matchedPurpleKey) {
            setCalculatedValues(allCalculatedValues[matchedPurpleKey]);
        } else {
            setCalculatedValues({});
        }
    }, [currentIccid, allInputValues, allCalculatedValues]);

    // Auto-show calculated values when purple values are loaded
    useEffect(() => {
        if (Object.keys(allCalculatedValues).length > 0 && !hasCalculated) {
            setHasCalculated(true);
        }
    }, [allCalculatedValues, hasCalculated]);


    const fetchData = async (startTime: string, endTime: string) => {
        try {
            const siteData = await getSiteByid(startTime, endTime);
            await fetchInputValues(startTime, endTime);

            if (!siteData) {
                setSiteData(null);
                return null; 
            }

            const validSites = siteData.filter(
                (site) => site.date !== null,
            ) as Site[];

            const filteredSiteData = mergeSitesByDate(validSites);

            const allIccids = Array.from(
                new Set(
                    filteredSiteData.flatMap((day) => day.scales.map((scale) => scale.iccid)),
                ),
            );
            setAllIccids(allIccids);
            
            // Update currentIccid only if it's not already set or if it's the first load
            if (currentIccidIndex === 0 || !currentIccid) {
                const recentIccid = allIccids[0] || '';
                setCurrentIccid(recentIccid);
            }
            
            const hours = Array.from({ length: 24 }, (_, i) =>
                i.toString().padStart(2, "0"),
            );
            setHours(hours);

            setSiteData(filteredSiteData);
            return filteredSiteData;
        } catch (error) {
            console.error("Failed to fetch site data:", error);
            return null;
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

            setLoadingBtn(true);
            // Wait for fetchData to finish and GET THE DATA IT RETURNS
            const fetchedData = await fetchData(startTime, endTime);

            // Check the data we just got back (fetchedData), NOT the state (siteData)
            if (!fetchedData || fetchedData.length < 1) {
                setMessage("No data found for the selected timestamp");
                setShow(true);
                setSuccessful(false);
            } else {
                setMessage("Data fetched successfully");
                setShow(true);
                setSuccessful(true);
            }
        } catch (error) {
            setMessage("Failed to fetch data");
            setShow(true);
            setSuccessful(false);
            console.log(error);
        } finally {
            setLoadingBtn(false);
        }
    };

    // Update currentIccid when currentIccidIndex changes
    useEffect(() => {
        if (allIccids.length > 0 && currentIccidIndex >= 0 && currentIccidIndex < allIccids.length) {
            setCurrentIccid(allIccids[currentIccidIndex]);
        }
    }, [currentIccidIndex, allIccids]);

    return (
        <div className="min-h-screen flex flex-col relative">
            <Navbar />
            <main
                className={`flex-1 p-1 h-f mt-20 transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : ""}`}
            >
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}

                <div className="flex justify-between items-center px-4 mt-6">
                    <h1 className="text-xl font-semibold bg-background text-foreground tracking-wide">
                        {siteName} Auditing Dashboard
                    </h1>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToPreviousSite}
                            disabled={currentIndex === 0 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">
                                {currentIndex + 1} of {allSites.length}
                            </span>
                            <Select
                                value={id}
                                onValueChange={handleSiteSelect}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select site" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                    {allSites.map((site) => (
                                        <SelectItem key={site.id} value={site.id}>
                                            {site.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToNextSite}
                            disabled={currentIndex === allSites.length - 1 || loading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4 space-y-4 max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm">
                        <h2 className="text-lg font-medium mb-4">Report Time Range</h2>

                        {show && (
                            <div
                                className={`p-4 rounded-md ${successful
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    }`}
                            >
                                {message}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <div className="space-y-2 w-full">
                                    <Label htmlFor="start-time">Start Time</Label>
                                    <Input
                                        id="start-time"
                                        type="datetime-local"
                                        value={startTime || ""}
                                        onChange={handleStartTimeChange}
                                        className="w-full bg-background"
                                        min="1968-01-01T00:00"
                                        max={getPreviousDate()}
                                        step="3600"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2 w-full">
                                    <Label htmlFor="end-time">End Time</Label>
                                    <Input
                                        id="end-time"
                                        type="datetime-local"
                                        value={endTime || ""}
                                        onChange={handleEndTimeChange}
                                        className="w-full bg-background"
                                        min={startTime || undefined}
                                        max={getCurrentDateAtSix()}
                                        step="3600"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            {loadingBtn ? (
                                <Button disabled className="font-normal">
                                    <Loader2 className="animate-spin" />
                                    Please wait
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleQueryReport}
                                    className="w-full md:w-auto h-10"
                                    disabled={loading}
                                >
                                    Query Report
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {siteData && (
                    <RuntimeTable
                        iccidRuntimes={siteData}
                        daterange={dateRange}
                        currentIccidIndex={currentIccidIndex}
                        hasCalculated={hasCalculated}
                        hours={hours}
                        allIccids={allIccids}
                        currentIccid={currentIccid}
                        inputValues={inputValues}
                        allInputValues={allInputValues}
                        calculatedValues={calculatedValues}
                        allCalculatedValues={allCalculatedValues}
                        setAllCalculatedValues={setAllCalculatedValues}
                        setCalculatedValues={setCalculatedValues}
                        setAllInputValues={setAllInputValues}
                        setInputValues={setInputValues}
                        setHasCalculated={setHasCalculated}
                        setCurrentIccidIndex={setCurrentIccidIndex}
                    />

                )}
            </main>
            <Footer />
        </div>
    );
};

type Runtime = { hour: string; totalDeltaSum: number | string };
type Scale = { iccid: string; runtime: Runtime[] };
type Site = { id: string; date: string; scales: Scale[] };

function mergeSitesByDate(sites: Site[]): Site[] {
    const mergedMap = new Map<string, Site>();

    for (const site of sites) {
        if (!mergedMap.has(site.date)) {
            // Add a copy of the site to map
            mergedMap.set(site.date, {
                ...site,
                scales: site.scales.map((scale) => ({
                    ...scale,
                    runtime: [...scale.runtime],
                })),
            });
            continue;
        }

        // Merge into existing site
        const existingSite = mergedMap.get(site.date)!;

        // For each scale in current site
        for (const scale of site.scales) {
            // Check if scale with same iccid exists
            const existingScale = existingSite.scales.find(
                (s) => s.iccid === scale.iccid,
            );

            if (existingScale) {
                // Merge runtime arrays by hour, preferring earlier totalDeltaSum (keep existing)
                const runtimeMap = new Map(
                    existingScale.runtime.map((r) => [r.hour, r.totalDeltaSum]),
                );

                for (const r of scale.runtime) {
                    if (!runtimeMap.has(r.hour)) {
                        runtimeMap.set(r.hour, r.totalDeltaSum);
                    }
                }

                // Update existingScale.runtime with merged and sorted runtimes
                existingScale.runtime = Array.from(runtimeMap.entries())
                    .map(([hour, totalDeltaSum]) => ({ hour, totalDeltaSum }))
                    .sort((a, b) => a.hour.localeCompare(b.hour));
            } else {
                // Add scale if not exists
                existingSite.scales.push({
                    ...scale,
                    runtime: [...scale.runtime],
                });
            }
        }
    }

    // Return merged sites sorted by date ascending
    return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
}

export default AuditingDashboard;