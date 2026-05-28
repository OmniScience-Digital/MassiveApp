// "use client";
// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { ReportItem } from "@/types/schema";
// import { AlertCircle, CheckCircle2, Copy } from "lucide-react";

// interface InputModalProps {
//   isOpen: boolean;
//   reporttype: string;
//   onClose: () => void;
//   onSubmit: (data: ReportItem) => void;
//   existingSites?: ReportItem[];
// }

// type ChecklistItem = { label: string; ok: boolean };

// function buildChecklist(fields: typeof BLANK): ChecklistItem[] {
//   return [
//     { label: "Site Name", ok: fields.siteName.trim().length > 0 },
//     { label: "Scale Type", ok: fields.scaleType.trim().length > 0 },
//     { label: "Site Type", ok: fields.siteType.trim().length > 0 },
//     { label: "Report To", ok: fields.reportTo.trim().length > 0 },
//     { label: "Running TPH", ok: fields.runningTph > 0 },
//     { label: "Max Utilization", ok: fields.maxUtilization > 0 },
//     { label: "Month Target", ok: fields.totalMonthTarget > 0 },
//   ];
// }

// const BLANK = {
//   siteName: "",
//   telegramId: "",
//   totalMonthTarget: 0,
//   runningTph: 0,
//   maxUtilization: 0,
//   siteType: "",
//   scaleType: "",
//   reportTo: "",
//   shiftftp: "",
//   email: "",
// };

// // What gets deep-copied from the source site
// interface CopiedData {
//   siteTimes: ReportItem["siteTimes"] | null;
//   dynamic_inputs: ReportItem["dynamic_inputs"];
//   dynamic_tables: ReportItem["dynamic_tables"];
//   rpt_inputs: ReportItem["rpt_inputs"];
//   rpt_tables: ReportItem["rpt_tables"];
//   scales: ReportItem["scales"];
//   headers: ReportItem["headers"];
//   formulas: ReportItem["formulas"];
//   primaryScales: string[];
// }

// const EMPTY_COPY: CopiedData = {
//   siteTimes: null,
//   dynamic_inputs: [],
//   dynamic_tables: [],
//   rpt_inputs: [],
//   rpt_tables: [],
//   scales: [],
//   headers: [],
//   formulas: [],
//   primaryScales: [],
// };

// const InputModal: React.FC<InputModalProps> = ({
//   isOpen,
//   reporttype,
//   onClose,
//   onSubmit,
//   existingSites = [],
// }) => {
//   const [fields, setFields] = useState({ ...BLANK });
//   const [copiedData, setCopiedData] = useState<CopiedData>({ ...EMPTY_COPY });
//   const [copyFromId, setCopyFromId] = useState("");
//   const [attempted, setAttempted] = useState(false);

//   const set = (key: keyof typeof BLANK) => (val: string | number) =>
//     setFields((prev) => ({ ...prev, [key]: val }));

//   const getCurrentMonthStart = () => {
//     const now = new Date();
//     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
//   };

//   const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

//   const handleCopyFrom = (id: string) => {
//     setCopyFromId(id);
//     if (!id || id === "__blank__") {
//       setFields({ ...BLANK });
//       setCopiedData({ ...EMPTY_COPY });
//       return;
//     }
//     const site = existingSites.find((s) => s.id === id);
//     if (!site) return;
//     const c = site.siteConstants;

//     // Copy all siteConstants fields
//     setFields({
//       siteName: c.siteName + " (copy)",
//       telegramId: c.telegramId || "",
//       totalMonthTarget: c.totalMonthTarget || 0,
//       runningTph: c.runningTph || 0,
//       maxUtilization: c.maxUtilization || 0,
//       siteType: c.siteType || "",
//       scaleType: c.scaleType || "",
//       reportTo: c.reportTo || "",
//       shiftftp: c.shiftftp || "",
//       email: c.email || "",
//     });

//     // Deep copy everything else — reset openingScaletons on scales so new site starts fresh
//     const clonedScales = deepClone(site.scales || []).map((s) => ({
//       ...s,
//       openingScaletons: "0",
//     }));

//     setCopiedData({
//       siteTimes: deepClone(site.siteTimes),
//       dynamic_inputs: deepClone(site.dynamic_inputs || []),
//       dynamic_tables: deepClone(site.dynamic_tables || []),
//       rpt_inputs: deepClone(site.rpt_inputs || []),
//       rpt_tables: deepClone(site.rpt_tables || []),
//       scales: clonedScales,
//       headers: deepClone(site.headers || []),
//       formulas: deepClone(site.formulas || []),
//       primaryScales: deepClone(site.primaryScales || []),
//     });
//   };

//   const checklist = buildChecklist(fields);
//   const allOk = checklist.every((c) => c.ok);

//   const handleFinishClick = () => {
//     setAttempted(true);
//     if (allOk) doSubmit();
//   };

//   const doSubmit = () => {
//     const data: ReportItem = {
//       id: "",
//       siteStatus: "off",
//       audit: false,
//       progressive: false,
//       siteConstants: {
//         siteName: fields.siteName,
//         telegramId: fields.telegramId,
//         totalMonthTarget: fields.totalMonthTarget,
//         runningTph: fields.runningTph,
//         maxUtilization: fields.maxUtilization,
//         siteType: fields.siteType,
//         scaleType: fields.scaleType,
//         shiftftp: fields.shiftftp,
//         email: fields.email,
//         reporttype,
//         reportTo: fields.reportTo,
//       },
//       siteTimes: copiedData.siteTimes ?? {
//         monthstart: getCurrentMonthStart(),
//         dayStart: "23:59",
//         dayStop: "23:59",
//         nightStart: "23:59",
//         nightStop: "23:59",
//         extraShiftStart: "23:59",
//         extraShiftStop: "23:59",
//         twentyFourhourShift: false,
//       },
//       dynamic_inputs: copiedData.dynamic_inputs,
//       dynamic_tables: copiedData.dynamic_tables,
//       rpt_inputs: copiedData.rpt_inputs,
//       rpt_tables: copiedData.rpt_tables,
//       scales: copiedData.scales,
//       headers: copiedData.headers,
//       formulas: copiedData.formulas,
//       primaryScales: copiedData.primaryScales,
//       virtualformulas: [],
//     };
//     onSubmit(data);
//     // Reset
//     setFields({ ...BLANK });
//     setCopiedData({ ...EMPTY_COPY });
//     setCopyFromId("");
//     setAttempted(false);
//     onClose();
//   };

//   const sourceSite = existingSites.find((s) => s.id === copyFromId);

//   // What will be copied — shown as a preview when a source is selected
//   const copyPreview = sourceSite
//     ? [
//         { label: "Site times", ok: true },
//         { label: `${sourceSite.scales?.length || 0} scales`, ok: (sourceSite.scales?.length || 0) > 0 },
//         { label: `${sourceSite.headers?.length || 0} headers`, ok: (sourceSite.headers?.length || 0) > 0 },
//         { label: `${sourceSite.dynamic_inputs?.length || 0} dynamic input lists`, ok: (sourceSite.dynamic_inputs?.length || 0) > 0 },
//         { label: `${sourceSite.dynamic_tables?.length || 0} dynamic tables`, ok: (sourceSite.dynamic_tables?.length || 0) > 0 },
//         { label: `${sourceSite.rpt_inputs?.length || 0} RPT input lists`, ok: (sourceSite.rpt_inputs?.length || 0) > 0 },
//         { label: `${sourceSite.rpt_tables?.length || 0} RPT tables`, ok: (sourceSite.rpt_tables?.length || 0) > 0 },
//         { label: `${sourceSite.formulas?.length || 0} formulas`, ok: (sourceSite.formulas?.length || 0) > 0 },
//         { label: `${sourceSite.primaryScales?.length || 0} primary scales`, ok: (sourceSite.primaryScales?.length || 0) > 0 },
//       ]
//     : [];

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Add Site</DialogTitle>
//           <DialogDescription>
//             Start blank or copy configuration from an existing site.
//           </DialogDescription>
//         </DialogHeader>

//         {/* Copy from existing site */}
//         {existingSites.length > 0 && (
//           <div className="mb-1">
//             <Label className="text-muted-foreground flex items-center gap-1 mb-1 text-xs">
//               <Copy className="h-3 w-3" /> Copy from existing site
//             </Label>
//             <Select value={copyFromId} onValueChange={handleCopyFrom}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select a site to copy..." />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="__blank__">— Start blank —</SelectItem>
//                 {existingSites.map((s) => (
//                   <SelectItem key={s.id} value={s.id}>
//                     {s.siteConstants.siteName}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             {/* Copy preview */}
//             {copyPreview.length > 0 && (
//               <div className="mt-2 rounded-md border bg-muted/30 p-2.5">
//                 <p className="text-xs font-medium mb-1.5 text-muted-foreground">Will be copied:</p>
//                 <div className="grid grid-cols-2 gap-1">
//                   {copyPreview.map((item) => (
//                     <div key={item.label} className="flex items-center gap-1.5 text-xs">
//                       {item.ok
//                         ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
//                         : <AlertCircle className="h-3 w-3 text-gray-400 shrink-0" />}
//                       <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>
//                         {item.label}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         <div className="space-y-3">
//           {/* Always-visible checklist — live as you type */}
//           <div className="rounded-lg border bg-muted/20 p-3">
//             <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
//               Required fields
//             </p>
//             <div className="grid grid-cols-2 gap-1">
//               {checklist.map((item) => (
//                 <div key={item.label} className="flex items-center gap-1.5 text-xs">
//                   {item.ok
//                     ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
//                     : <AlertCircle className={`h-3.5 w-3.5 shrink-0 ${attempted ? "text-red-400" : "text-gray-300 dark:text-gray-600"}`} />}
//                   <span className={item.ok ? "text-foreground" : attempted ? "text-red-400" : "text-muted-foreground"}>
//                     {item.label}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <Input
//             placeholder="Site Name *"
//             value={fields.siteName}
//             onChange={(e) => set("siteName")(e.target.value)}
//             className={attempted && !fields.siteName.trim() ? "border-red-400" : ""}
//           />
//           <Input
//             placeholder="Telegram ID"
//             value={fields.telegramId}
//             onChange={(e) => set("telegramId")(e.target.value)}
//           />

//           <div className="grid grid-cols-3 gap-2">
//             <div>
//               <Label className="text-xs text-muted-foreground">Month Target</Label>
//               <Input
//                 type="number"
//                 value={fields.totalMonthTarget}
//                 onChange={(e) => set("totalMonthTarget")(e.target.valueAsNumber || 0)}
//                 className={attempted && !fields.totalMonthTarget ? "border-red-400" : ""}
//               />
//             </div>
//             <div>
//               <Label className="text-xs text-muted-foreground">Running TPH</Label>
//               <Input
//                 type="number"
//                 value={fields.runningTph}
//                 onChange={(e) => set("runningTph")(e.target.valueAsNumber || 0)}
//                 className={attempted && !fields.runningTph ? "border-red-400" : ""}
//               />
//             </div>
//             <div>
//               <Label className="text-xs text-muted-foreground">Max Utilization</Label>
//               <Input
//                 type="number"
//                 value={fields.maxUtilization}
//                 onChange={(e) => set("maxUtilization")(e.target.valueAsNumber || 0)}
//                 className={attempted && !fields.maxUtilization ? "border-red-400" : ""}
//               />
//             </div>
//           </div>

//           <Select value={fields.siteType} onValueChange={set("siteType")}>
//             <SelectTrigger className={attempted && !fields.siteType ? "border-red-400" : ""}>
//               <SelectValue placeholder="Site Type *" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="iot">IOT Based</SelectItem>
//               <SelectItem value="plc">PLC Based</SelectItem>
//               <SelectItem value="iotnplc">IOT and PLC Based</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={fields.scaleType} onValueChange={set("scaleType")}>
//             <SelectTrigger className={attempted && !fields.scaleType ? "border-red-400" : ""}>
//               <SelectValue placeholder="Scale Type *" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="Single">Single</SelectItem>
//               <SelectItem value="Series">Series</SelectItem>
//               <SelectItem value="Parallel">Parallel</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={fields.shiftftp} onValueChange={set("shiftftp")}>
//             <SelectTrigger>
//               <SelectValue placeholder="Shift FTP" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="totalizer">Totalizer</SelectItem>
//               <SelectItem value="monthtons">Monthtons</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={fields.reportTo} onValueChange={set("reportTo")}>
//             <SelectTrigger className={attempted && !fields.reportTo ? "border-red-400" : ""}>
//               <SelectValue placeholder="Report To *" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="Email">Email</SelectItem>
//               <SelectItem value="Telegram">Telegram</SelectItem>
//               <SelectItem value="Telegram & Email">Telegram & Email</SelectItem>
//             </SelectContent>
//           </Select>

//           {fields.reportTo !== "Telegram" && (
//             <Input
//               type="email"
//               placeholder="Email"
//               value={fields.email}
//               onChange={(e) => set("email")(e.target.value)}
//             />
//           )}

//           <div className="flex gap-2 pt-1">
//             <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
//             <Button onClick={handleFinishClick} className="flex-1" disabled={attempted && !allOk}>
//               {allOk ? "Save Site" : "Save Site"}
//             </Button>
//           </div>

//           {attempted && !allOk && (
//             <div className="flex gap-2">
//               <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full"
//                 onClick={doSubmit}>
//                 Save anyway (incomplete)
//               </Button>
//             </div>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default InputModal;


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
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";

interface InputModalProps {
  isOpen: boolean;
  reporttype: string;
  onClose: () => void;
  onSubmit: (data: ReportItem) => void;
  existingSites?: ReportItem[];
}

type ChecklistItem = { label: string; ok: boolean };

function buildChecklist(fields: typeof BLANK): ChecklistItem[] {
  return [
    { label: "Site Name", ok: fields.siteName.trim().length > 0 },
    { label: "Scale Type", ok: fields.scaleType.trim().length > 0 },
    { label: "Site Type", ok: fields.siteType.trim().length > 0 },
    { label: "Report To", ok: fields.reportTo.trim().length > 0 },
    { label: "Running TPH", ok: fields.runningTph > 0 },
    { label: "Max Utilization", ok: fields.maxUtilization > 0 },
    { label: "Month Target", ok: fields.totalMonthTarget > 0 },
  ];
}

const BLANK = {
  siteName: "",
  telegramId: "",
  totalMonthTarget: 0,
  runningTph: 0,
  maxUtilization: 0,
  siteType: "",
  scaleType: "",
  reportTo: "",
  shiftftp: "",
  email: "",
};

// What gets deep-copied from the source site (EXCLUDING scales, formulas, primaryScales, telegramId)
interface CopiedData {
  siteTimes: ReportItem["siteTimes"] | null;
  dynamic_inputs: ReportItem["dynamic_inputs"];
  dynamic_tables: ReportItem["dynamic_tables"];
  rpt_inputs: ReportItem["rpt_inputs"];
  rpt_tables: ReportItem["rpt_tables"];
  headers: ReportItem["headers"];
  // scales, formulas, primaryScales, telegramId are intentionally omitted
}

const EMPTY_COPY: CopiedData = {
  siteTimes: null,
  dynamic_inputs: [],
  dynamic_tables: [],
  rpt_inputs: [],
  rpt_tables: [],
  headers: [],
};

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  reporttype,
  onClose,
  onSubmit,
  existingSites = [],
}) => {
  const [fields, setFields] = useState({ ...BLANK });
  const [copiedData, setCopiedData] = useState<CopiedData>({ ...EMPTY_COPY });
  const [copyFromId, setCopyFromId] = useState("");
  const [attempted, setAttempted] = useState(false);

  const set = (key: keyof typeof BLANK) => (val: string | number) =>
    setFields((prev) => ({ ...prev, [key]: val }));

  const getCurrentMonthStart = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

  const handleCopyFrom = (id: string) => {
    setCopyFromId(id);
    if (!id || id === "__blank__") {
      setFields({ ...BLANK });
      setCopiedData({ ...EMPTY_COPY });
      return;
    }
    const site = existingSites.find((s) => s.id === id);
    if (!site) return;
    const c = site.siteConstants;

    // Copy siteConstants fields EXCEPT telegramId (keep it blank)
    setFields({
      siteName: c.siteName + " (copy)",
      telegramId: "", // ✅ explicitly avoid copying telegramId
      totalMonthTarget: c.totalMonthTarget || 0,
      runningTph: c.runningTph || 0,
      maxUtilization: c.maxUtilization || 0,
      siteType: c.siteType || "",
      scaleType: c.scaleType || "",
      reportTo: c.reportTo || "",
      shiftftp: c.shiftftp || "",
      email: c.email || "",
    });

    // Deep copy everything EXCEPT scales, formulas, primaryScales
    setCopiedData({
      siteTimes: deepClone(site.siteTimes),
      dynamic_inputs: deepClone(site.dynamic_inputs || []),
      dynamic_tables: deepClone(site.dynamic_tables || []),
      rpt_inputs: deepClone(site.rpt_inputs || []),
      rpt_tables: deepClone(site.rpt_tables || []),
      headers: deepClone(site.headers || []),
      // scales, formulas, primaryScales are NOT copied
    });
  };

  const checklist = buildChecklist(fields);
  const allOk = checklist.every((c) => c.ok);

  const handleFinishClick = () => {
    setAttempted(true);
    if (allOk) doSubmit();
  };

  const doSubmit = () => {
    const data: ReportItem = {
      id: "",
      siteStatus: "off",
      audit: false,
      progressive: false,
      siteConstants: {
        siteName: fields.siteName,
        telegramId: fields.telegramId,
        totalMonthTarget: fields.totalMonthTarget,
        runningTph: fields.runningTph,
        maxUtilization: fields.maxUtilization,
        siteType: fields.siteType,
        scaleType: fields.scaleType,
        shiftftp: fields.shiftftp,
        email: fields.email,
        reporttype,
        reportTo: fields.reportTo,
      },
      siteTimes: copiedData.siteTimes ?? {
        monthstart: getCurrentMonthStart(),
        dayStart: "23:59",
        dayStop: "23:59",
        nightStart: "23:59",
        nightStop: "23:59",
        extraShiftStart: "23:59",
        extraShiftStop: "23:59",
        twentyFourhourShift: false,
      },
      dynamic_inputs: copiedData.dynamic_inputs,
      dynamic_tables: copiedData.dynamic_tables,
      rpt_inputs: copiedData.rpt_inputs,
      rpt_tables: copiedData.rpt_tables,
      scales: [],                     // ✅ start with empty scales
      headers: copiedData.headers,
      formulas: [],                   // ✅ start with empty formulas
      primaryScales: [],              // ✅ start with empty primaryScales
      virtualformulas: [],
    };
    onSubmit(data);
    // Reset
    setFields({ ...BLANK });
    setCopiedData({ ...EMPTY_COPY });
    setCopyFromId("");
    setAttempted(false);
    onClose();
  };

  const sourceSite = existingSites.find((s) => s.id === copyFromId);

  // Updated preview – excludes scales, formulas, primaryScales
  const copyPreview = sourceSite
    ? [
        { label: "Site times", ok: true },
        {
          label: `${sourceSite.headers?.length || 0} headers`,
          ok: (sourceSite.headers?.length || 0) > 0,
        },
        {
          label: `${sourceSite.dynamic_inputs?.length || 0} dynamic input lists`,
          ok: (sourceSite.dynamic_inputs?.length || 0) > 0,
        },
        {
          label: `${sourceSite.dynamic_tables?.length || 0} dynamic tables`,
          ok: (sourceSite.dynamic_tables?.length || 0) > 0,
        },
        {
          label: `${sourceSite.rpt_inputs?.length || 0} RPT input lists`,
          ok: (sourceSite.rpt_inputs?.length || 0) > 0,
        },
        {
          label: `${sourceSite.rpt_tables?.length || 0} RPT tables`,
          ok: (sourceSite.rpt_tables?.length || 0) > 0,
        },
        // scales, formulas, primaryScales, telegramId are not shown in preview
      ]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Site</DialogTitle>
          <DialogDescription>
            Start blank or copy configuration from an existing site.
            <br />
            <span className="text-xs text-muted-foreground">
              (Scales, formulas, primary scales, and Telegram ID are never copied.)
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Copy from existing site */}
        {existingSites.length > 0 && (
          <div className="mb-1">
            <Label className="text-muted-foreground flex items-center gap-1 mb-1 text-xs">
              <Copy className="h-3 w-3" /> Copy from existing site
            </Label>
            <Select value={copyFromId} onValueChange={handleCopyFrom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a site to copy..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__blank__">— Start blank —</SelectItem>
                {existingSites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.siteConstants.siteName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Copy preview – shows only what will actually be copied */}
            {copyPreview.length > 0 && (
              <div className="mt-2 rounded-md border bg-muted/30 p-2.5">
                <p className="text-xs font-medium mb-1.5 text-muted-foreground">
                  Will be copied:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {copyPreview.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs">
                      {item.ok ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-gray-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.ok ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Scales, formulas, primary scales, and Telegram ID are <strong>not</strong> copied.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {/* Always-visible checklist */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Required fields
            </p>
            <div className="grid grid-cols-2 gap-1">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                  {item.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle
                      className={`h-3.5 w-3.5 shrink-0 ${
                        attempted ? "text-red-400" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  )}
                  <span
                    className={
                      item.ok
                        ? "text-foreground"
                        : attempted
                        ? "text-red-400"
                        : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Input
            placeholder="Site Name *"
            value={fields.siteName}
            onChange={(e) => set("siteName")(e.target.value)}
            className={attempted && !fields.siteName.trim() ? "border-red-400" : ""}
          />
          <Input
            placeholder="Telegram ID (not copied)"
            value={fields.telegramId}
            onChange={(e) => set("telegramId")(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Month Target</Label>
              <Input
                type="number"
                value={fields.totalMonthTarget}
                onChange={(e) => set("totalMonthTarget")(e.target.valueAsNumber || 0)}
                className={attempted && !fields.totalMonthTarget ? "border-red-400" : ""}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Running TPH</Label>
              <Input
                type="number"
                value={fields.runningTph}
                onChange={(e) => set("runningTph")(e.target.valueAsNumber || 0)}
                className={attempted && !fields.runningTph ? "border-red-400" : ""}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Utilization</Label>
              <Input
                type="number"
                value={fields.maxUtilization}
                onChange={(e) => set("maxUtilization")(e.target.valueAsNumber || 0)}
                className={attempted && !fields.maxUtilization ? "border-red-400" : ""}
              />
            </div>
          </div>

          <Select value={fields.siteType} onValueChange={set("siteType")}>
            <SelectTrigger className={attempted && !fields.siteType ? "border-red-400" : ""}>
              <SelectValue placeholder="Site Type *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iot">IOT Based</SelectItem>
              <SelectItem value="plc">PLC Based</SelectItem>
              <SelectItem value="iotnplc">IOT and PLC Based</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fields.scaleType} onValueChange={set("scaleType")}>
            <SelectTrigger className={attempted && !fields.scaleType ? "border-red-400" : ""}>
              <SelectValue placeholder="Scale Type *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Series">Series</SelectItem>
              <SelectItem value="Parallel">Parallel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fields.shiftftp} onValueChange={set("shiftftp")}>
            <SelectTrigger>
              <SelectValue placeholder="Shift FTP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalizer">Totalizer</SelectItem>
              <SelectItem value="monthtons">Monthtons</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fields.reportTo} onValueChange={set("reportTo")}>
            <SelectTrigger className={attempted && !fields.reportTo ? "border-red-400" : ""}>
              <SelectValue placeholder="Report To *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Telegram">Telegram</SelectItem>
              <SelectItem value="Telegram & Email">Telegram & Email</SelectItem>
            </SelectContent>
          </Select>

          {fields.reportTo !== "Telegram" && (
            <Input
              type="email"
              placeholder="Email"
              value={fields.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleFinishClick} className="flex-1" disabled={attempted && !allOk}>
              Save Site
            </Button>
          </div>

          {attempted && !allOk && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground w-full"
                onClick={doSubmit}
              >
                Save anyway (incomplete)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InputModal;