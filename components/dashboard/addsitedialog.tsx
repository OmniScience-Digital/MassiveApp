"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportItem } from "@/types/schema";

interface InputModalProps {
  isOpen: boolean;
  reporttype: string;
  onClose: () => void;
  onSubmit: (data: ReportItem) => void;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  reporttype,
  onClose,
  onSubmit,
}) => {
  const [siteName, setSiteName] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [totalMonthTarget, setTotalMonthTarget] = useState<number | 0>(0);
  const [runningTph, setRunningTph] = useState<number | 0>(0);
  const [maxUtilization, setMaxUtilization] = useState<number | 0>(0);
  const [siteType, setSiteType] = useState("");
  const [scaleType, setScaleType] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [shiftftp, setShiftftp] = useState("");
  const [email, setEmail] = useState(" ");

  const getCurrentMonthStart = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Two-digit month
    return `${year}-${month}-01`;
  };

  const handleFinish = () => {
    const data = {
      id: "",
      siteStatus: "off",
      audit: false,
      progressive: false,
      siteConstants: {
        siteName,
        telegramId,
        totalMonthTarget,
        runningTph,
        maxUtilization,
        siteType,
        scaleType,
        shiftftp,
        email,
        reporttype,
        reportTo,
      },
      siteTimes: {
        monthstart: getCurrentMonthStart(),
        dayStart: "23:59",
        dayStop: "23:59",
        nightStart: "23:59",
        nightStop: "23:59",
        extraShiftStart: "23:59",
        extraShiftStop: "23:59",
        twentyFourhourShift: false,
      },
      dynamic_inputs: [],
      dynamic_tables: [],
      scales: [],
      formulas: [],
      virtualformulas: [],
      headers: [],
      primaryScales: [],
    };
    onSubmit(data); // Pass data back to the parent

    setSiteName("");
    setTelegramId("");
    setTotalMonthTarget(0);
    setRunningTph(0);
    setMaxUtilization(0);
    setSiteType("");
    setScaleType("");
    setReportTo("");
    setShiftftp("");
    setEmail("");

    onClose(); // Close the modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Site Details</DialogTitle>
          <DialogDescription>
            Enter details to create a new site.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Site Name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
          <Input
            placeholder="Telegram ID"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
          />
          <Label htmlFor="monthtarget" className="text-gray-400">
            Month Target
          </Label>
          <Input
            id="monthtarget"
            type="number"
            placeholder="Total Month Target"
            value={totalMonthTarget}
            onChange={(e) => setTotalMonthTarget(e.target.valueAsNumber || 0)}
          />

          <Label htmlFor="runningtph" className="text-gray-400">
            Running Tph
          </Label>
          <Input
            id="runningtph"
            type="number"
            placeholder="Running TPH"
            value={runningTph}
            onChange={(e) => setRunningTph(e.target.valueAsNumber || 0)}
          />

          <Label htmlFor="maxutilisation" className="text-gray-400">
            Max Utilisation
          </Label>
          <Input
            id="maxutilisation"
            title="Max Utilisation"
            type="number"
            placeholder="Max Utilization"
            value={maxUtilization}
            onChange={(e) => setMaxUtilization(e.target.valueAsNumber || 0)}
          />
          <Select value={siteType} onValueChange={setSiteType}>
            <SelectTrigger>
              <SelectValue placeholder="Site Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iot">IOT Based</SelectItem>
              <SelectItem value="plc">PLC Based</SelectItem>
              <SelectItem value="iotnplc">IOT and PLC Based</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scaleType} onValueChange={setScaleType}>
            <SelectTrigger>
              <SelectValue placeholder="Scale Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Series">Series</SelectItem>
              <SelectItem value="Parallel">Parallel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={shiftftp} onValueChange={setShiftftp}>
            <SelectTrigger>
              <SelectValue placeholder="Shift Ftp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalizer">Totalizer</SelectItem>
              <SelectItem value="monthtons">Monthtons</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportTo} onValueChange={setReportTo}>
            <SelectTrigger>
              <SelectValue placeholder="Report To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="email & telegram">Email & Telegram</SelectItem>
            </SelectContent>
          </Select>
          {/* Conditionally render the Email Input */}
          {reportTo !== "telegram" && (
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <Button onClick={handleFinish}>Finish</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InputModal;
