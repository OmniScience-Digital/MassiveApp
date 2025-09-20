"use client";

import React, { useEffect, useState } from "react";
import { Loader2, SaveAllIcon } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { updateSiteTimesById } from "@/service/updateTimes.Service";
import { Switch } from "@/components/ui/switch";
import GridHeader from "../GridHeader";
import DatePicker from "./date";
import TimeRangePicker from "./timepicker";
import ResponseModal from "../response";

interface TimewidgetProps {
  siteTimes_input: {
    monthstart: string;
    dayStart: string;
    dayStop: string;
    nightStart: string;
    nightStop: string;
    extraShiftStart: string;
    extraShiftStop: string;
    twentyFourhourShift?: boolean;
  };
  fetchData: () => void;
}

const Timewidget = ({ siteTimes_input, fetchData }: TimewidgetProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  // State for month start date
  const [startDay, setMonthStart] = useState(siteTimes_input.monthstart);
  const [show, setShow] = useState(false);
  const [loadinbtn, setLoadingBtn] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {}, [startDay]);

  // State for time ranges
  const [timeRanges, setTimeRanges] = useState({
    day: [siteTimes_input.dayStart, siteTimes_input.dayStop],
    night: [siteTimes_input.nightStart, siteTimes_input.nightStop],
    extraShift: [
      siteTimes_input.extraShiftStart,
      siteTimes_input.extraShiftStop,
    ],
  });

  // Check if toggle should be shown
  const show24HourToggle =
    siteTimes_input.nightStart !== siteTimes_input.nightStop;

  // State for switch
  const [is24Hour, setIs24Hour] = useState(
    siteTimes_input.twentyFourhourShift || false,
  );

  // Track previous values to detect changes
  const [previousTimeRanges, setPreviousTimeRanges] = useState(timeRanges);

  // Handle time range updates
  const handleTimeRangeChange = (
    shiftLabel: string,
    newStart: string,
    newStop: string,
  ) => {
    setTimeRanges((prevState) => {
      const updatedRanges = { ...prevState };
      if (shiftLabel === "Day Shift") {
        updatedRanges.day = [newStart, newStop];
      } else if (shiftLabel === "Night Shift") {
        updatedRanges.night = [newStart, newStop];
      } else if (shiftLabel === "Extra Shift") {
        updatedRanges.extraShift = [newStart, newStop];
      }
      return updatedRanges;
    });
  };

  const handleSave = async () => {
    try {
      setLoadingBtn(true);

      let updatedDetected = false;
      let newTimes;

      if (siteTimes_input.monthstart !== startDay) {
        updatedDetected = true;
      }

      if (
        timeRanges.day[0] !== previousTimeRanges.day[0] ||
        timeRanges.day[1] !== previousTimeRanges.day[1]
      ) {
        updatedDetected = true;
      }
      if (
        timeRanges.night[0] !== previousTimeRanges.night[0] ||
        timeRanges.night[1] !== previousTimeRanges.night[1]
      ) {
        updatedDetected = true;
      }
      if (
        timeRanges.extraShift[0] !== previousTimeRanges.extraShift[0] ||
        timeRanges.extraShift[1] !== previousTimeRanges.extraShift[1]
      ) {
        updatedDetected = true;
      }

      if (siteTimes_input.twentyFourhourShift !== is24Hour) {
        updatedDetected = true;
      }

      if (!updatedDetected) {
        setLoadingBtn(false);
        console.log("No updates detected.");
        return;
      }

      newTimes = {
        monthstart: startDay,
        dayStart: timeRanges.day[0],
        dayStop: timeRanges.day[1],
        nightStart: timeRanges.night[0],
        nightStop: timeRanges.night[1],
        extraShiftStart: timeRanges.extraShift[0],
        extraShiftStop: timeRanges.extraShift[1],
        twentyFourhourShift: is24Hour,
      };

      setPreviousTimeRanges(timeRanges);

      const updatedSite = await updateSiteTimesById(id, newTimes);
      setLoadingBtn(false);

      if (updatedSite) {
        setSuccessful(true);
        setMessage("Times updated successfully");
        setShow(true);
        fetchData();
      } else {
        setSuccessful(false);
        setMessage("Failed to update times");
        setShow(true);
      }
    } catch (error) {
      setLoadingBtn(false);
      console.error("Unexpected updating times :", error);
      return null;
    }
  };

  const timeRangesData = [
    {
      label: "Day Shift",
      start: siteTimes_input.dayStart,
      stop: siteTimes_input.dayStop,
    },
    {
      label: "Night Shift",
      start: siteTimes_input.nightStart,
      stop: siteTimes_input.nightStop,
    },
    {
      label: "Extra Shift",
      start: siteTimes_input.extraShiftStart,
      stop: siteTimes_input.extraShiftStop,
    },
  ];

  return (
    <div className="p-2 border overflow-visible h-auto w-full rounded-lg shadow-sm bg-background space-y-2">
      <GridHeader children="Site Times" />

      {show24HourToggle && (
        <div className="flex items-center justify-between p-2 border rounded-md">
          <label htmlFor="24hour-toggle" className="text-sm font-medium">
            24-Hour Operation
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <div className="flex items-center space-x-2">
              <Switch
                id="24hr-mode"
                checked={is24Hour}
                onCheckedChange={(checked) => {
                  setIs24Hour(checked);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <DatePicker date={startDay} title="Month Start" setDate={setMonthStart} />

      {timeRangesData.map((shift, index) => (
        <TimeRangePicker
          key={index}
          label={`${shift.label} Range`}
          Start={shift.start}
          Stop={shift.stop}
          onChange={(start, stop) =>
            handleTimeRangeChange(shift.label, start, stop)
          }
        />
      ))}

      {loadinbtn ? (
        <Button disabled className="w-[100%] font-normal">
          <Loader2 className="animate-spin" />
          Please wait
        </Button>
      ) : (
        <Button className="w-[100%] font-normal" onClick={handleSave}>
          <SaveAllIcon /> Save
        </Button>
      )}

      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}
    </div>
  );
};

export default Timewidget;
