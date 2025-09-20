import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

import { MassrunShiftReport } from "@/app/api/shiftreports.route";

interface StopTimesState {
  dayStop: string[];
  nightStop: string[];
  extraStop: string[];
}

export function SiteControls({ stopTimes }: { stopTimes: StopTimesState }) {
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reportType, setReportType] = useState<"day" | "night" | "extra">(
    "day",
  );
  const [siteStatus, setSiteStatus] = useState<"test" | "prod">("test");
  const [isLoading, setIsLoading] = useState(false);

  const handleRunReport = async () => {
    setIsLoading(true);
    try {
      // simulate 2 min delay
      await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));

      await MassrunShiftReport(
        selectedTime as string,
        reportType as string,
        siteStatus as string,
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTimes = () => {
    switch (reportType) {
      case "day":
        return stopTimes.dayStop;
      case "night":
        return stopTimes.nightStop;
      case "extra":
        return stopTimes.extraStop;
      default:
        return [];
    }
  };

  const availableTimes = getAvailableTimes();

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      {/* Report Type Radio */}
      <div className="flex flex-col gap-2 min-w-[120px]">
        <Label className="text-sm font-medium">Report Type</Label>
        <RadioGroup
          value={reportType}
          onValueChange={(value: "day" | "night" | "extra") =>
            setReportType(value)
          }
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="day" id="day" />
            <Label htmlFor="day" className="text-sm cursor-pointer">
              Day
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="night" id="night" />
            <Label htmlFor="night" className="text-sm cursor-pointer">
              Night
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="extra"
              id="extra"
              disabled={stopTimes.extraStop.length === 0}
            />
            <Label
              htmlFor="extra"
              className={`text-sm cursor-pointer ${stopTimes.extraStop.length === 0 ? "text-muted-foreground" : ""}`}
            >
              Extra
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Time Selector */}
      <div className="flex flex-col gap-2 min-w-[140px]">
        <Label className="text-sm font-medium">Stop Time</Label>
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {availableTimes.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
            {availableTimes.length === 0 && (
              <SelectItem value="none" disabled>
                No times available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Status Radio */}
      <div className="flex flex-col gap-2 min-w-[100px]">
        <Label className="text-sm font-medium">Environment</Label>
        <RadioGroup
          value={siteStatus}
          onValueChange={(value: "test" | "prod") => setSiteStatus(value)}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="test" id="test" />
            <Label htmlFor="test" className="text-sm cursor-pointer">
              Test
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="prod" id="prod" />
            <Label htmlFor="prod" className="text-sm cursor-pointer">
              Prod
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Run Buttons */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium opacity-0">Run</Label>
        <div className="flex gap-2">
          {siteStatus === "test" && (
            <Button
              onClick={handleRunReport}
              disabled={
                !selectedTime || availableTimes.length === 0 || isLoading
              }
              size="sm"
              variant="default"
              className="gap-1 h-9"
            >
              Run Dev
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </Button>
          )}
          {siteStatus === "prod" && (
            <Button
              onClick={handleRunReport}
              disabled={
                !selectedTime || availableTimes.length === 0 || isLoading
              }
              size="sm"
              variant="default"
              className="gap-1 h-9"
            >
              Run Prod
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 min-w-[80px]">
        <Badge
          variant={siteStatus === "prod" ? "default" : "secondary"}
          className="capitalize"
        >
          {siteStatus}
        </Badge>
      </div>
    </div>
  );
}
