import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RuntimesAudit } from "@/types/runtime";
import { hasValidDate } from "@/utils/runtimeUtils";

interface AllexportsProps {
  viewMode: "single" | "all";
  currentIccid: string;
  allIccids: string[];
  dates: string[];
  dashboardname: string;
  hours: string[];
  iccidRuntimes: RuntimesAudit[];
  inputValues: Record<string, Record<string, string>>;
  calculatedValues: Record<string, Record<string, number>>;
  allCalculatedValues: Record<string, Record<string, Record<string, number>>>;
  allInputValues: Record<string, Record<string, Record<string, string>>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  setSuccessful: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Allexports = ({
  viewMode,
  currentIccid,
  allIccids,
  dates,
  dashboardname,
  hours,
  inputValues,
  allInputValues,
  calculatedValues,
  allCalculatedValues,
  iccidRuntimes,
  setMessage,
  setShow,
  setSuccessful,
}: AllexportsProps) => {
  // State variables for input csv export
  const [exportInputStartDate, setExportInputStartDate] = useState<string>("");
  const [exportInputEndDate, setExportInputEndDate] = useState<string>("");
  const [exportDate, setExportDate] = useState<string>("");
  const [shiftStart, setShiftStart] = useState<string>("");
  const [shiftEnd, setShiftEnd] = useState<string>("");

  const handleExportDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExportDate(e.target.value);
  };

  const handleShiftStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShiftStart(e.target.value);
  };

  const handleShiftEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShiftEnd(e.target.value);
  };
  // Input figures export
  const exportInputTableToCSV = (): void => {
    // Get the currently visible ICCID(s)
    const visibleIccids: string[] =
      viewMode === "single" ? [currentIccid] : allIccids;

    // Get the currently visible dates (filtered by date range if specified)
    let visibleDates: string[] = dates;
    if (exportInputStartDate && exportInputEndDate) {
      visibleDates = dates.filter((date) => {
        const dateObj = new Date(date);
        const startObj = new Date(exportInputStartDate);
        const endObj = new Date(exportInputEndDate);
        return dateObj >= startObj && dateObj <= endObj;
      });
    }

    // Prepare CSV content
    const header = ["Site Name", "ICCID", "Date", "Hour", "Input Value"];
    const rows: string[][] = [];

    // Add data rows
    visibleIccids.forEach((iccid) => {
      const inputData =
        viewMode === "single" ? inputValues : allInputValues[iccid] || {};

      visibleDates.forEach((date) => {
        hours.forEach((hour) => {
          const value = inputData[date]?.[hour] || "";
          rows.push([dashboardname, iccid, date, hour, value]);
        });
      });
    });

    // Create CSV content
    const csvContent = [
      header.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Create filename with site name and date range
    let fileName = `${dashboardname}_Input_Table`;
    if (exportInputStartDate && exportInputEndDate) {
      fileName += `_${exportInputStartDate}_to_${exportInputEndDate}`;
    } else if (visibleDates.length > 0) {
      fileName += `_${visibleDates[0]}_to_${visibleDates[visibleDates.length - 1]}`;
    }
    fileName += `.csv`;

    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Purple figures export
  const exportToCSV = () => {
    const dayTotals = dates.map((date, dateIndex) => {
      const currentDaySum = hours
        .filter((hour) => hour >= "06")
        .reduce((sum, hour) => sum + (calculatedValues[date]?.[hour] || 0), 0);

      const nextDate = dates[dateIndex + 1];
      const nextDaySum = nextDate
        ? hours
            .filter((hour) => hour <= "05")
            .reduce(
              (sum, hour) => sum + (calculatedValues[nextDate]?.[hour] || 0),
              0,
            )
        : 0;

      return currentDaySum + nextDaySum;
    });

    const progressiveTotal = dayTotals.reduce((sum, total) => sum + total, 0);

    const header = ["ICCID", "Date", ...hours, "Day Total"];
    const rows = dates.map((date, index) => {
      const row = [currentIccid, date];
      hours.forEach((hour) => {
        const value = calculatedValues[date]?.[hour]?.toFixed(4) || "0.0000";
        row.push(value);
      });
      row.push(dayTotals[index].toFixed(4));
      return row;
    });

    const totalRow = [
      currentIccid,
      "Progressive Total",
      ...hours.map(() => ""),
      progressiveTotal.toFixed(4),
    ];

    const csvContent = [
      header.join(","),
      ...rows.map((row) => row.join(",")),
      totalRow.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentIccid} Purple Figures.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAllToCSV = () => {
    const iccidsWithData = allIccids.filter(
      (iccid) =>
        allCalculatedValues[iccid] &&
        Object.keys(allCalculatedValues[iccid]).length > 0,
    );

    if (iccidsWithData.length === 0) {
      console.log("No data to export");
      return;
    }

    const progressiveTotals: Record<string, number> = {};
    iccidsWithData.forEach((iccid) => {
      const iccidDates = Object.keys(allCalculatedValues[iccid] || {}).sort();
      progressiveTotals[iccid] = iccidDates.reduce((total, date, dateIndex) => {
        const currentDaySum = hours
          .filter((hour) => hour >= "06")
          .reduce(
            (sum, hour) =>
              sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0),
            0,
          );

        const nextDate = iccidDates[dateIndex + 1];
        const nextDaySum = nextDate
          ? hours
              .filter((hour) => hour <= "05")
              .reduce(
                (sum, hour) =>
                  sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0),
                0,
              )
          : 0;

        return total + currentDaySum + nextDaySum;
      }, 0);
    });

    const header = ["ICCID", "Date", ...hours, "Day Total (06-05)"];
    const rows: string[][] = [];

    iccidsWithData.forEach((iccid, iccidIndex) => {
      if (iccidIndex > 0) {
        rows.push(Array(header.length).fill(""));
      }

      const iccidDates = Object.keys(allCalculatedValues[iccid] || {}).sort();

      iccidDates.forEach((date, dateIndex) => {
        const currentDaySum = hours
          .filter((hour) => hour >= "06")
          .reduce(
            (sum, hour) =>
              sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0),
            0,
          );

        const nextDate = iccidDates[dateIndex + 1];
        const nextDaySum = nextDate
          ? hours
              .filter((hour) => hour <= "05")
              .reduce(
                (sum, hour) =>
                  sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0),
                0,
              )
          : 0;

        const dayTotal = currentDaySum + nextDaySum;

        const row = [
          iccid,
          date,
          ...hours.map(
            (hour) =>
              allCalculatedValues[iccid]?.[date]?.[hour]?.toFixed(4) ||
              "0.0000",
          ),
          dayTotal.toFixed(4),
        ];
        rows.push(row);
      });

      rows.push([
        iccid,
        "Progressive Total",
        ...hours.map(() => ""),
        progressiveTotals[iccid]?.toFixed(4) || "0.0000",
      ]);
    });

    rows.push(Array(header.length).fill(""));
    const grandTotal = Object.values(progressiveTotals).reduce(
      (sum, total) => sum + total,
      0,
    );
    rows.push([
      "ALL ICCIDS",
      "GRAND TOTAL",
      ...hours.map(() => ""),
      grandTotal.toFixed(4),
    ]);

    let csvContent = [
      `SEP=,`,
      header.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    csvContent = csvContent.replace(
      new RegExp(`"${Array(header.length).fill('""').join(",")}"`, "g"),
      Array(header.length).fill('" "').join(",") + ",@style=background:#f0f0f0",
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dashboardname}_Purple_Figures_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPerDay = () => {
    if (!exportDate) {
      setMessage(`Please select a date`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    const dayData = iccidRuntimes.find(
      (day) => day.date !== null && day.date === exportDate,
    );
    if (!dayData) {
      setMessage(`No data found for the selected date`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    const header = [
      "ICCID",
      "Hour",
      "Runtime",
      "Input Value",
      "Calculated Value",
    ];
    const rows: string[][] = [];

    allIccids.forEach((iccid, index) => {
      const scale = dayData.scales.find((s) => s.iccid === iccid);
      if (!scale) return;

      if (index > 0) {
        rows.push(["", "", "", "", ""]);
      }

      hours.forEach((hour) => {
        const runtime =
          scale.runtime.find((r) => r.hour === hour)?.totalDeltaSum || 0;
        const inputVal = allInputValues[iccid]?.[exportDate]?.[hour] || "";
        const calculatedVal =
          allCalculatedValues[iccid]?.[exportDate]?.[hour] || 0;

        rows.push([
          iccid,
          hour,
          runtime.toFixed(4),
          inputVal,
          calculatedVal.toFixed(4),
        ]);
      });
    });

    let csvContent = [
      `SEP=,`,
      header.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    csvContent = csvContent.replace(
      /"","","","",""/g,
      '" "," "," "," "," ",@style=background:#f0f0f0',
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dashboardname}_Daily_Export_${exportDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPerShift = () => {
    if (!shiftStart || !shiftEnd) {
      setMessage(`Please select both start and end times for the shift`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    const startDate = new Date(shiftStart);
    const endDate = new Date(shiftEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setMessage(`Invalid date format for shift times`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    if (startDate >= endDate) {
      setMessage(`Shift end time must be after start time`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    const header = [
      "ICCID",
      "Date",
      "Hour",
      "Runtime",
      "Input Value",
      "Calculated Value",
    ];
    const rows: string[][] = [];

    allIccids.forEach((iccid, index) => {
      iccidRuntimes.filter(hasValidDate).forEach((dayData) => {
        const scale = dayData.scales.find((s) => s.iccid === iccid);
        if (!scale) return;

        if (index > 0) {
          rows.push(["", "", "", "", ""]);
        }

        const dayDate = new Date(dayData.date);
        if (isNaN(dayDate.getTime())) {
          console.error("Invalid date in dayData:", dayData.date);
          return;
        }

        dayDate.setHours(0, 0, 0, 0);

        scale.runtime.forEach((runtime) => {
          const hourValue = runtime.hour.includes(":")
            ? parseInt(runtime.hour.split(":")[0], 10)
            : parseInt(runtime.hour, 10);

          if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) {
            console.error("Invalid hour value:", runtime.hour);
            return;
          }

          const entryDate = new Date(dayDate);
          entryDate.setHours(hourValue, 0, 0, 0);

          if (entryDate >= startDate && entryDate <= endDate) {
            const inputVal =
              allInputValues[iccid]?.[dayData.date]?.[runtime.hour] || "";
            const calculatedVal =
              allCalculatedValues[iccid]?.[dayData.date]?.[runtime.hour] || 0;

            rows.push([
              iccid,
              dayData.date,
              hourValue.toString().padStart(2, "0"),
              runtime.totalDeltaSum.toFixed(4),
              inputVal,
              calculatedVal.toFixed(4),
            ]);
          }
        });
      });
    });

    if (rows.length === 0) {
      setMessage(`No data found for the selected time period`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    let csvContent = [
      `SEP=,`,
      header.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    csvContent = csvContent.replace(
      /"","","","",""/g,
      '" "," "," "," "," ",@style=background:#f0f0f0',
    );

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dashboardname}_Shift_Export_${startDate.toLocaleString().replace(/[/:, ]/g, "_")}_to_${endDate.toLocaleString().replace(/[/:, ]/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mx-4 mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold">Export Input Table</h3>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium w-24">Date Range:</label>
            <input
              type="date"
              value={exportInputStartDate}
              onChange={(e) => setExportInputStartDate(e.target.value)}
              className="border rounded p-2 text-sm"
            />
            <span>to</span>
            <input
              type="date"
              value={exportInputEndDate}
              onChange={(e) => setExportInputEndDate(e.target.value)}
              className="border rounded p-2 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={exportInputTableToCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Download Input Table as CSV
            </button>
          </div>

          <p className="text-xs text-gray-500">
            The CSV will include: Site Name, ICCID, Date, Hour, and Input Value.
            {exportInputStartDate && exportInputEndDate
              ? ` Filtered from ${exportInputStartDate} to ${exportInputEndDate}.`
              : " Includes all available dates."}
          </p>
        </div>
      </div>

      <div className="mx-4 mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold">Export Purple Figures</h3>
        <div className="flex space-x-4">
          <Button
            onClick={viewMode === "single" ? exportToCSV : exportAllToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Export total Period
          </Button>
        </div>
        <div className="flex space-x-4">
          <Button onClick={exportPerDay} className="bg-slate-500 text-white">
            Export per Day
          </Button>
          <div className="w-400">
            <Label htmlFor="export-date" className="mr-1">
              Day
            </Label>
            <input
              type="date"
              id="export-date"
              value={exportDate}
              onChange={handleExportDateChange}
              className="border rounded p-2"
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <Button onClick={exportPerShift} className="bg-slate-600 text-white">
            Export per Shift
          </Button>
          <div className="w-400">
            <Label htmlFor="shift-start" className="mr-1">
              Shift Start
            </Label>
            <input
              type="datetime-local"
              id="shift-start"
              value={shiftStart ? shiftStart.replace(/:..$/, ":00") : ""}
              onChange={handleShiftStartChange}
              className="border rounded p-2"
              step="3600"
            />
          </div>
          <div className="w-400">
            <Label htmlFor="shift-end" className="mr-1">
              Shift End
            </Label>
            <input
              type="datetime-local"
              id="shift-end"
              value={shiftEnd ? shiftEnd.replace(/:..$/, ":00") : ""}
              onChange={handleShiftEndChange}
              className="border rounded p-2"
              step="3600"
            />
          </div>
        </div>
      </div>
    </>
  );
};
