import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

export default function VoiceCall() {
  const { callState, resetCallState, setCallState } = useChatStore();
  const { user } = useAuthStore();
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && callState.targetUserId) {
            getSocket().emit('ice-candidate', {
              targetUserId: callState.targetUserId,
              candidate: event.candidate,
            });
          }
        };

        if (!callState.isIncoming && callState.targetUserId) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          getSocket().emit('call-offer', { targetUserId: callState.targetUserId, offer });
        }

        const socket = getSocket();

        socket.on('call-offer', async (data: { callerId: number; offer: RTCSessionDescriptionInit }) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            socket.emit('call-answer', { targetUserId: data.callerId, answer });
          }
        });

        socket.on('call-answer', async (data: { answer: RTCSessionDescriptionInit }) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });

        socket.on('call-ended', () => {
          endCall();
        });

        setCallState({ isActive: true });
      } catch (err) {
        console.error('Error starting call:', err);
        resetCallState();
      }
    };

    if (callState.isActive) {
      startCall();
    }

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.isActive]);

  useEffect(() => {
    if (callState.isActive && !callState.isIncoming) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState.isActive, callState.isIncoming]);

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const endCall = () => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (callState.targetUserId) {
      getSocket().emit('end-call', { targetUserId: callState.targetUserId });
    }
    if (callState.callerId) {
      getSocket().emit('end-call', { targetUserId: callState.callerId });
    }
    resetCallState();
    setDuration(0);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const displayName = callState.isIncoming
    ? callState.callerName
    : callState.targetUserName || 'Appel';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 dark:bg-black/90 flex items-center justify-center">
      <audio ref={remoteAudioRef} autoPlay />
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 w-[340px] text-center shadow-2xl transition-colors duration-300">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {displayName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{displayName}</h3>
        <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">
          {callState.isIncoming && !callState.isActive
            ? 'Appel entrant...'
            : callState.isActive
            ? formatDuration(duration)
            : 'Appel en cours...'}
        </p>

        {callState.isIncoming && !callState.isActive && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={endCall}
              className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-110"
            >
              <span className="material-symbols-outlined text-2xl">call_end</span>
            </button>
            <button
              onClick={() => setCallState({ isActive: true, isIncoming: false })}
              className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-all duration-200 hover:scale-110 animate-pulse"
            >
              <span className="material-symbols-outlined text-2xl">call</span>
            </button>
          </div>
        )}

        {callState.isActive && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                isMuted ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-200 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
            </button>
            <button
              onClick={endCall}
              className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-110"
            >
              <span className="material-symbols-outlined text-2xl">call_end</span>
            </button>
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                !isSpeakerOn ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-200 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              <span className="material-symbols-outlined">{isSpeakerOn ? 'volume_up' : 'volume_off'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
