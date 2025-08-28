import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Undo2, Redo2, Loader2, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { useParams } from 'next/navigation';
import { createOrUpdateInputValueTable } from '@/service/inputvalues.service';
import { client } from '@/service/schemaClient';
import ResponseModal from '../response';
import { savePurpleFiguresData } from '@/service/purplefigures.service';

interface RuntimeData {
  hour: string;
  totalDeltaSum: number;
}

interface Scale {
  iccid: string;
  runtime: RuntimeData[];
}

interface RuntimesAudit {
  id: string;
  date: string | null;
  scales: Scale[];
}

interface RuntimeTableProps {
  iccidRuntimes: RuntimesAudit[];
}

type CellSelection = {
  start: { date: string; hour: string } | null;
  end: { date: string; hour: string } | null;
  active: boolean;
};

const RuntimeTableTest = ({ iccidRuntimes }: RuntimeTableProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const dashboardname = decodeURIComponent(params.name as string).toUpperCase();

  const allIccids = Array.from(new Set(
    iccidRuntimes.flatMap(day => day.scales.map(scale => scale.iccid))
  ));

  const [customPreset, setCustomPreset] = useState('');
  const [loadinbtn, setLoadingBtn] = useState(false);
  const [loadinbtn2, setLoadingBtn2] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState('');
  const [exportDate, setExportDate] = useState<string>('');
  const [shiftStart, setShiftStart] = useState<string>('');
  const [shiftEnd, setShiftEnd] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [currentIccidIndex, setCurrentIccidIndex] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, Record<string, string>>>({});
  const [calculatedValues, setCalculatedValues] = useState<Record<string, Record<string, number>>>({});
  const [autoFillMode, setAutoFillMode] = useState<'right' | 'below' | 'all' | null>(null);
  const [history, setHistory] = useState<Record<string, Record<string, string>>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cellSelection, setCellSelection] = useState<CellSelection>({ start: null, end: null, active: false });
  const [lastAction, setLastAction] = useState<'manual' | 'auto-fill' | 'preset' | 'bulk'>('manual');
  const [allInputValues, setAllInputValues] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [allCalculatedValues, setAllCalculatedValues] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [selectedDate, setSelectedDate] = useState<string>(''); // State for selected date
  const tableRef = useRef<HTMLDivElement>(null);
  const currentIccid = allIccids[currentIccidIndex];
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // Function to normalize ICCID
  const normalize = (id: string): string => id.replace(/[-_]/g, '');

  // Fetch site table values
  const getSiteTableValues = async (siteId: string) => {
    try {
      const { data: inputvalues, errors } = await client.models.InputValueTable.listInputValueTableBySiteId({ siteId });

      if (errors) {
        console.error("Error fetching site:", errors);
        setMessage(`Error fetching site: ${errors}`);
        setShow(true);
        setSuccessful(false);
        return [];
      }

      return inputvalues.map((inputvalue) => {
        let parsedTablevalues: any[] = [];
        try {
          if (typeof inputvalue.data === 'string') {
            const clean = inputvalue.data.replace(/\\"/g, '"').replace(/^"+|"+$/g, '');
            parsedTablevalues = JSON.parse(clean);
          } else if (Array.isArray(inputvalue.data)) {
            parsedTablevalues = inputvalue.data;
          }
        } catch (error) {
          parsedTablevalues = [];
        }
        return {
          id: inputvalue.siteId,
          data: parsedTablevalues,
          timestamp: inputvalue.timestamp,
        };
      });
    } catch (error) {
      console.error("Error in getSiteTableValues:", error);
      return [];
    }
  };

  // Fetch input values and update state
  const fetchInputValues = async () => {
    try {
      const iccidInputValues = await getSiteTableValues(id);
      if (!iccidInputValues || iccidInputValues.length === 0) {
        setMessage("No input values found for the site.");
        setShow(true);
        setSuccessful(false);
        return;
      }

      const loadedInputValues: Record<string, Record<string, Record<string, string>>> = {};

      iccidInputValues.forEach((entry: any) => {
        entry.data.forEach((item: any) => {
          const iccid = item.iccid;
          if (!loadedInputValues[iccid]) {
            loadedInputValues[iccid] = {};
          }

          Object.entries(item.inputValues).forEach(([date, hourValues]) => {
            if (!loadedInputValues[iccid][date]) {
              loadedInputValues[iccid][date] = {};
            }

            Object.entries(hourValues as Record<string, string>).forEach(([hour, value]) => {
              if (!loadedInputValues[iccid][date][hour] || loadedInputValues[iccid][date][hour] === "") {
                loadedInputValues[iccid][date][hour] = value;
              }
            });
          });
        });
      });

      // Update allInputValues with fetched data
      setAllInputValues(prev => ({
        ...prev,
        ...loadedInputValues,
      }));

      // Update inputValues for the current ICCID
      const normalizedCurrent = normalize(currentIccid);
      const matchedKey = Object.keys(loadedInputValues).find(
        (key) => normalize(key) === normalizedCurrent
      );

      if (matchedKey && loadedInputValues[matchedKey]) {
        setInputValues(loadedInputValues[matchedKey]);
      } else {
        setInputValues({});
      }
    } catch (error) {
      console.error("Error in fetchInputValues:", error);
      setMessage(`Failed to fetch input values: ${error}`);
      setShow(true);
      setSuccessful(false);
    }
  };

  // Fetch data on mount and when id or selectedDate changes
  useEffect(() => {
    fetchInputValues();
  }, [id, selectedDate]);

  // Update inputValues and calculatedValues when currentIccid changes
  useEffect(() => {
    const normalizedCurrent = normalize(currentIccid);
    const matchedKey = Object.keys(allInputValues).find(
      (key) => normalize(key) === normalizedCurrent
    );

    if (matchedKey && allInputValues[matchedKey]) {
      setInputValues(allInputValues[matchedKey]);
    } else {
      setInputValues({});
    }

    if (allCalculatedValues[currentIccid]) {
      setCalculatedValues(allCalculatedValues[currentIccid]);
    } else {
      setCalculatedValues({});
    }
  }, [currentIccid, allInputValues, allCalculatedValues]);

  // Generate date-hour values mapping
  const dateToHourValues = iccidRuntimes.reduce((acc, dayData) => {
    const date = dayData.date;
    if (!date) return acc;

    const scale = dayData.scales.find((s) => s.iccid === currentIccid);
    if (!scale) return acc;

    if (!acc[date]) {
      acc[date] = {};
    }

    scale.runtime
      .filter((r): r is RuntimeData => typeof r.totalDeltaSum === 'number' && !isNaN(r.totalDeltaSum))
      .forEach(({ hour, totalDeltaSum }) => {
        const current = acc[date][hour];
        if (current === undefined) {
          acc[date][hour] = totalDeltaSum;
        }
      });

    return acc;
  }, {} as Record<string, Record<string, number>>);

  const dates = Object.keys(dateToHourValues);

  const handleExportDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExportDate(e.target.value);
  };

  const handleShiftStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShiftStart(e.target.value);
  };

  const handleShiftEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShiftEnd(e.target.value);
  };

  const saveToHistory = (currentState: Record<string, Record<string, string>>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentState)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
    setLastAction('manual');

    if (!cellSelection.active) {
      saveToHistory(newValues);
    }
  };

  const applyPreset = (value: number) => {
    let newValues = JSON.parse(JSON.stringify(inputValues));
    const presetValue = value.toString();

    if (isSelectionActive()) {
      const { start, end } = getNormalizedSelection();
      for (let d = dates.indexOf(start.date); d <= dates.indexOf(end.date); d++) {
        const date = dates[d];
        for (let h = hours.indexOf(start.hour); h <= hours.indexOf(end.hour); h++) {
          const hour = hours[h];
          if (!newValues[date]) newValues[date] = {};
          newValues[date][hour] = presetValue;
        }
      }
    } else {
      dates.forEach(date => {
        hours.forEach(hour => {
          if (!newValues[date]?.[hour]) {
            if (!newValues[date]) newValues[date] = {};
            newValues[date][hour] = presetValue;
          }
        });
      });
    }

    setInputValues(newValues);
    saveToHistory(newValues);
    setLastAction('preset');
  };

  const handleCalculate = () => {
    setLoadingBtn(true);
    const result: Record<string, Record<string, number>> = {};

    for (const date of dates) {
      result[date] = {};
      for (const hour of hours) {
        const runtimeVal = dateToHourValues[date]?.[hour];
        const inputVal = inputValues[date]?.[hour];

        const parsedInput = parseFloat(inputVal || '0') || 0;
        const multiplier = inputVal === '' ? 0 : parsedInput;
        const value = typeof runtimeVal === 'number' ? runtimeVal * multiplier : 0;

        result[date][hour] = value;
      }
    }

    setCalculatedValues(result);
    setAllCalculatedValues(prev => ({
      ...prev,
      [currentIccid]: result
    }));
    setLoadingBtn(false);
  };

  const handleCalculateAll = () => {
    setLoadingBtn(true);

    const allResults: Record<string, Record<string, Record<string, number>>> = {};

    allIccids.forEach(iccid => {
      const normalizedIccid = normalize(iccid);
      const matchedKey = Object.keys(allInputValues).find(
        key => normalize(key) === normalizedIccid
      );

      if (!matchedKey) return;

      const iccidRuntimeData = iccidRuntimes.reduce((acc, dayData) => {
        if (!dayData.date) return acc;
        const scale = dayData.scales.find((s) => s.iccid === iccid);
        if (!scale) return acc;

        const hourMap = scale.runtime.reduce((hourAcc, runtime) => {
          hourAcc[runtime.hour] = runtime.totalDeltaSum;
          return hourAcc;
        }, {} as Record<string, number>);

        acc[dayData.date] = hourMap;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      const iccidDates = Object.keys(iccidRuntimeData);

      allResults[iccid] = {};

      iccidDates.forEach(date => {
        allResults[iccid][date] = {};
        hours.forEach(hour => {
          const runtimeVal = iccidRuntimeData[date]?.[hour];
          const inputVal = allInputValues[matchedKey]?.[date]?.[hour] || '0';

          const parsedInput = parseFloat(inputVal) || 0;
          const multiplier = inputVal === '' ? 0 : parsedInput;
          const value = typeof runtimeVal === 'number' ? runtimeVal * multiplier : 0;

          allResults[iccid][date][hour] = value;
        });
      });
    });

    setAllCalculatedValues(allResults);
    setLoadingBtn(false);
  };

  const handleCellMouseDown = (date: string, hour: string) => {
    setCellSelection({
      start: { date, hour },
      end: { date, hour },
      active: true
    });
  };

  const handleCellMouseEnter = (date: string, hour: string) => {
    if (cellSelection.active) {
      setCellSelection(prev => ({
        ...prev,
        end: { date, hour }
      }));
    }
  };

  const handleMouseUp = () => {
    if (cellSelection.active) {
      setCellSelection(prev => ({ ...prev, active: false }));
      if (isSelectionActive()) {
        saveToHistory(inputValues);
      }
    }
  };

  const isSelectionActive = () => {
    return cellSelection.start && cellSelection.end &&
      (cellSelection.start.date !== cellSelection.end.date ||
        cellSelection.start.hour !== cellSelection.end.hour);
  };

  const getNormalizedSelection = () => {
    if (!cellSelection.start || !cellSelection.end) return { start: { date: '', hour: '' }, end: { date: '', hour: '' } };

    const dateStartIdx = dates.indexOf(cellSelection.start.date);
    const dateEndIdx = dates.indexOf(cellSelection.end.date);
    const hourStartIdx = hours.indexOf(cellSelection.start.hour);
    const hourEndIdx = hours.indexOf(cellSelection.end.hour);

    return {
      start: {
        date: dates[Math.min(dateStartIdx, dateEndIdx)],
        hour: hours[Math.min(hourStartIdx, hourEndIdx)]
      },
      end: {
        date: dates[Math.max(dateStartIdx, dateEndIdx)],
        hour: hours[Math.max(hourStartIdx, hourEndIdx)]
      }
    };
  };

  const isCellSelected = (date: string, hour: string) => {
    if (!isSelectionActive()) return false;

    const { start, end } = getNormalizedSelection();
    const dateIdx = dates.indexOf(date);
    const hourIdx = hours.indexOf(hour);

    return dateIdx >= dates.indexOf(start.date) &&
      dateIdx <= dates.indexOf(end.date) &&
      hourIdx >= hours.indexOf(start.hour) &&
      hourIdx <= hours.indexOf(end.hour);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setInputValues(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setInputValues(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const handleClearAll = () => {
    setInputValues({});
    saveToHistory({});
  };

  const handleNext = () => {
    setCurrentIccidIndex((prev) => (prev + 1) % allIccids.length);
  };

  const handlePrevious = () => {
    setCurrentIccidIndex((prev) => (prev - 1 + allIccids.length) % allIccids.length);
  };

  const handleSaveToDB = async () => {
    try {
      const updatedAllInputValues = {
        ...allInputValues,
        [currentIccid]: inputValues,
      };
      setAllInputValues(updatedAllInputValues);

      const payload = {
        timestamp: new Date().toISOString(),
        data: allIccids.map(iccid => ({
          iccid,
          inputValues: updatedAllInputValues[iccid] || {},
        }))
      };

      const purpleFigurePayload = allIccids.flatMap(iccid => {
        const calculatedValues = allCalculatedValues[iccid] || {};
        return Object.entries(calculatedValues).map(([date, hourValues]) => ({
          siteId: id,
          iccid: iccid,
          date,
          hourValues:hourValues??{},
          timestamp: new Date().toISOString()
        }));
      });


      if (purpleFigurePayload.length < 1) {
        setMessage(`Calculate Purple figures for all scales`);
        setShow(true);
        setSuccessful(false);
        setLoadingBtn2(false);
        return;
      }
      setLoadingBtn2(true);

  
      await createOrUpdateInputValueTable(id, payload);
      //await savePurpleFiguresData(id, purpleFigurePayload);
    

      setMessage(`Input values and Purple figures saved.`);
      setShow(true);
      setSuccessful(true);
      setLoadingBtn2(false);
    } catch (error) {
      setMessage(`Failed to save input values: ${error}`);
      setShow(true);
      setSuccessful(false);
      setLoadingBtn2(false);
      console.error(error);
    }
  };

  const exportToCSV = () => {
    const dayTotals = dates.map((date, dateIndex) => {
      const currentDaySum = hours
        .filter(hour => hour >= '06')
        .reduce((sum, hour) => sum + (calculatedValues[date]?.[hour] || 0), 0);

      const nextDate = dates[dateIndex + 1];
      const nextDaySum = nextDate
        ? hours
          .filter(hour => hour <= '05')
          .reduce((sum, hour) => sum + (calculatedValues[nextDate]?.[hour] || 0), 0)
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
      progressiveTotal.toFixed(4)
    ];

    const csvContent = [
      header.join(","),
      ...rows.map(row => row.join(",")),
      totalRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentIccid} Purple Figures.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAllToCSV = () => {
    const iccidsWithData = allIccids.filter(iccid =>
      allCalculatedValues[iccid] && Object.keys(allCalculatedValues[iccid]).length > 0
    );

    if (iccidsWithData.length === 0) {
      console.log("No data to export");
      return;
    }

    const progressiveTotals: Record<string, number> = {};
    iccidsWithData.forEach(iccid => {
      const iccidDates = Object.keys(allCalculatedValues[iccid] || {}).sort();
      progressiveTotals[iccid] = iccidDates.reduce((total, date, dateIndex) => {
        const currentDaySum = hours
          .filter(hour => hour >= '06')
          .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0), 0);

        const nextDate = iccidDates[dateIndex + 1];
        const nextDaySum = nextDate
          ? hours
            .filter(hour => hour <= '05')
            .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0), 0)
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
          .filter(hour => hour >= '06')
          .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0), 0);

        const nextDate = iccidDates[dateIndex + 1];
        const nextDaySum = nextDate
          ? hours
            .filter(hour => hour <= '05')
            .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0), 0)
          : 0;

        const dayTotal = currentDaySum + nextDaySum;

        const row = [
          iccid,
          date,
          ...hours.map(hour => allCalculatedValues[iccid]?.[date]?.[hour]?.toFixed(4) || '0.0000'),
          dayTotal.toFixed(4)
        ];
        rows.push(row);
      });

      rows.push([
        iccid,
        "Progressive Total",
        ...hours.map(() => ""),
        progressiveTotals[iccid]?.toFixed(4) || '0.0000'
      ]);
    });

    rows.push(Array(header.length).fill(""));
    const grandTotal = Object.values(progressiveTotals).reduce((sum, total) => sum + total, 0);
    rows.push([
      "ALL ICCIDS",
      "GRAND TOTAL",
      ...hours.map(() => ""),
      grandTotal.toFixed(4)
    ]);

    let csvContent = [
      `SEP=,`,
      header.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    csvContent = csvContent.replace(
      new RegExp(`"${Array(header.length).fill('""').join(',')}"`, 'g'),
      Array(header.length).fill('" "').join(',') + ',@style=background:#f0f0f0'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

    const dayData = iccidRuntimes.find(day => day.date !== null && day.date === exportDate);
    if (!dayData) {
      setMessage(`No data found for the selected date`);
      setShow(true);
      setSuccessful(false);
      return;
    }

    const header = ["ICCID", "Hour", "Runtime", "Input Value", "Calculated Value"];
    const rows: string[][] = [];

    allIccids.forEach((iccid, index) => {
      const scale = dayData.scales.find(s => s.iccid === iccid);
      if (!scale) return;

      if (index > 0) {
        rows.push(["", "", "", "", ""]);
      }

      hours.forEach(hour => {
        const runtime = scale.runtime.find(r => r.hour === hour)?.totalDeltaSum || 0;
        const inputVal = allInputValues[iccid]?.[exportDate]?.[hour] || '';
        const calculatedVal = allCalculatedValues[iccid]?.[exportDate]?.[hour] || 0;

        rows.push([
          iccid,
          hour,
          runtime.toFixed(4),
          inputVal,
          calculatedVal.toFixed(4)
        ]);
      });
    });

    let csvContent = [`SEP=,`, header.join(","), ...rows.map(row => row.join(","))].join("\n");
    csvContent = csvContent.replace(
      /"","","","",""/g,
      '" "," "," "," "," ",@style=background:#f0f0f0'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

    const header = ["ICCID", "Date", "Hour", "Runtime", "Input Value", "Calculated Value"];
    const rows: string[][] = [];

    allIccids.forEach((iccid, index) => {
      iccidRuntimes.filter(hasValidDate).forEach(dayData => {
        const scale = dayData.scales.find(s => s.iccid === iccid);
        if (!scale) return;

        if (index > 0) {
          rows.push(["", "", "", "", ""]);
        }

        const dayDate = new Date(dayData.date);
        if (isNaN(dayDate.getTime())) {
          console.error('Invalid date in dayData:', dayData.date);
          return;
        }

        dayDate.setHours(0, 0, 0, 0);

        scale.runtime.forEach(runtime => {
          const hourValue = runtime.hour.includes(':')
            ? parseInt(runtime.hour.split(':')[0], 10)
            : parseInt(runtime.hour, 10);

          if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) {
            console.error('Invalid hour value:', runtime.hour);
            return;
          }

          const entryDate = new Date(dayDate);
          entryDate.setHours(hourValue, 0, 0, 0);

          if (entryDate >= startDate && entryDate <= endDate) {
            const inputVal = allInputValues[iccid]?.[dayData.date]?.[runtime.hour] || '';
            const calculatedVal = allCalculatedValues[iccid]?.[dayData.date]?.[runtime.hour] || 0;

            rows.push([
              iccid,
              dayData.date,
              hourValue.toString().padStart(2, '0'),
              runtime.totalDeltaSum.toFixed(4),
              inputVal,
              calculatedVal.toFixed(4)
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

    let csvContent = [`SEP=,`, header.join(","), ...rows.map(row => row.join(","))].join("\n");
    csvContent = csvContent.replace(
      /"","","","",""/g,
      '" "," "," "," "," ",@style=background:#f0f0f0'
    );

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dashboardname}_Shift_Export_${startDate.toLocaleString().replace(/[/:, ]/g, '_')}_to_${endDate.toLocaleString().replace(/[/:, ]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const AllIccidsPurpleFigures = () => {
    const iccidsWithData = allIccids.filter(iccid =>
      allCalculatedValues[iccid] && Object.keys(allCalculatedValues[iccid]).length > 0
    );

    const progressiveTotals: Record<string, number> = {};
    iccidsWithData.forEach(iccid => {
      const iccidDates = Object.keys(allCalculatedValues[iccid] || {}).sort();
      progressiveTotals[iccid] = iccidDates.reduce((total, date, dateIndex) => {
        const currentDaySum = hours
          .filter(hour => hour >= '06')
          .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0), 0);

        const nextDate = iccidDates[dateIndex + 1];
        const nextDaySum = nextDate
          ? hours
            .filter(hour => hour <= '05')
            .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0), 0)
          : 0;

        return total + currentDaySum + nextDaySum;
      }, 0);
    });

    if (iccidsWithData.length === 0) {
      return (
        <div className="border rounded-lg overflow-hidden mt-8 p-4 text-center">
          <div className="bg-purple-500 font-bold px-4 py-2 text-white">
            ALL ICCIDS PURPLE FIGURES
          </div>
          <p className="py-4">No calculated data available. Please calculate for ICCIDs first.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden mt-8">
        <div className="bg-purple-500 font-bold px-4 py-2 text-white text-center">
          ALL ICCIDS PURPLE FIGURES
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-gray-100">
              <TableRow>
                <TableHead className="w-[120px]">ICCID</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
                {hours.map((hour) => (
                  <TableHead key={hour} className="text-center">{hour}</TableHead>
                ))}
                <TableHead className="text-center font-bold">Day Total (06-05)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {iccidsWithData.flatMap(iccid => {
                const iccidDates = Object.keys(allCalculatedValues[iccid] || {}).sort();
                return [
                  ...iccidDates.map((date, dateIndex) => {
                    const currentDaySum = hours
                      .filter(hour => hour >= '06')
                      .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0), 0);

                    const nextDate = iccidDates[dateIndex + 1];
                    const nextDaySum = nextDate
                      ? hours
                        .filter(hour => hour <= '05')
                        .reduce((sum, hour) => sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0), 0)
                      : 0;

                    const dayTotal = currentDaySum + nextDaySum;

                    return (
                      <TableRow key={`${iccid}-${date}`}>
                        <TableCell className="font-medium">{iccid}</TableCell>
                        <TableCell className="font-medium">{date}</TableCell>
                        {hours.map((hour) => (
                          <TableCell key={`${iccid}-${date}-${hour}`} className="text-center text-purple-700 font-bold">
                            {allCalculatedValues[iccid]?.[date]?.[hour]?.toFixed(4) || '0.0000'}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-purple-400">
                          {dayTotal.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    );
                  }),
                  <TableRow key={`${iccid}-total`} className="bg-purple-50">
                    <TableCell colSpan={hours.length + 2} className="font-bold text-right pr-10 bg-slate-500">
                      Progressive Total for {iccid}:
                    </TableCell>
                    <TableCell className="text-center font-bold bg-purple-400">
                      {progressiveTotals[iccid]?.toFixed(4) || '0.0000'}
                    </TableCell>
                  </TableRow>
                ];
              })}
              <TableRow className="bg-purple-100">
                <TableCell colSpan={hours.length + 2} className="font-bold text-right pr-10 bg-slate-500">
                  GRAND TOTAL:
                </TableCell>
                <TableCell className="text-center font-bold bg-purple-400">
                  {Object.values(progressiveTotals).reduce((sum, total) => sum + total, 0).toFixed(4)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Auto-fill logic
  useEffect(() => {
    if (autoFillMode) {
      const newInputValues = JSON.parse(JSON.stringify(inputValues));
      let madeChanges = false;

      if (autoFillMode === 'right' || autoFillMode === 'all') {
        dates.forEach(date => {
          const hoursWithValues = hours.filter(hour => newInputValues[date]?.[hour]);
          if (hoursWithValues.length > 0) {
            const lastHourWithValue = hoursWithValues[hoursWithValues.length - 1];
            const lastValue = newInputValues[date][lastHourWithValue];
            const lastHourIndex = hours.indexOf(lastHourWithValue);

            for (let i = lastHourIndex + 1; i < hours.length; i++) {
              const hour = hours[i];
              if (!newInputValues[date]?.[hour]) {
                if (!newInputValues[date]) newInputValues[date] = {};
                newInputValues[date][hour] = lastValue;
                madeChanges = true;
              }
            }
          }
        });
      }

      if (autoFillMode === 'below' || autoFillMode === 'all') {
        hours.forEach(hour => {
          const datesWithValues = dates.filter(date => newInputValues[date]?.[hour]);
          if (datesWithValues.length > 0) {
            const lastDateWithValue = datesWithValues[datesWithValues.length - 1];
            const lastValue = newInputValues[lastDateWithValue][hour];
            const lastDateIndex = dates.indexOf(lastDateWithValue);

            for (let i = lastDateIndex + 1; i < dates.length; i++) {
              const date = dates[i];
              if (!newInputValues[date]?.[hour]) {
                if (!newInputValues[date]) newInputValues[date] = {};
                newInputValues[date][hour] = lastValue;
                madeChanges = true;
              }
            }
          }
        });
      }

      if (madeChanges) {
        setInputValues(newInputValues);
        saveToHistory(newInputValues);
        setLastAction('auto-fill');
      }
      setAutoFillMode(null);
    }
  }, [autoFillMode]);

  return (
    <div className="space-y-8" ref={tableRef} onMouseUp={handleMouseUp}>
      {show && <ResponseModal successful={successful} message={message} setShow={setShow} />}
      {/* Control Buttons */}
      <div className="flex items-center justify-between bg-slate-500 p-1">
        <Button variant="outline" size="sm" onClick={handlePrevious} className='bg-slate-500' disabled={allIccids.length <= 1}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="text-sm font-medium text-white">RUN TIME & INPUT TABLE</div>
        <div className="text-sm font-medium text-white">ICCID : {currentIccid} ({currentIccidIndex + 1} of {allIccids.length})</div>
        <Button
          onClick={() => setViewMode(prev => prev === 'single' ? 'all' : 'single')}
          className="bg-indigo-600 text-white"
        >
          {viewMode === 'single' ? 'View All ICCIDs' : 'View Single ICCID'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={allIccids.length <= 1} className='bg-slate-500'>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Runtime Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-500 font-bold px-4 py-2 text-white text-center">RUN TIME TABLE</div>
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              {hours.map((hour) => (
                <TableHead key={hour} className="text-center">{hour}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dates.map((date) => (
              <TableRow key={date}>
                <TableCell className="font-medium">{date}</TableCell>
                {hours.map((hour) => (
                  <TableCell key={`${date}-${hour}`} className="text-center">
                    {typeof dateToHourValues[date]?.[hour] === "number" ? dateToHourValues[date][hour].toFixed(4) : ' '}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Input Table */}
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
            <span className='text-white'>INPUT TABLE</span>
          </div>
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-orange-600 text-white">
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
              onClick={() => setAutoFillMode('right')}
              className="bg-slate-500 text-white"
              variant="outline"
              size="sm"
            >
              Fill Right
            </Button>
            <Button
              onClick={() => setAutoFillMode('below')}
              className="bg-slate-500 text-white"
              variant="outline"
              size="sm"
            >
              Fill Below
            </Button>
            <Button
              onClick={() => setAutoFillMode('all')}
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
                Save to DB
              </Button>
            ) : (
              <Button
                onClick={() => handleSaveToDB()}
                className="bg-blue-600 text-white"
              >
                <Save />
                Save to DB
              </Button>
            )}
            <Button
              onClick={viewMode === 'single' ? handleCalculate : handleCalculateAll}
              className="bg-purple-600 text-white"
            >
              {loadinbtn ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : null}
              {viewMode === 'single' ? 'Calculate' : 'Calculate All'}
            </Button>
          </div>
        </div>
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              {hours.map((hour) => (
                <TableHead key={hour} className="text-center">{hour}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dates.map((date) => (
              <TableRow key={date}>
                <TableCell className="font-medium">{date}</TableCell>
                {hours.map((hour) => {
                  const isSelected = isCellSelected(date, hour);
                  const isAutoFilled = lastAction === 'auto-fill' &&
                    inputValues[date]?.[hour] &&
                    !history[historyIndex - 1]?.[date]?.[hour];

                  return (
                    <TableCell
                      key={`${date}-${hour}`}
                      className={`text-center ${isSelected ? 'bg-blue-200' : ''}`}
                      onMouseDown={() => handleCellMouseDown(date, hour)}
                      onMouseEnter={() => handleCellMouseEnter(date, hour)}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        value={inputValues[date]?.[hour] ?? ''}
                        onChange={(e) => handleInputChange(date, hour, e.target.value)}
                        className={`w-20 text-center p-1 text-sm border rounded-md ${isAutoFilled ? 'bg-green-100' : 'bg-gray-500'} ${isSelected ? 'ring-2 ring-blue-200' : ''}`}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Purple Figures Table */}
      {viewMode === 'single' ? (
        <>
          {Object.keys(calculatedValues).length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-purple-500 font-bold px-4 py-2 text-white text-center">PURPLE FIGURES TABLE</div>
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    {hours.map((hour) => (
                      <TableHead key={hour} className="text-center">{hour}</TableHead>
                    ))}
                    <TableHead className="text-center font-bold">Day Total (06-05)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dates.map((date, dateIndex) => {
                    const currentDaySum = hours
                      .filter(hour => hour >= '06')
                      .reduce((sum, hour) => sum + (calculatedValues[date]?.[hour] || 0), 0);

                    const nextDate = dates[dateIndex + 1];
                    const nextDaySum = nextDate
                      ? hours
                        .filter(hour => hour <= '05')
                        .reduce((sum, hour) => sum + (calculatedValues[nextDate]?.[hour] || 0), 0)
                      : 0;

                    const dayTotal = currentDaySum + nextDaySum;

                    return (
                      <TableRow key={date}>
                        <TableCell className="font-medium">{date}</TableCell>
                        {hours.map((hour) => (
                          <TableCell key={`${date}-${hour}`} className="text-center text-purple-700 font-bold">
                            {calculatedValues[date]?.[hour]?.toFixed(4) || ' '}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-purple-400">
                          {dayTotal.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-purple-100">
                    <TableCell colSpan={hours.length + 1} className="font-bold text-right pr-10 bg-slate-400">
                      Progressive Total (06-05):
                    </TableCell>
                    <TableCell className="text-center font-bold bg-purple-400">
                      {dates.reduce((totalSum, date, dateIndex) => {
                        const current = hours
                          .filter(hour => hour >= '06')
                          .reduce((sum, hour) => sum + (calculatedValues[date]?.[hour] || 0), 0);

                        const nextDate = dates[dateIndex + 1];
                        const next = nextDate
                          ? hours
                            .filter(hour => hour <= '05')
                            .reduce((sum, hour) => sum + (calculatedValues[nextDate]?.[hour] || 0), 0)
                          : 0;

                        return totalSum + current + next;
                      }, 0).toFixed(4)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <AllIccidsPurpleFigures />
      )}

      {/* Export Section */}
      <div className="mx-4 mt-4 space-y-4">
        <div className="flex space-x-4">
          <Button
            onClick={viewMode === 'single' ? exportToCSV : exportAllToCSV}
            className="bg-slate-400 text-white"
          >
            Export total Period
          </Button>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={exportPerDay}
            className="bg-slate-500 text-white"
          >
            Export per Day
          </Button>
          <div className="w-400">
            <Label htmlFor="export-date" className='mr-1'>Day</Label>
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
          <Button
            onClick={exportPerShift}
            className="bg-slate-600 text-white"
          >
            Export per Shift
          </Button>
          <div className="w-400">
            <Label htmlFor="shift-start" className='mr-1'>Shift Start</Label>
            <input
              type="datetime-local"
              id="shift-start"
              value={shiftStart ? shiftStart.replace(/:..$/, ":00") : ''}
              onChange={handleShiftStartChange}
              className="border rounded p-2"
              step="3600"
            />
          </div>
          <div className="w-400">
            <Label htmlFor="shift-end" className='mr-1'>Shift End</Label>
            <input
              type="datetime-local"
              id="shift-end"
              value={shiftEnd ? shiftEnd.replace(/:..$/, ":00") : ''}
              onChange={handleShiftEndChange}
              className="border rounded p-2"
              step="3600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuntimeTableTest;

function hasValidDate(dayData: RuntimesAudit): dayData is RuntimesAudit & { date: string } {
  return dayData.date !== null;
}