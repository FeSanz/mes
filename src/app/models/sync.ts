import {Timestamp} from "rxjs";

export interface Sync {
  id: number;
  code: string;
  number: string;
  name: string;
  description: string;
  mfg: boolean;
  startTime: Timestamp<any>;
  endTime: Timestamp<any>;
  duration: number;
  class:string;
  uom: string;
  lot: string;
}
