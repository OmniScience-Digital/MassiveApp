'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { client } from '@/service/schemaClient'
import { ReportItem } from '@/types/schema'
import Footer from '@/components/layout/footer'
import Navbar from '@/components/layout/navbar'
import Loading from "@/components/widgets/loading"
import { DataTable } from '@/components/dashboard/DataTable'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, EditIcon, CalendarCheck, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { runprogressiveShiftReport } from "../api/progressive.route"

const ProgressiveReporting = () => {
    const [loading, setLoading] = useState(false)
    const [submittedsites, setSubmitted] = useState<ReportItem[]>([])
    const router = useRouter()

    function listsites() {
        setLoading(true)
        client.models.Sites.observeQuery().subscribe({
            next: (data) => {
                const sites = data.items
                    .map((report) => {
                        const parsedSite = typeof report.site === "string"
                            ? JSON.parse(report.site)
                            : {}
                        parsedSite.id = report.id
                        return parsedSite
                    })
                    .filter((site) => site.progressive === true)
                    .sort((a, b) =>
                        a.siteConstants?.siteName?.localeCompare(b.siteConstants?.siteName)
                    )

                setSubmitted(sites as ReportItem[])
                setLoading(false)
            },
            error: () => setLoading(false),
        })
    }

    useEffect(() => {
        listsites()
    }, [])

    const redirectToDashboard = (name: string, id: string) => {
        let path = name.replace(/\s+/g, '')
        router.push(`/progressiveDashboard/${path}/${id}`)
    }

    const columns: ColumnDef<object, any>[] = [
        {
            accessorKey: "sitename",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Site Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }: { row: any }) => (
                <EditButtonWithModal
                    name={row.original.sitename}
                    siteid={row.original.id}
                />
            ),
        },
    ];

    const data = Array.isArray(submittedsites)
        ? submittedsites.map((site) => {
            const input = site.siteConstants || {}
            const site_time = site.siteTimes || {}

            return {
                id: site.id || '',
                sitename: input.siteName || '',
                date: <EditIcon id={site.id} key={`edit-${site.id}`} />,
            }
        })
        : []

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 p-1 h-f mt-20">
                {loading ? (
                    <Loading />
                ) : (
                    <DataTable
                        title={'Progressive Sites'}
                        data={data}
                        columns={columns}
                    />
                )}
            </main>
            <Footer />
        </div>
    )
}

interface EditButtonWithModalProps {
    name: string;
    siteid: string;
}

const EditButtonWithModal = ({ name, siteid }: EditButtonWithModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loadinbtn, setLoadingBtn] = useState(false);
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState('');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        setShow(false);

        if (endDate && newStartDate > endDate) {
            setEndDate("");
        }
    };

    const getPreviousDate = () => {
        const now = new Date();
        now.setDate(now.getDate() - 1);
        return formatDate(now);
    };

    const getCurrentDate = () => {
        const now = new Date();
        return formatDate(now);
    };

    const formatDate = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        const today = getCurrentDate();

        if (selectedDate > today) {
            setEndDate(today);
        } else {
            setEndDate(selectedDate);
        }
    };

    const getSiteTelegramDataByid = async (id: string) => {
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

    const fetchData = async (startDate: string, endDate: string, id: string) => {
        try {
            const shiftsite = await getSiteTelegramDataByid(id);
            if (shiftsite) {
                return await runprogressiveShiftReport(shiftsite, { 
                    startTime: startDate, 
                    endTime: endDate 
                });
            }
            throw Error('Failed to generate progressive report');
        } catch (error) {
            console.error("Failed to fetch site data:", error);
        }
    };

    const handleQueryReport = async () => {
        try {
            if (!startDate || !endDate) {
                setMessage("Please select both start and end dates");
                setShow(true);
                setSuccessful(false);
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                setMessage("End date must be after start date");
                setShow(true);
                setSuccessful(false);
                return;
            }

            setLoadingBtn(true);
            const progressiveSite = await fetchData(startDate, endDate, siteid);

            if (!progressiveSite) {
                setMessage("Failed to generate progressive report");
                setShow(true);
                setSuccessful(false);
            } else {
                setMessage("Progressive report generated successfully");
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

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(true)}
            >
                <CalendarCheck className="h-4 w-4" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[825px]">
                    <DialogHeader>
                        <DialogTitle>Progressive</DialogTitle>
                        <DialogDescription>Run Report for {name} </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 space-y-4 max-w-4xl mx-auto">
                        {show && (
                            <div className={`p-4 rounded-md ${successful
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                }`}>
                                {message}
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm">
                            <h2 className="text-lg font-medium mb-4">Report Date Range</h2>

                            <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div className="space-y-2 w-full">
                                        <Label htmlFor="start-date">Start Date</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={handleStartDateChange}
                                            className="w-full bg-background"
                                            max={getPreviousDate()}
                                        />
                                    </div>
                                    <div className="space-y-2 w-full">
                                        <Label htmlFor="end-date">End Date</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={endDate}
                                            onChange={handleEndDateChange}
                                            className="w-full bg-background"
                                            max={getCurrentDate()}
                                        />
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
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ProgressiveReporting