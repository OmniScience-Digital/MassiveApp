// types/schema.ts
export type SignInFlow =
  | "signIn"
  | "signUp"
  | "forgotPassword"
  | "resetPassword"; //union type
export type DataItem = {
  id: string;
  items: string;
  createdAt: string;
  updatedAt: string;
};

export type SiteConstantsInterface = {
  siteName: string;
  telegramId: string;
  totalMonthTarget: number;
  runningTph: number;
  maxUtilization: number;
  siteType: string;
  scaleType: string;
  shiftftp: string;
  email: string;
  reporttype: string;
  reportTo: string;
  template?:string;
};

export type InputType = "table";

export type ReportItem = {
  id: string;
  audit?: boolean;
  progressive?: boolean;
  hourly?: boolean;
  rpt?: boolean;
  ftp?: boolean;
  siteStatus: string;
  siteConstants: {
    siteName: string;
    telegramId: string;
    totalMonthTarget: number;
    runningTph: number;
    maxUtilization: number;
    siteType: string;
    scaleType: string;
    shiftftp: string;
    email: string;
    reporttype: string;
    reportTo: string;
    template?:string;
  };
  siteTimes: {
    monthstart: string;
    dayStart: string;
    dayStop: string;
    nightStart: string;
    nightStop: string;
    extraShiftStart: string;
    extraShiftStop: string;
    twentyFourhourShift?: boolean;
  };
  scales: {
    scalename: string;
    iccid: string;
    deviceAddress: string;
    totalizer: string;
    monthTons: string;
    flow: string;
    openingScaletons: string;
     isPlc?: boolean;
     // Values for any user-added dynamic columns, keyed by ScaleColumnConfig["key"]
     customFields?: { [key: string]: string };
  }[];
  // User-defined extra columns for the scales table (dynamically added/removed in the UI)
  scaleColumns?: ScaleColumnConfig[];
  headers: {
    headername: string;
  }[];
  primaryScales: string[];
  formulas: {
    formulaname: string;
    formula: string;
    virtualformula: boolean;
    minKpi?: string;
    maxKpi?: string;
  }[];

  dynamic_inputs: {
    inputListName: string;
    inputs: {
      type: "text" | "number" | "date";
      value: any;
      label: string;
      isEditing: boolean;
    }[];
  }[];
  dynamic_tables: {
    id: number;
    tableName: string;
    columns: string[];
    data: { [key: string]: any }[];
  }[];
    rpt_inputs?: {
    inputListName: string;
    inputs: {
      type: "text" | "number" | "date";
      value: any;
      label: string;
      isEditing: boolean;
    }[];
  }[];
  virtualformulas?: {
    formulaname: string;
    formula: string;
  }[];
  rpt_tables?: {
    id: number;
    tableName: string;
    columns: string[];
    data: { [key: string]: any }[];
  }[];
};

export interface RuntimesAudit {
  id: string;
  date: string | null; // Allow null
  scales: any[];
}

// Define the state type
export interface StopTimesState {
  dayStop: string[];
  nightStop: string[];
  extraStop: string[];
}


export type ScalePayload = {
  scalename: string;
  iccid: string;
  deviceAddress: string;
  totalizer: string;
  monthTons: string;
  flow: string;
  openingScaletons: string;
  isPlc?: boolean;
  customFields?: { [key: string]: string };
};

// Definition of a user-added dynamic column on the Scales table.
// `key` is a stable identifier used to store/read values on each row's
// `customFields`; `label` is the editable display name shown in the header.
export type ScaleColumnConfig = {
  key: string;
  label: string;
};

// The fixed catalog of Status Report check "kinds". The math per kind is
// different backend logic, but everything about *how* each instance of a
// kind behaves (on/off, which scale field it reads, its thresholds, its
// wording) is configured here rather than hardcoded.
export type StatusCheckType =
  | "totalizationLimit"
  | "batteryState"
  | "totalizerReset"
  | "monthTonsReset"
  | "modbusUpdateInterval"
  | "modbusUpdating"
  | "speedError"
  | "spikeError"
  | "zeroError"
  | "kpiCheck"
  | "zeroCalibration"
  | "spanCalibration";

export type StatusCheck = {
  id: string;
  checkType: StatusCheckType;
  label: string; // editable display name shown as the PDF column heading
  enabled: boolean;
  // Which scale field this check reads (a fixed field like "totalizer"/"flow",
  // or a key from that site's ScaleColumnConfig custom columns, e.g. "load",
  // "speed", "zeroCalSetpoint", "spanCalSetpoint"). Not used by kpiCheck.
  scaleField?: string;
  // For kpiCheck only: which Formulas entry (and its minKpi/maxKpi) to evaluate.
  formulaName?: string;
  // Threshold values, keyed per check type (e.g. { limit: 750000 },
  // { deviationPercent: 5 }, { cutoffPercent: 20, tolerancePercent: 2 }).
  thresholds?: { [key: string]: number };
  // Editable pass/fail wording so reports aren't stuck with words like
  // "maintained"/"unsurpassed".
  passLabel?: string;
  failLabel?: string;
};

export type StatusReportConfig = {
  checks: StatusCheck[];
};