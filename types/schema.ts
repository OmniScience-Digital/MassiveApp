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
};

export type InputType = "table";

export type ReportItem = {
  id: string;
  audit?: boolean;
  progressive?: boolean;
  hourly?: boolean;
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
    openingScaletons: string;
  }[];
  headers: {
    headername: string;
  }[];
  primaryScales: string[];
  formulas: {
    formulaname: string;
    formula: string;
    virtualformula: boolean;
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
