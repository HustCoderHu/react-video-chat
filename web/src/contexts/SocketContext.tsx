import { useRouter } from 'next/router';
import {
  createContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
  type Dispatch,
  type SetStateAction
} from 'react';
import Peer, { type SignalData, type Instance } from 'simple-peer';
import { io, type Socket } from 'socket.io-client';

import {
  ISocketCallUser,
  SocketListenEvents,
  SocketEmitEvents,
  ISocketMe,
  ISocketCallAccepted
} from '../interfaces/ISocket';

interface ICall {
  isReceivedCall: boolean;
  from: string;
  name: string;
  signal: SignalData;
}

interface ISocketContextData {
  isLoadingCheckPermissions: boolean;
  userGrantedAudioAndVideoPermissions: boolean;
  stream: MediaStream;
  call: ICall;
  callAccepted: boolean;
  callEnded: boolean;
  me: string;
  userSocketId: string;
  name: string;
  remoteName: string;
  setName: Dispatch<SetStateAction<string>>;
  setRemoteName: Dispatch<SetStateAction<string>>;
  setCall: Dispatch<SetStateAction<ICall>>;
  myVideoRef: RefObject<HTMLVideoElement>;
  userVideoRef: RefObject<HTMLVideoElement>;
  requestAudioAndVideoPermissions: () => Promise<void>;
  callUser: (userId: string) => void;
  answerCall: () => void;
  leaveCall: (socketId?: string) => void;
}

interface ISocketContextProviderProps {
  children: ReactNode;
}

const SocketContext = createContext({} as ISocketContextData);

function getUserMediaFun(
  constraints?: MediaStreamConstraints,
  successCb?: (stream: MediaStream) => void,
  errorCb?: (error: Error) => void
) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    //最新的标准API
    console.log('navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(successCb)
      .catch(errorCb);
  // } else if ('webkitGetUserMedia' in navigator) {
  //   //webkit核心浏览器
  //   console.log('navigator.webkitGetUserMedia');
  //   navigator.webkitGetUserMedia(constraints, successCb, errorCb);
  // } else if (navigator.mozGetUserMedia) {
  //   //firfox浏览器
  //   console.log('navigator.mozGetUserMedia');
  //   navigator.mozGetUserMedia(constraints, successCb, errorCb);
  // } else if (navigator.getUserMedia) {
  //   //旧版API
  //   console.log('navigator.getUserMedia');
  //   navigator.getUserMedia(constraints, successCb, errorCb);
  } else {
    console.log('不支持访问用户媒体设备');
    throw new Error('WebRTC is not yet supported in this browser.');
  }
}

const SocketContextProvider = ({ children }: ISocketContextProviderProps) => {
  const router = useRouter();

  const [isLoadingCheckPermissions, setIsLoadingCheckPermissions] =
    useState<boolean>(true);
  const [
    userGrantedAudioAndVideoPermissions,
    setUserGrantedAudioAndVideoPermissions
  ] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream>({} as MediaStream);
  const [me, setMe] = useState<string>('');
  const [userSocketId, setUserSocketId] = useState<string>('');
  const [call, setCall] = useState<ICall>({} as ICall);
  const [name, setName] = useState<string>('Anonymo');
  const [remoteName, setRemoteName] = useState<string>('AnonymoRemote');
  const [callAccepted, setCallAccepted] = useState<boolean>(false);
  const [callEnded, setCallEnded] = useState<boolean>(false);

  const signalSocketRef = useRef<Socket>();
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Instance>();

  useEffect(() => {
    if (router.asPath === '/') {
      signalSocketRef.current = io('http://localhost:3333');

      checkAudioAndVideoPermissions();

      signalSocketRef.current.on<SocketListenEvents>(
        'me',
        ({ socketId }: ISocketMe) => {
          console.log(
            'useEffect on<SocketListenEvents> me, socketid: ' + socketId
          );
          setMe(socketId);
        }
      );

      signalSocketRef.current.on<SocketListenEvents>(
        'calluser',
        ({ from, name: callerName, signal }: ISocketCallUser) => {
          console.log(
            'useEffect on<SocketListenEvents> calluser, from: ' +
              from +
              ' name: ' +
              callerName
          );
          setCall({
            isReceivedCall: true,
            from,
            name: callerName,
            signal
          });
        }
      );

      signalSocketRef?.current?.on<SocketListenEvents>(
        'leavecall',
        (socketId: string) => {
          console.log('useEffect on<SocketListenEvents> leavecall: ' + socketId);
          leaveCall();
        }
      );

      signalSocketRef.current.emit<SocketEmitEvents>('reguser', {
        name
      });
    }
  }, [router.asPath]);

  async function checkAudioAndVideoPermissions() {
    setIsLoadingCheckPermissions(true);

    const audioPermission = await navigator.permissions.query({
      name: 'microphone'
    } as any);

    const videoPermission = await navigator.permissions.query({
      name: 'camera'
    } as any);

    if (
      audioPermission.state === 'granted' &&
      videoPermission.state === 'granted'
    ) {
      setUserGrantedAudioAndVideoPermissions(true);
      setIsLoadingCheckPermissions(false);

      return true;
    } else {
      setUserGrantedAudioAndVideoPermissions(false);
      setIsLoadingCheckPermissions(false);

      return false;
    }
  }

  async function requestAudioAndVideoPermissions() {
    const constraints = {
      audio: true,
      video: true
    };

    let currentStream = {};
    // const currentStream = await navigator.mediaDevices.getUserMedia({
    //   audio: true,
    //   video: true
    // });
    const successCb = function (stream: MediaStream) {
      setStream(stream);
      setUserGrantedAudioAndVideoPermissions(true);

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
    };
    const errorCb = function (error: any) {
      alert(error);
      setUserGrantedAudioAndVideoPermissions(false);
    };
    getUserMediaFun(constraints, successCb, errorCb);

    // if (currentStream) {
    //   setStream(currentStream);
    //   setUserGrantedAudioAndVideoPermissions(true);

    //   if (myVideoRef.current) {
    //     myVideoRef.current.srcObject = currentStream;
    //   }
    // } else {
    //   setUserGrantedAudioAndVideoPermissions(false);
    // }
  }

  function callUser(userId: string) {
    setRemoteName(userId);
    const peer = new Peer({ initiator: true, trickle: false, stream });

    console.log('SocketContext callUser, userId: ' + userId);
    setUserSocketId(userId);

    peer.on('signal', data => {
      console.log('SocketContext callUser peer.on signal, data: ' + data);
      signalSocketRef?.current?.emit<SocketEmitEvents>('calluser', {
        userToCall: userId,
        signalData: data,
        from: me,
        name
      });
    });

    peer.on('stream', currentStream => {
      console.log(
        'SocketContext callUser peer.on stream, currentStream: ' + currentStream
      );
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = currentStream;
      }
    });

    peer.on('close', () => {
      console.log('SocketContext callUser peer.on stream, close');
      signalSocketRef?.current?.off('callaccepted');
    });

    signalSocketRef?.current?.on<SocketListenEvents>(
      'callaccepted',
      ({ signal }: ISocketCallAccepted) => {
        console.log('SocketContext callUser callaccepted');
        setCallAccepted(true);
        // setCall({isReceivedCall: false,
        //   from: me,
        //   name,
        //   signal});
        peer.signal(signal);
        connectionRef.current = peer;
      }
    );
  }

  function answerCall() {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', data => {
      console.log('SocketContext answerCall peer.on signal, data: ' + data);
      signalSocketRef?.current?.emit<SocketEmitEvents>('answercall', {
        to: call.from,
        signal: data
      });
    });

    peer.on('stream', currentStream => {
      console.log(
        'SocketContext callUser peer.on stream, currentStream: ' + currentStream
      );
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  }

  function leaveCall(socketId?: string) {
    // setCallEnded(true);
    setCall({} as any);
    setCallAccepted(false);

    connectionRef!.current!.destroy();

    if (socketId) {
      signalSocketRef?.current?.emit<SocketEmitEvents>('leavecall', {
        socketId
      });
    }

    // window.location.reload();
  }

  return (
    <SocketContext.Provider
      value={{
        isLoadingCheckPermissions,
        userGrantedAudioAndVideoPermissions,
        stream,
        call,
        callAccepted,
        callEnded,
        me,
        userSocketId,
        name,
        remoteName,
        setName,
        setCall,
        setRemoteName,
        myVideoRef,
        userVideoRef,
        requestAudioAndVideoPermissions,
        callUser,
        answerCall,
        leaveCall
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContextProvider, SocketContext };
