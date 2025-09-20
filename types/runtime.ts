export interface RuntimeData {
  hour: string;
  totalDeltaSum: number;
}

export interface Scale {
  iccid: string;
  runtime: RuntimeData[];
}

export interface RuntimesAudit {
  id: string;
  date: string | null;
  scales: Scale[];
}

export interface datesAudit {
  startDate: string;
  endDate: string;
}

export interface RuntimeTableProps {
  iccidRuntimes: RuntimesAudit[];
  daterange: datesAudit;
}

export type CellSelection = {
  start: { date: string; hour: string } | null;
  end: { date: string; hour: string } | null;
  active: boolean;
};
