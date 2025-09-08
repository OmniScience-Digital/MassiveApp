"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dayjs from "dayjs";

const times = Array.from({ length: 24 * 4 }, (_, i) =>
  dayjs().startOf("day").add(i * 15, "minute").format("HH:mm")
);

export default function TimeRangePicker({
  label,
  Start,
  Stop,
  onChange,
  
}: {
  label: string;
  Start: string;
  Stop: string;
  disabled?: boolean;
  onChange: (start: string, stop: string) => void;
}) {
  const [start, setStart] = useState(Start);
  const [stop, setStop] = useState(Stop);

  const handleStartChange = (value: string) => {
    setStart(value);
    onChange(value, stop);
  };

  const handleStopChange = (value: string) => {
    setStop(value);
    onChange(start, value);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-normal text-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            {start} - {stop}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 space-y-2 bg-background">
          <div className="flex justify-between space-x-2">
            <div className="w-1/2">
              <label className="text-xs text-muted-foreground">Start Time</label>
              <Select onValueChange={handleStartChange} defaultValue={start}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {times.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-1/2">
              <label className="text-xs  text-muted-foreground">End Time</label>
              <Select onValueChange={handleStopChange} defaultValue={stop}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {times.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
