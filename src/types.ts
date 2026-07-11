export interface LatenessRecord {
  id: string;
  index: number;
  name: string;
  department: string;
  dateString: string;
  timeString: string;
  minutesOfLateness: number;
  hasError?: boolean;
  errorMsg?: string;
}

export interface PrintSettings {
  showHeader: boolean;
  showDate: boolean;
  showAffiliation?: boolean;
  affiliationText?: string;
  customNote: string;
  fontFamily?: string;
  fontSize?: number;
  positions?: {
    name: { top: number, right: number };
    affiliation?: { top: number, right: number };
    department: { top: number, left: number };
    dateCreated: { top: number, left: number };
    dateLateness: { top: number, left: number };
    timeLateness: { top: number, left: number };
  };
}

export interface ParseError {
  row: number;
  message: string;
  field: string;
}
