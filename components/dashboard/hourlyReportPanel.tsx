"use client";

import { useState } from "react";
import { Clock, Loader2, PlayIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ResponseModal from "@/components/widgets/response";
import { runHourlyReport } from "@/app/api/shiftreports.route";
import { isShownInHourly, isShownInProgressive } from "@/lib/formulaPlacement";
import { ReportItem } from "@/types/schema";

const HOURS = Array.from(
  { length: 24 },
  (_, h) => `${String(h).padStart(2, "0")}:00`,
);

// Current date (YYYY-MM-DD) and hour in Johannesburg, independent of the browser's timezone.
const getJhbNow = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
  };
};

// "08:00" -> "07:00" (the report covers the hour BEFORE the end time)
const hourBefore = (endTime: string) =>
  `${String((Number(endTime.slice(0, 2)) + 23) % 24).padStart(2, "0")}:00`;

interface HourlyReportPanelProps {
  sitedata: ReportItem;
  formulas: ReportItem["formulas"];
}

/**
 * Hourly report tab. The hourly report is sent every hour while the site is inside a shift,
 * so it has nothing to do with the shift selector used by "Run Report" - it only needs the
 * site. "Send now" produces the report for the current hour on demand.
 */
export const HourlyReportPanel = ({
  sitedata,
  formulas,
}: HourlyReportPanelProps) => {
  const [running, setRunning] = useState(false);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"latest" | "specific">("latest");
  const [endDate, setEndDate] = useState(() => getJhbNow().date);
  const [endTime, setEndTime] = useState(
    () => `${String(getJhbNow().hour).padStart(2, "0")}:00`,
  );

  const jhbNow = getJhbNow();
  const isToday = endDate === jhbNow.date;
  const isFuture = endDate > jhbNow.date || (isToday && Number(endTime.slice(0, 2)) > jhbNow.hour);
  const canRun = mode === "latest" || (!!endDate && !!endTime && !isFuture);

  const hourlyFormulas = formulas.filter(isShownInHourly);
  const progressiveFormulas = formulas.filter(isShownInProgressive);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runHourlyReport(
        sitedata,
        mode === "specific" ? { endDate, endTime } : {},
      );
      setMessage(result.message || "Hourly report sent");
      setSuccessful(result.status === "sent");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to run hourly report",
      );
      setSuccessful(false);
    } finally {
      setShow(true);
      setRunning(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hourly Report
              </CardTitle>
              <CardDescription>
                Sent automatically every hour while the site is in shift.
                Choose which formulas appear here in the Formulas tab.
              </CardDescription>
            </div>
            <Badge variant={sitedata.hourly ? "default" : "secondary"}>
              {sitedata.hourly ? "Scheduled" : "Not scheduled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Shown in the hourly block</p>
            {hourlyFormulas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hourlyFormulas.map((f) => (
                  <Badge key={f.formulaname} variant="outline">
                    {f.formulaname}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No formulas selected. Tick &quot;Hourly&quot; on a formula in
                the Formulas tab.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Shown in the progressive blocks
            </p>
            {progressiveFormulas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {progressiveFormulas.map((f) => (
                  <Badge key={f.formulaname} variant="outline">
                    {f.formulaname}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None selected.</p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hourly-mode"
                  checked={mode === "latest"}
                  onChange={() => setMode("latest")}
                />
                Latest hour
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hourly-mode"
                  checked={mode === "specific"}
                  onChange={() => setMode("specific")}
                />
                Specific hour
              </label>
            </div>

            {mode === "specific" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly-end-date">End date</Label>
                  <Input
                    id="hourly-end-date"
                    type="date"
                    value={endDate}
                    max={jhbNow.date}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem
                          key={h}
                          value={h}
                          disabled={isToday && Number(h.slice(0, 2)) > jhbNow.hour}
                        >
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {mode === "latest"
                  ? "Reports the most recent completed hour."
                  : isFuture
                    ? "End time cannot be in the future."
                    : endTime === "00:00"
                    ? `Reports 23:00 (previous day) - 00:00 on ${endDate}.`
                    : `Reports ${hourBefore(endTime)} - ${endTime} on ${endDate}.`}{" "}
                Test and non-prod sites send to the test chat.
              </p>
              <Button onClick={handleRun} disabled={running || !canRun}>
                {running ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                Run Hourly
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}
    </>
  );
};