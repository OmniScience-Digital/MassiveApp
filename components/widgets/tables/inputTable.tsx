import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Loader2, Save } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { createOrUpdateInputValueTable } from "@/service/inputvalues.service";
import { createOrUpdatePurpleDaily } from "@/service/purplefigures.Service";
import { CellSelection } from "@/types/runtime";

interface InputTableProps {
    viewMode: "single" | "all";
    lastAction: "auto-fill" | "manual" | "preset" | "bulk";
    cellSelection: CellSelection;
    dates: string[];
    hours: string[];
    allIccids: string[];
    historyIndex: number;
    currentIccid: string;
    id: string;
    loadinbtn2: boolean;
    loadinbtn: boolean;
    hasCalculated: boolean;
    inputValues: Record<string, Record<string, string>>;
    allCalculatedValues: Record<string, Record<string, Record<string, number>>>;
    allInputValues: Record<string, Record<string, Record<string, string>>>;
    history: Record<string, Record<string, string>>[];
    handleCalculate: () => void;
    handleCalculateAll: () => void;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    setSuccessful: React.Dispatch<React.SetStateAction<boolean>>;
    setHasCalculated: React.Dispatch<React.SetStateAction<boolean>>;
    setLoadingBtn2: React.Dispatch<React.SetStateAction<boolean>>;
    setAllInputValues: React.Dispatch<
        React.SetStateAction<Record<string, Record<string, Record<string, string>>>>
    >;
    setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
    setInputValues: React.Dispatch<
        React.SetStateAction<Record<string, Record<string, string>>>
    >;
    setLastAction: React.Dispatch<
        React.SetStateAction<"manual" | "auto-fill" | "preset" | "bulk">
    >;
    setAutoFillMode: React.Dispatch<
        React.SetStateAction<"all" | "right" | "below" | null>
    >;
    saveToHistory: (currentState: Record<string, Record<string, string>>) => void;
    isSelectionActive: () => boolean | null;
    setCellSelection: React.Dispatch<React.SetStateAction<CellSelection>>;
}

export const InputTable = ({
    id,
    currentIccid,
    viewMode,
    lastAction,
    cellSelection,
    hasCalculated,
    hours,
    dates,
    inputValues,
    historyIndex,
    allInputValues,
    allIccids,
    allCalculatedValues,
    loadinbtn,
    loadinbtn2,
    history,
    handleCalculate,
    handleCalculateAll,
    setAutoFillMode,
    setHasCalculated,
    setMessage,
    setShow,
    setSuccessful,
    setLoadingBtn2,
    setAllInputValues,
    setInputValues,
    setLastAction,
    saveToHistory,
    isSelectionActive,
    setCellSelection,
    setHistoryIndex,
}: InputTableProps) => {
    const [open, setOpen] = useState(false);
    const [customPreset, setCustomPreset] = useState("");
    const [loadinbtn3, setLoadingBtn3] = useState(false);

    const getNormalizedSelection = () => {
        if (!cellSelection.start || !cellSelection.end)
            return { start: { date: "", hour: "" }, end: { date: "", hour: "" } };

        const dateStartIdx = dates.indexOf(cellSelection.start.date);
        const dateEndIdx = dates.indexOf(cellSelection.end.date);
        const hourStartIdx = hours.indexOf(cellSelection.start.hour);
        const hourEndIdx = hours.indexOf(cellSelection.end.hour);

        return {
            start: {
                date: dates[Math.min(dateStartIdx, dateEndIdx)],
                hour: hours[Math.min(hourStartIdx, hourEndIdx)],
            },
            end: {
                date: dates[Math.max(dateStartIdx, dateEndIdx)],
                hour: hours[Math.max(hourStartIdx, hourEndIdx)],
            },
        };
    };

    const handleInputChange = (date: string, hour: string, value: string) => {
        const newValues = {
            ...inputValues,
            [date]: {
                ...inputValues[date],
                [hour]: value,
            },
        };

        setInputValues(newValues);
        setLastAction("manual");

        if (!cellSelection.active) {
            saveToHistory(newValues);
        }
    };

    const applyPreset = (value: number) => {
        const newValues = JSON.parse(JSON.stringify(inputValues));
        const presetValue = value.toString();

        if (isSelectionActive()) {
            const { start, end } = getNormalizedSelection();
            for (
                let d = dates.indexOf(start.date);
                d <= dates.indexOf(end.date);
                d++
            ) {
                const date = dates[d];
                for (
                    let h = hours.indexOf(start.hour);
                    h <= hours.indexOf(end.hour);
                    h++
                ) {
                    const hour = hours[h];
                    if (!newValues[date]) newValues[date] = {};
                    newValues[date][hour] = presetValue;
                }
            }
        } else {
            dates.forEach((date) => {
                hours.forEach((hour) => {
                    if (!newValues[date]?.[hour]) {
                        if (!newValues[date]) newValues[date] = {};
                        newValues[date][hour] = presetValue;
                    }
                });
            });
        }

        setInputValues(newValues);
        saveToHistory(newValues);
        setLastAction("preset");
    };

    const handleCellMouseDown = (date: string, hour: string) => {
        setCellSelection({
            start: { date, hour },
            end: { date, hour },
            active: true,
        });
    };

    const handleCellMouseEnter = (date: string, hour: string) => {
        if (cellSelection.active) {
            setCellSelection((prev) => ({
                ...prev,
                end: { date, hour },
            }));
        }
    };

    const isCellSelected = (date: string, hour: string) => {
        if (!isSelectionActive()) return false;

        const { start, end } = getNormalizedSelection();
        const dateIdx = dates.indexOf(date);
        const hourIdx = hours.indexOf(hour);

        return (
            dateIdx >= dates.indexOf(start.date) &&
            dateIdx <= dates.indexOf(end.date) &&
            hourIdx >= hours.indexOf(start.hour) &&
            hourIdx <= hours.indexOf(end.hour)
        );
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            setInputValues(JSON.parse(JSON.stringify(history[historyIndex - 1])));
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            setInputValues(JSON.parse(JSON.stringify(history[historyIndex + 1])));
        }
    };

    const handleClearAll = () => {
        setInputValues({});
        saveToHistory({});
    };

    //save input figures

    const handleSaveToDB = async () => {
        try {
            // Update the allInputValues with current input values before saving
            const updatedAllInputValues = {
                ...allInputValues,
                [currentIccid]: inputValues,
            };
            setAllInputValues(updatedAllInputValues);

            // Prepare payload for input values - flattened to match InputTable schema
            const inputValuePayload = allIccids.flatMap((iccid) => {
                const iccidInputValues = updatedAllInputValues[iccid] || {};

                return Object.entries(iccidInputValues).map(([rowdate, hourlyValues]) => {
                    // Convert rowdate string to YYYY-MM-DD format
                    const formattedRowdate = new Date(rowdate).toISOString().split("T")[0];

                    return {
                        siteId: id, // assuming 'id' is your siteId
                        iccid,
                        rowdate: formattedRowdate,
                        inputValues: Object.fromEntries(
                            Array.from({ length: 24 }, (_, hour) => {
                                const hourKey = hour.toString().padStart(2, "0");
                                const value = hourlyValues[hourKey];
                                return [hourKey, value !== undefined ? value.toString() : ""];
                            }),
                        ),
                    };
                });
            });


            setLoadingBtn2(true);

            console.log(inputValuePayload);


            // Save input values
            await createOrUpdateInputValueTable(inputValuePayload);

            setMessage(`Input values saved successfully.`);
            setShow(true);
            setSuccessful(true);
            setLoadingBtn2(false);
        } catch (error) {
            setMessage(`Failed to save data: ${error}`);
            setShow(true);
            setSuccessful(false);
            setLoadingBtn2(false);
            console.error(error);
        }
    };

    const handleSavePurpleToDB = async () => {
        try {
            // Prepare payload for purple figures
            const purpleFigurePayload = {
                data: allIccids.map((iccid) => ({
                    iccid,
                    purpleValues: Object.fromEntries(
                        Object.entries(allCalculatedValues[iccid] || {}).map(
                            ([date, hours]) => [
                                date,
                                Object.fromEntries(
                                    Object.entries(hours).map(([hour, value]) => [
                                        hour,
                                        value.toString(),
                                    ]),
                                ),
                            ],
                        ),
                    ),
                })),
            };

            setLoadingBtn3(true);

            // Save both input values and purple figures
            await createOrUpdatePurpleDaily(id, purpleFigurePayload);

            setMessage(`Purple figures saved successfully.`);
            setShow(true);
            setSuccessful(true);
            setLoadingBtn3(false);

            // Disable save button after successful save
            setHasCalculated(false);
        } catch (error) {
            setMessage(`Failed to save data: ${error}`);
            setShow(true);
            setSuccessful(false);
            setLoadingBtn3(false);
            console.error(error);
        }
    };

    return (
        <>
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-500 font-bold px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <Button
                                onClick={handleUndo}
                                variant="outline"
                                size="sm"
                                disabled={historyIndex <= 0}
                                className="bg-gray-600 text-white"
                            >
                                <Undo2 />
                            </Button>
                            <Button
                                onClick={handleRedo}
                                variant="outline"
                                size="sm"
                                disabled={historyIndex >= history.length - 1}
                                className="bg-gray-600 text-white"
                            >
                                <Redo2 />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <span className="text-white">INPUT TABLE</span>
                    </div>
                    <div className="flex gap-2">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-orange-600 text-white"
                                >
                                    Presets
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 grid grid-cols-3 gap-1">
                                <div className="flex gap-2 items-center mt-2 w-20">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Custom preset"
                                        className="border px-2 py-1 rounded text-sm"
                                        value={customPreset}
                                        onChange={(e) => setCustomPreset(e.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const val = parseFloat(customPreset);
                                            if (!isNaN(val)) {
                                                applyPreset(val);
                                                setOpen(false);
                                            }
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            onClick={() => setAutoFillMode("right")}
                            className="bg-slate-500 text-white"
                            variant="outline"
                            size="sm"
                        >
                            Fill Right
                        </Button>
                        <Button
                            onClick={() => setAutoFillMode("below")}
                            className="bg-slate-500 text-white"
                            variant="outline"
                            size="sm"
                        >
                            Fill Below
                        </Button>
                        <Button
                            onClick={() => setAutoFillMode("all")}
                            className="bg-slate-500 text-white"
                            variant="outline"
                            size="sm"
                        >
                            Fill All
                        </Button>
                        <Button
                            onClick={handleClearAll}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            variant="outline"
                            size="sm"
                        >
                            Clear All
                        </Button>
                        {loadinbtn2 ? (
                            <Button disabled>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                Save Input to DB
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleSaveToDB()}
                                className="bg-blue-600 text-white"
                            >
                                <Save />
                                Save Input to DB
                            </Button>
                        )}

                        {loadinbtn3 ? (
                            <Button disabled>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                Save Purple Figures to DB
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleSavePurpleToDB()}
                                className="bg-purple-600 text-white"
                                disabled={!hasCalculated} // Disable if not calculated
                            >
                                <Save />
                                Save Purple Figures to DB
                            </Button>
                        )}
                        <Button
                            onClick={
                                viewMode === "single" ? handleCalculate : handleCalculateAll
                            }
                            className="bg-purple-600 text-white"
                        >
                            {loadinbtn ? (
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            ) : null}
                            {viewMode === "single" ? "Calculate" : "Calculate All"}
                        </Button>
                    </div>
                </div>
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Date</TableHead>
                            {hours.map((hour) => (
                                <TableHead key={hour} className="text-center">
                                    {hour}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dates.map((date) => (
                            <TableRow key={date}>
                                <TableCell className="font-medium">{date}</TableCell>
                                {hours.map((hour) => {
                                    const isSelected = isCellSelected(date, hour);
                                    const isAutoFilled =
                                        lastAction === "auto-fill" &&
                                        inputValues[date]?.[hour] &&
                                        !history[historyIndex - 1]?.[date]?.[hour];

                                    return (
                                        <TableCell
                                            key={`${date}-${hour}`}
                                            className={`text-center ${isSelected ? "bg-blue-200" : ""}`}
                                            onMouseDown={() => handleCellMouseDown(date, hour)}
                                            onMouseEnter={() => handleCellMouseEnter(date, hour)}
                                        >
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^[0-9]*[.,]?[0-9]*$"
                                                value={inputValues[date]?.[hour] ?? ""}
                                                onChange={(e) =>
                                                    handleInputChange(date, hour, e.target.value)
                                                }
                                                className={`w-20 text-center p-1 text-sm border text-white rounded-md ${isAutoFilled ? "bg-blue-300" : "bg-gray-500"} ${isSelected ? "ring-2 ring-blue-200" : ""}`}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};
