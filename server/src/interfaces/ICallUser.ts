import type { SignalData } from 'simple-peer';

export interface ICallUser {
  userToCall: string;
  signalData: SignalData;
  from: string;
  name: string;
}