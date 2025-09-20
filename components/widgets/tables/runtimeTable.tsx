import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { client } from "@/service/schemaClient";
import ResponseModal from "../response";
import DashboardDateSelector from "../requery_audit";
import { runauditDateReport } from "@/app/api/audit.route";
import { CellSelection, RuntimeData, RuntimeTableProps } from "@/types/runtime";
import { getDatesBetween, normalize } from "@/utils/runtimeUtils";
import { FlowTable } from "./flowTable";
import { AllIccidsPurpleFigures, SinglePurpleFigures } from "./purpleTable";
import { Allexports } from "@/components/RuntimeTable/SubComponents";
import { InputTable } from "./inputTable";

const RuntimeTable = ({ iccidRuntimes, daterange }: RuntimeTableProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const dashboardname = decodeURIComponent(params.name as string).toUpperCase();

  const queryDates = getDatesBetween(daterange.startDate, daterange.endDate);

  const allIccids = Array.from(
    new Set(
      iccidRuntimes.flatMap((day) => day.scales.map((scale) => scale.iccid)),
    ),
  );

  const [loadinbtnRequery, setLoadingRequeryBtn] = useState(false);
  const [loadinbtn, setLoadingBtn] = useState(false);
  const [loadinbtn2, setLoadingBtn2] = useState(false);

  const [viewMode, setViewMode] = useState<"single" | "all">("single");
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const [currentIccidIndex, setCurrentIccidIndex] = useState(0);
  const [inputValues, setInputValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [calculatedValues, setCalculatedValues] = useState<
    Record<string, Record<string, number>>
  >({});
  const [autoFillMode, setAutoFillMode] = useState<
    "right" | "below" | "all" | null
  >(null);
  const [history, setHistory] = useState<
    Record<string, Record<string, string>>[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cellSelection, setCellSelection] = useState<CellSelection>({
    start: null,
    end: null,
    active: false,
  });
  const [lastAction, setLastAction] = useState<
    "manual" | "auto-fill" | "preset" | "bulk"
  >("manual");
  const [allInputValues, setAllInputValues] = useState<
    Record<string, Record<string, Record<string, string>>>
  >({});
  const [allCalculatedValues, setAllCalculatedValues] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [hasCalculated, setHasCalculated] = useState(false); // Track if calculation has been done

  const tableRef = useRef<HTMLDivElement>(null);
  const currentIccid = allIccids[currentIccidIndex];
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  // Fetch site table values
  const getSiteTableValues = async (siteId: string) => {
    try {
      const { data: inputvalues, errors } = await client.models.InputTable.listInputTableBySiteIdAndRowdate({
          siteId: siteId ,
          rowdate: { between: [daterange.startDate, daterange.endDate] }
      });
      
      console.log(inputValues);

      if (errors) {
        console.error("Error fetching site:", errors);
        setMessage(`Error fetching site: ${errors}`);
        setShow(true);
        setSuccessful(false);
        return [];
      }

      return inputvalues.map((inputvalue) => {
        let parsedInputValues: Record<string, string> = {};
        try {
          if (typeof inputvalue.inputValues === "string") {
            const clean = inputvalue.inputValues
              .replace(/\\"/g, '"')
              .replace(/^"+|"+$/g, "");
            const parsed = JSON.parse(clean);
            // Ensure it's a Record<string, string>
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              parsedInputValues = parsed;
            }
          } else if (inputvalue.inputValues && typeof inputvalue.inputValues === "object" && !Array.isArray(inputvalue.inputValues)) {
            parsedInputValues = inputvalue.inputValues as Record<string, string>;
          }
        } catch (error) {
          parsedInputValues = {};
        }
        return {
          id: inputvalue.siteId,
          iccid: inputvalue.iccid,
          rowdate: inputvalue.rowdate,
          inputValues: parsedInputValues,
        };
      });
    } catch (error) {
      console.error("Error in getSiteTableValues:", error);
      return [];
    }
  };

  // Fetch purple figures values
  const getPurpleTableValues = async (siteId: string) => {
    try {
      const { data: purplevalues, errors } =
        await client.models.Purplefigures.listPurplefiguresBySiteIdAndDate({
          siteId: siteId,
          date: { between: [daterange.startDate, daterange.endDate] },
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
  const fetchInputValues = useCallback(async () => {
    try {
      const [iccidInputValues, iccidPurpleValues] = await Promise.all([
        getSiteTableValues(id),
        getPurpleTableValues(id),
      ]);

      const loadedInputValues: Record<
        string,
        Record<string, Record<string, string>>
      > = {};
      const loadedPurpleValues: Record<
        string,
        Record<string, Record<string, number>>
      > = iccidPurpleValues;

      // Process input values
      iccidInputValues.forEach((entry: any) => {
        // Handle data JSON field
        if (entry.data && Array.isArray(entry.data)) {
          entry.data.forEach((item: any) => {
            const iccid = item.iccid;
            if (!loadedInputValues[iccid]) {
              loadedInputValues[iccid] = {};
            }

            if (item.inputValues && typeof item.inputValues === "object") {
              Object.entries(item.inputValues).forEach(([date, hourValues]) => {
                if (!loadedInputValues[iccid][date]) {
                  loadedInputValues[iccid][date] = {};
                }

                if (hourValues && typeof hourValues === "object") {
                  Object.entries(hourValues as Record<string, string>).forEach(
                    ([hour, value]) => {
                      if (
                        !loadedInputValues[iccid][date][hour] ||
                        loadedInputValues[iccid][date][hour] === ""
                      ) {
                        loadedInputValues[iccid][date][hour] = value;
                      }
                    },
                  );
                }
              });
            }
          });
        }
      });

      // Update states
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
        (key) => normalize(key) === normalizedCurrent,
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

  // Fetch data on mount and when id or selectedDate changes
  useEffect(() => {
    fetchInputValues();
  }, [id, selectedDate, fetchInputValues]);

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

  // Generate date-hour values mapping
  const dateToHourValues = iccidRuntimes.reduce(
    (acc, dayData) => {
      const date = dayData.date;
      if (!date) return acc;

      const scale = dayData.scales.find((s) => s.iccid === currentIccid);
      if (!scale) return acc;

      if (!acc[date]) {
        acc[date] = {};
      }

      scale.runtime
        .filter(
          (r): r is RuntimeData =>
            typeof r.totalDeltaSum === "number" && !isNaN(r.totalDeltaSum),
        )
        .forEach(({ hour, totalDeltaSum }) => {
          const current = acc[date][hour];
          if (current === undefined) {
            acc[date][hour] = totalDeltaSum;
          }
        });

      return acc;
    },
    {} as Record<string, Record<string, number>>,
  );

  const dates = Object.keys(dateToHourValues);

  const saveToHistory = (
    currentState: Record<string, Record<string, string>>,
  ) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentState)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleCalculate = () => {
    setLoadingBtn(true);
    const result: Record<string, Record<string, number>> = {};

    for (const date of dates) {
      result[date] = {};
      for (const hour of hours) {
        const runtimeVal = dateToHourValues[date]?.[hour];
        const inputVal = inputValues[date]?.[hour];

        const parsedInput = parseFloat(inputVal || "0") || 0;
        const multiplier = inputVal === "" ? 0 : parsedInput;
        const value =
          typeof runtimeVal === "number" ? runtimeVal * multiplier : 0;

        result[date][hour] = value;
      }
    }

    // Update both calculated values and preserve input values
    setCalculatedValues(result);
    setAllCalculatedValues((prev) => ({
      ...prev,
      [currentIccid]: result,
    }));

    // Ensure input values are preserved in the allInputValues state
    setAllInputValues((prev) => ({
      ...prev,
      [currentIccid]: inputValues,
    }));

    // Enable save button after calculation
    setHasCalculated(true);
    setLoadingBtn(false);
  };

  const handleCalculateAll = () => {
    setLoadingBtn(true);

    const allResults: Record<
      string,
      Record<string, Record<string, number>>
    > = {};

    allIccids.forEach((iccid) => {
      const normalizedIccid = normalize(iccid);
      const matchedKey = Object.keys(allInputValues).find(
        (key) => normalize(key) === normalizedIccid,
      );

      if (!matchedKey) return;

      const iccidRuntimeData = iccidRuntimes.reduce(
        (acc, dayData) => {
          if (!dayData.date) return acc;
          const scale = dayData.scales.find((s) => s.iccid === iccid);
          if (!scale) return acc;

          const hourMap = scale.runtime.reduce(
            (hourAcc, runtime) => {
              hourAcc[runtime.hour] = runtime.totalDeltaSum;
              return hourAcc;
            },
            {} as Record<string, number>,
          );

          acc[dayData.date] = hourMap;
          return acc;
        },
        {} as Record<string, Record<string, number>>,
      );

      const iccidDates = Object.keys(iccidRuntimeData);

      allResults[iccid] = {};

      iccidDates.forEach((date) => {
        allResults[iccid][date] = {};
        hours.forEach((hour) => {
          const runtimeVal = iccidRuntimeData[date]?.[hour];
          const inputVal = allInputValues[matchedKey]?.[date]?.[hour] || "0";

          const parsedInput = parseFloat(inputVal) || 0;
          const multiplier = inputVal === "" ? 0 : parsedInput;
          const value =
            typeof runtimeVal === "number" ? runtimeVal * multiplier : 0;

          allResults[iccid][date][hour] = value;
        });
      });
    });

    setAllCalculatedValues(allResults);
    // Enable save button after calculation
    setHasCalculated(true);
    setLoadingBtn(false);
  };

  const handleMouseUp = () => {
    if (cellSelection.active) {
      setCellSelection((prev) => ({ ...prev, active: false }));
      if (isSelectionActive()) {
        saveToHistory(inputValues);
      }
    }
  };

  const isSelectionActive = () => {
    return (
      cellSelection.start &&
      cellSelection.end &&
      (cellSelection.start.date !== cellSelection.end.date ||
        cellSelection.start.hour !== cellSelection.end.hour)
    );
  };

  const handleNext = () => {
    setCurrentIccidIndex((prev) => (prev + 1) % allIccids.length);
  };

  const handlePrevious = () => {
    setCurrentIccidIndex(
      (prev) => (prev - 1 + allIccids.length) % allIccids.length,
    );
  };

  const handleRequery = async () => {
    try {
      setLoadingRequeryBtn(true);

      const index = queryDates.findIndex((date) => date === selectedDate);

      let isdateLast = false;
      if (queryDates.length - 1 === index) {
        isdateLast = true;
      }

      const dateToRequery = selectedDate;
      if (!dateToRequery) {
        setMessage("Please select a date first");
        setShow(true);
        setSuccessful(false);
        setLoadingRequeryBtn(false);
        return;
      }

      // List and delete existing records
      const { data: recordsToDelete, errors } =
        await client.models.AuditorReports.listAuditorReportsBySiteIdAndDate({
          siteId: id,
          date: { eq: dateToRequery },
        });

      if (errors) {
        throw new Error(
          `Failed to fetch records: ${errors[0]?.message || "Unknown error"}`,
        );
      }

      // Delete all matching records if any exist
      if (recordsToDelete?.length) {
        await Promise.all(
          recordsToDelete.map((record) =>
            client.models.AuditorReports.delete({ id: record.id }),
          ),
        );
      }

      // Run new audit report
      const auditdate = await runauditDateReport(id, dateToRequery, isdateLast);

      // Refresh the data
      await fetchInputValues();

      // Recalculate based on view mode
      if (viewMode === "single") {
        handleCalculate();
      } else {
        handleCalculateAll();
      }

      setMessage("Data updated. Requery to fetch new data");
      setShow(true);
      setSuccessful(true);
    } catch (error) {
      console.error("Requery error:", error);
      setMessage(`Failed to requery data: ${error}`);
      setShow(true);
      setSuccessful(false);
    } finally {
      setLoadingBtn(false);
    }
  };

  // Auto-fill logic
  useEffect(() => {
    if (autoFillMode) {
      const newInputValues = JSON.parse(JSON.stringify(inputValues));
      let madeChanges = false;

      if (autoFillMode === "right" || autoFillMode === "all") {
        dates.forEach((date) => {
          const hoursWithValues = hours.filter(
            (hour) => newInputValues[date]?.[hour],
          );
          if (hoursWithValues.length > 0) {
            const lastHourWithValue =
              hoursWithValues[hoursWithValues.length - 1];
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

      if (autoFillMode === "below" || autoFillMode === "all") {
        hours.forEach((hour) => {
          const datesWithValues = dates.filter(
            (date) => newInputValues[date]?.[hour],
          );
          if (datesWithValues.length > 0) {
            const lastDateWithValue =
              datesWithValues[datesWithValues.length - 1];
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
        setLastAction("auto-fill");
      }
      setAutoFillMode(null);
    }
  }, [autoFillMode]);

  return (
    <div className="space-y-8" ref={tableRef} onMouseUp={handleMouseUp}>
      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}
      {/* Control Buttons */}
      <div className="flex items-center justify-between bg-slate-500 p-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="bg-slate-500"
          disabled={allIccids.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <DashboardDateSelector
          dates={queryDates}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onRequery={handleRequery}
          isLoading={loadinbtnRequery}
        />
        <div className="text-sm font-medium text-white">
          RUN TIME & INPUT TABLE
        </div>
        <div className="text-sm font-medium text-white">
          ICCID : {currentIccid} ({currentIccidIndex + 1} of {allIccids.length})
        </div>
        <Button
          onClick={() =>
            setViewMode((prev) => (prev === "single" ? "all" : "single"))
          }
          className="bg-indigo-600 text-white"
        >
          {viewMode === "single" ? "View All ICCIDs" : "View Single ICCID"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={allIccids.length <= 1}
          className="bg-slate-500"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Runtime Table */}
      <FlowTable
        hours={hours}
        dates={dates}
        dateToHourValues={dateToHourValues}
      />

      {/* Input Table */}
      <InputTable
        viewMode={viewMode}
        lastAction={lastAction}
        cellSelection={cellSelection}
        dates={dates}
        hours={hours}
        allIccids={allIccids}
        historyIndex={historyIndex}
        currentIccid={currentIccid}
        id={id}
        loadinbtn2={loadinbtn2}
        loadinbtn={loadinbtn}
        hasCalculated={hasCalculated}
        inputValues={inputValues}
        allCalculatedValues={allCalculatedValues}
        allInputValues={allInputValues}
        history={history}
        handleCalculate={handleCalculate}
        handleCalculateAll={handleCalculateAll}
        setMessage={setMessage}
        setShow={setShow}
        setSuccessful={setSuccessful}
        setHasCalculated={setHasCalculated}
        setLoadingBtn2={setLoadingBtn2}
        setAllInputValues={setAllInputValues}
        setHistoryIndex={setHistoryIndex}
        setInputValues={setInputValues}
        setLastAction={setLastAction}
        setAutoFillMode={setAutoFillMode}
        saveToHistory={saveToHistory}
        isSelectionActive={isSelectionActive}
        setCellSelection={setCellSelection}
      />

      {/* Purple Figures Table */}
      {viewMode === "single" ? (
        <SinglePurpleFigures
          hours={hours}
          dates={dates}
          allCalculatedValues={allCalculatedValues}
          calculatedValues={calculatedValues}
        />
      ) : (
        <AllIccidsPurpleFigures
          hours={hours}
          allCalculatedValues={allCalculatedValues}
          allIccids={allIccids}
        />
      )}

      {/* Export Input & Purple figures Section */}
      <Allexports
        viewMode={viewMode}
        currentIccid={currentIccid}
        allIccids={allIccids}
        dates={dates}
        dashboardname={dashboardname}
        hours={hours}
        inputValues={inputValues}
        allInputValues={allInputValues}
        calculatedValues={calculatedValues}
        allCalculatedValues={allCalculatedValues}
        setMessage={setMessage}
        setShow={setShow}
        setSuccessful={setSuccessful}
        iccidRuntimes={iccidRuntimes}
      />
    </div>
  );
};

export default RuntimeTable;
