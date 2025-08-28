"use client";

import { useState, useEffect } from "react";
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
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';

const AuditingDashboard = () => {
    const params = useParams();
    const router = useRouter();
    const id = decodeURIComponent(params.id as string);
    const dashboardname = decodeURIComponent(params.name as string).toUpperCase();

    const [siteName, setSiteName] = useState(dashboardname);
    const [siteData, setSiteData] = useState<RuntimesAudit[] | null>(null);
    const [allSites, setAllSites] = useState<{id: string, name: string}[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState('');
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Fetch all audit sites for navigation
    useEffect(() => {
        const fetchAuditSites = async () => {
            setLoading(true);
            try {
                const { data: allSites } = await client.models.Sites.list();
                
                const auditSites = allSites
                    .map(site => {
                        const siteData = typeof site.site === 'string' 
                            ? JSON.parse(site.site) 
                            : site.site || {};
                        return {
                            id: site.id,
                            name: siteData.siteConstants?.siteName || 'Unnamed Site',
                            audit: siteData.audit || false
                        };
                    })
                    .filter(site => site.audit === true)
                    .sort((a, b) => a.name.localeCompare(b.name));

                setAllSites(auditSites);
                
                const index = auditSites.findIndex(site => site.id === id);
                setCurrentIndex(index >= 0 ? index : 0);
            } catch (error) {
                console.error("Error fetching sites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditSites();
    }, [id]);

    const navigateToSite = (siteId: string, siteName: string) => {
        setLoading(true);
        router.push(`/auditinDashboard/${encodeURIComponent(siteName)}/${encodeURIComponent(siteId)}`);
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
        const selectedSite = allSites.find(site => site.id === value);
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
        const pad = (n: number) => n.toString().padStart(2, '0');
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

            if (typeof site.site === 'string') {
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
                    primaryScales: parsedSite.primaryScales || []
                };
                return formattedSite;
            }

            return null;
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    };

    const getSiteByid = async (startTime: string, endTime: string): Promise<RuntimesAudit[] | null> => {
        try {
            const startDate = startTime.split("T")[0];
            const endDate = endTime.split("T")[0];

            const { data: sites, errors } = await client.models.AuditorReports.listAuditorReportsBySiteIdAndDate({
                siteId: id,
                date: {
                    between: [startDate, endDate]
                }
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
                    if (typeof site.scales === 'string') {
                        const clean = site.scales.replace(/\\"/g, '"').replace(/^"+|"+$/g, '');
                        
                        parsedScales = JSON.parse(clean);
                    } else if (Array.isArray(site.scales)) {
                        parsedScales = site.scales;
                    }
                } catch {
                    parsedScales = [];
                }


                if (reportData) {

                    if ((reportData.siteConstants.siteType === 'Iot Based'||reportData.siteConstants.siteType.toLowerCase().replace(/\s+/g, '') === 'iot') && Array.isArray(parsedScales)) {
                        const scaleNameMap = Object.fromEntries(
                            reportData.scales.map(({ iccid, scalename }) => [iccid, scalename])
                        );
                        parsedScales = parsedScales.map((scale) => {
                            const scalename = scaleNameMap[scale.iccid];
                            return scalename
                                ? { ...scale, iccid: `${scalename}-${scale.iccid}` }
                                : scale;
                        });

                    }
                    else if ((reportData.siteConstants.siteType.toLowerCase().replace(/\s+/g, '') === 'plcbased' || 
                             reportData.siteConstants.siteType.toLowerCase().replace(/\s+/g, '') === 'plc') && 
                             Array.isArray(parsedScales)) {
                        const plcFlowTable = reportData?.dynamic_tables?.find(
                            table => table.tableName.toLowerCase().replace(/\s+/g, '') === 'plcflow'
                        );
                        if (plcFlowTable) {
                            const scaleNameMap = Object.fromEntries(
                                plcFlowTable.data.map(item => [item.iccid.trim(), item.scalename])
                            );
                            parsedScales = parsedScales.map((scale) => {
                                const trimmedIccid = scale.iccid.trim();
                                const scalename = scaleNameMap[trimmedIccid];
                                return scalename
                                    ? { ...scale, iccid: `${scalename}-${trimmedIccid}` }
                                    : scale;
                            });
                        }
                    }
                    else if ((reportData.siteConstants.siteType.toLowerCase().replace(/\s+/g, '') === 'iotnplc') && 
                            Array.isArray(parsedScales)) {
                                
                        const scaleNameMap = Object.fromEntries(
                            reportData.scales.map(({ iccid, scalename }) => [iccid, scalename])
                        );
                        parsedScales = parsedScales.map((scale) => {
                            const scalename = scaleNameMap[scale.iccid];
                            return scalename
                                ? { ...scale, iccid: `${scalename}-${scale.iccid}` }
                                : scale;
                        });
                     
                        const plcFlowTable = reportData?.dynamic_tables?.find(table =>table.tableName.toLowerCase().replace(/\s+/g, '').includes('flow'));

                        if (plcFlowTable) {
                            const scaleNameMap = Object.fromEntries(
                                plcFlowTable.data.map(item => [item.iccid.trim(), item.scalename])
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

    const fetchData = async (startTime: string, endTime: string) => {
        try {
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);

            const siteData = await getSiteByid(startTime, endTime);
            
            if (!siteData) {
                setSiteData(null);
                return null;
            }

           const validSites = siteData.filter(site => site.date !== null) as Site[];
           const filteredSiteData = mergeSitesByDate(validSites);

    
            setSiteData(filteredSiteData);
            return filteredSiteData;
        } catch (error) {
            console.error("Failed to fetch site data:", error);
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
            await fetchData(startTime, endTime);

            if (!siteData || siteData.length < 1) {
                setMessage("Some scales did not run during the selected timestamp");
                setShow(true);
                setSuccessful(false);
                setLoadingBtn(false);
                return null;
            } else {
                setLoadingBtn(false);
                setMessage("Data fetched successfully");
                setShow(true);
                setSuccessful(true);
            }
        } catch (error) {
            setLoadingBtn(false);
            setMessage("Failed to fetch data");
            setShow(true);
            setSuccessful(false);
            console.log(error);
        }
    };

return (
        <div className="min-h-screen flex flex-col relative">
            <Navbar />
            <main className={`flex-1 p-1 h-f mt-20 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
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
                            <div className={`p-4 rounded-md ${successful
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                }`}>
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
                                        value={startTime || ''}
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
                                        value={endTime || ''}
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

                {siteData && <RuntimeTable iccidRuntimes={siteData} />}
            </main>
            <Footer />
        </div>
    )
}

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
        scales: site.scales.map(scale => ({
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
      const existingScale = existingSite.scales.find(s => s.iccid === scale.iccid);

      if (existingScale) {
        // Merge runtime arrays by hour, preferring earlier totalDeltaSum (keep existing)
        const runtimeMap = new Map(existingScale.runtime.map(r => [r.hour, r.totalDeltaSum]));

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
  return Array.from(mergedMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}


export default AuditingDashboard;


