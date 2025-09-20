"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";

const years = Array.from({ length: 50 }, (_, i) => dayjs().year() - i); // Last 50 years
const months = Array.from({ length: 12 }, (_, i) =>
  dayjs().month(i).format("MMMM"),
); // Month names

const DatePicker = ({
  date,
  setDate,
  title,
}: {
  date: string;
  title: string;
  setDate: (value: string) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState(dayjs(date));

  const handleYearChange = (year: string) => {
    setSelectedDate((prev) => prev.year(Number(year)));
  };

  const handleMonthChange = (month: string) => {
    const newDate = dayjs(selectedDate).month(months.indexOf(month));

    setSelectedDate(newDate);
    setDate(newDate.format("YYYY-MM-DD"));
  };

  const handleDayChange = (day: Date | undefined) => {
    if (day) {
      setSelectedDate(dayjs(day));
      setDate(dayjs(day).format("YYYY-MM-DD"));
    }
  };

  return (
    <div className="w-full space-y-2">
      <Label className="text-sm font-normal text-foreground">{title}</Label>
      <div className="flex items-center gap-2">
        {/* Year Selector */}
        <Select
          onValueChange={handleYearChange}
          defaultValue={selectedDate.year().toString()}
        >
          <SelectTrigger className="w-[100px] font-normal">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="w-[120px] font-normal">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month Selector */}
        <Select
          onValueChange={handleMonthChange}
          defaultValue={months[selectedDate.month()]}
        >
          <SelectTrigger className="w-[120px] font-normal">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="w-[120px] font-normal">
            {months.map((month, index) => (
              <SelectItem key={index} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day Picker (Calendar) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left  font-normal"
          >
            {selectedDate.format("YYYY-MM-DD")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Calendar
            mode="single"
            selected={selectedDate.toDate()}
            onSelect={handleDayChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
