import type { SignalData } from 'simple-peer';

export interface IAnswerCall {
  to: string;
  signal: SignalData;
}