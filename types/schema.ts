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

// The fixed catalog of scale-level check "kinds" — the math per kind is
// backend logic, but whether it's on, which scale field it reads, its
// thresholds, and its pass wording are all configured per SCALE, per SITE
// (e.g. Totalization Limit can be on for one scale and off for another on
// the same site). KPI is not in this list — it's a site-level check tied
// to a Formula, not to any one scale.
export type ScaleCheckType =
  | "totalizationLimit"
  | "batteryState"
  | "totalizerReset"
  | "monthTonsReset"
  | "modbusUpdateInterval"
  | "modbusUpdating"
  | "speedError"
  | "spikeError"
  | "zeroError"
  | "zeroCalibration"
  | "spanCalibration";

// One check's configuration for one specific scale.
export type StatusCheck = {
  checkType: ScaleCheckType;
  enabled: boolean;
  // Which scale field this check reads (a fixed field like "totalizer"/"flow",
  // or a key from that site's ScaleColumnConfig custom columns, e.g. "load",
  // "speed", "zeroCalSetpoint", "spanCalSetpoint").
  scaleField?: string;
  // Threshold values, keyed per check type (e.g. { limit: 750000 },
  // { deviationPercent: 5 }, { cutoffPercent: 20, tolerancePercent: 2 }).
  thresholds?: { [key: string]: number };
  // Editable pass wording so reports aren't stuck with words like "maintained".
  passLabel?: string;
};

// KPI is site-level: it's evaluated once per Formula (using that formula's
// minKpi/maxKpi), not per scale.
export type KpiCheckConfig = {
  formulaName: string;
  enabled: boolean;
  passLabel?: string;
};

// One site's full Status Report configuration.
export type SiteStatusReportConfig = {
  kpiChecks: KpiCheckConfig[];
  // Keyed by scale iccid (stable identifier for a scale within a site).
  scaleChecks: { [iccid: string]: StatusCheck[] };
};

// The global Status Report config record — still one record covering every
// site (every site runs in the twice-daily report), but each site now
// carries its own per-scale check configuration instead of one flat list
// applied uniformly everywhere.
export type StatusReportConfig = {
  sites: { [siteId: string]: SiteStatusReportConfig };
};

 
// One well-known record (id: "global") backing the Telegram group monitor.
// companyUserIds excludes internal staff from personal-DM keyword routing
// (their matches route to alertChatId instead); alertChatId is the
// centralized chat for tag matches (always) + ignored-sender keyword
// matches. NOTE: keywords used to live on this record as one shared global
// list — moved to per-user records (see UserKeywordEntry below).
export type TelegramMonitorConfig = {
  companyUserIds: string[];
  alertChatId: string;
};
 
// One record per staff member (id = their Telegram numeric user id),
// holding their own personal keyword list. Self-managed via chat commands
// only — dashboard shows this read-only.
export type UserKeywordEntry = {
  userId: string;
  username?: string;
  displayName?: string;
  keywords: string[];
};