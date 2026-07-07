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

export interface ParseError {
  row: number;
  message: string;
  field: string;
}
