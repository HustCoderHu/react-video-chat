import type { SignalData } from 'simple-peer';

type SocketListenEvents =
  | 'me'
  // | 'callended'
  | 'calluser'
  | 'callaccepted'
  | 'leavecall';
type SocketEmitEvents = 'reguser' | 'calluser' | 'answercall' | 'leavecall';

interface ISocketMe {
  socketId: string;
}

interface ISocketRegUser {
  name: string;
}

interface ISocketCallUser {
  signal: SignalData;
  from: string;
  name: string;
}

interface ISocketCallAccepted {
  signal: SignalData;
}

export {
  type SocketListenEvents,
  type SocketEmitEvents,
  type ISocketMe,
  type ISocketRegUser,
  type ISocketCallUser,
  type ISocketCallAccepted
};
