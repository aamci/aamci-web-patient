'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Maximize2,
  Minimize2,
  MonitorUp,
  RefreshCw,
  Check,
  X,
  Volume2,
  VolumeX,
  Send,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended';
  duration: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatarUrl: string | null;
}

interface AppointmentInfo {
  id: string;
  slotStart: string | null;
  slotEnd: string | null;
  kindName: string | null;
  isTelemedicine: boolean;
  doctorUserId: string | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'doctor';
  text: string;
  time: string;
}

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['\"]|['\"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3000';
  try { new URL(b); return b; } catch { return 'http://localhost:3000'; }
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function TeleconsultationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointment');
  const doctorId = searchParams.get('doctor');
  const apiBase = useMemo(() => getApiBase(), []);

  const [loading, setLoading] = useState(true);
  const [notTelemedicine, setNotTelemedicine] = useState(false);
  const [apptInfo, setApptInfo] = useState<AppointmentInfo | null>(null);

  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    duration: 0,
    doctorName: 'Médecin',
    doctorSpecialty: '',
    doctorAvatarUrl: null,
  });

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cameraStarted, setCameraStarted] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Assign srcObject after <video> element mounts
  useEffect(() => {
    if (cameraStarted && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [cameraStarted]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        if (appointmentId) {
          const res = await fetch(`${apiBase}/appointments/${appointmentId}`, { headers, cache: 'no-store' });
          if (res.ok) {
            const appt = await res.json();
            const doctor = appt.doctor ?? appt.slot?.doctor;
            const kind = appt.kind;

            // Validate telemedicine flag
            if (kind && kind.isTelemedicine === false) {
              setNotTelemedicine(true);
              setLoading(false);
              return;
            }

            const slotStart = appt.slot?.startAt ?? appt.slotStart ?? null;
            const slotEnd = appt.slot?.endAt ?? appt.slotEnd ?? null;
            const doctorUserId = doctor?.id ?? null;

            setApptInfo({
              id: appointmentId,
              slotStart,
              slotEnd,
              kindName: kind?.name ?? null,
              isTelemedicine: kind?.isTelemedicine !== false,
              doctorUserId,
            });

            setCallState(prev => ({
              ...prev,
              doctorName: doctor?.fullName ? `Dr. ${doctor.fullName}` : 'Médecin',
              doctorSpecialty: kind?.name ?? doctor?.doctorProfile?.specialty ?? doctor?.specialty ?? '',
              doctorAvatarUrl: doctor?.avatarUrl ?? null,
            }));
          }
        } else if (doctorId) {
          const res = await fetch(`${apiBase}/doctor-profiles/${doctorId}`, { headers, cache: 'no-store' });
          if (res.ok) {
            const profile = await res.json();
            setCallState(prev => ({
              ...prev,
              doctorName: profile.user?.fullName ? `Dr. ${profile.user.fullName}` : 'Médecin',
              doctorSpecialty: profile.specialty ?? '',
              doctorAvatarUrl: profile.user?.avatarUrl ?? null,
            }));
            setApptInfo({
              id: '',
              slotStart: null,
              slotEnd: null,
              kindName: null,
              isTelemedicine: true,
              doctorUserId: profile.userId ?? profile.user?.id ?? doctorId,
            });
          }
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, doctorId, apiBase]);

  const startAudioAnalyzer = (stream: MediaStream) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a, b) => a + b, 0) / dataArray.length);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // AudioContext not available
    }
  };

  const stopCamera = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close().catch(() => null);
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
    setCameraStarted(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      startAudioAnalyzer(stream);
      setCameraStarted(true);
    } catch {
      setCameraError("Impossible d'accéder à la caméra ou au microphone. Vérifiez les permissions.");
    }
  };

  const startCall = async () => {
    setCallState(prev => ({ ...prev, status: 'connecting' }));
    await startCamera();

    setTimeout(() => {
      setCallState(prev => ({ ...prev, status: 'ringing' }));

      setTimeout(() => {
        setCallState(prev => ({ ...prev, status: 'connected' }));
        timerRef.current = setInterval(() => {
          setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      }, 3000);
    }, 1500);
  };

  const endCall = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopCamera();
    setCallState(prev => ({ ...prev, status: 'ended' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
    setIsMuted(newMuted);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const newOff = !isVideoOff;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !newOff; });
    setIsVideoOff(newOff);
  };

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return;
    if (isScreenSharing) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.stop();
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(camTrack);
      } catch { /* ignore */ }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(screenTrack);
        screenTrack.onended = () => setIsScreenSharing(false);
        setIsScreenSharing(true);
      } catch { /* user cancelled */ }
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const sendChatMessage = useCallback(async () => {
    const text = newChatMessage.trim();
    if (!text || sendingChat) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const tempId = `temp-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Optimistic update
    setChatMessages(prev => [...prev, { id: tempId, sender: 'user', text, time: timeStr }]);
    setNewChatMessage('');

    // Send via messages API if we know the doctor's userId
    const doctorUserId = apptInfo?.doctorUserId;
    if (doctorUserId) {
      setSendingChat(true);
      try {
        await fetch(`${apiBase}/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipientId: doctorUserId, content: text }),
        });
      } catch {
        // Message still shown locally even if API fails
      } finally {
        setSendingChat(false);
      }
    }
  }, [newChatMessage, sendingChat, apptInfo, apiBase]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    const parts = name.replace('Dr. ', '').split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isSpeaking = audioLevel > 15;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-slate-400">Préparation de la téléconsultation...</p>
        </div>
      </div>
    );
  }

  if (notTelemedicine) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Ce rendez-vous n'est pas une téléconsultation</h2>
          <p className="text-slate-400 mb-6">Ce type de rendez-vous se déroule en présentiel.</p>
          <button
            onClick={() => router.push('/appointments')}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
          >
            Mes rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="font-semibold text-white">Téléconsultation</h1>
              <p className="text-sm text-slate-400">{callState.doctorName} • {callState.doctorSpecialty}</p>
            </div>
          </div>

          {callState.status === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{formatDuration(callState.duration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative bg-slate-950">
          <div className="absolute inset-0 flex items-center justify-center">

            {/* IDLE */}
            {callState.status === 'idle' && (
              <div className="text-center max-w-sm mx-auto px-4">
                {/* Doctor avatar */}
                <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 overflow-hidden">
                  {callState.doctorAvatarUrl ? (
                    <img src={callState.doctorAvatarUrl} alt={callState.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(callState.doctorName)
                  )}
                </div>

                <h2 className="text-xl font-semibold text-white mb-1">{callState.doctorName}</h2>
                {callState.doctorSpecialty && (
                  <p className="text-teal-400 text-sm mb-4">{callState.doctorSpecialty}</p>
                )}

                {/* Appointment time info */}
                {apptInfo?.slotStart && (
                  <div className="flex flex-col gap-1.5 mb-6 bg-slate-800 rounded-xl p-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="capitalize">{formatDate(apptInfo.slotStart)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        {formatTime(apptInfo.slotStart)}
                        {apptInfo.slotEnd ? ` – ${formatTime(apptInfo.slotEnd)}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-slate-400 text-sm mb-4">Vérifiez votre caméra et microphone avant de commencer</p>
                {cameraError && (
                  <p className="text-red-400 text-sm mb-4">{cameraError}</p>
                )}
                <button
                  onClick={startCall}
                  className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Phone className="w-5 h-5" />
                  Démarrer l'appel
                </button>
              </div>
            )}

            {/* CONNECTING */}
            {callState.status === 'connecting' && (
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Connexion en cours...</h2>
                <p className="text-slate-400">Démarrage de la caméra</p>
              </div>
            )}

            {/* RINGING */}
            {callState.status === 'ringing' && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 animate-pulse overflow-hidden">
                  {callState.doctorAvatarUrl ? (
                    <img src={callState.doctorAvatarUrl} alt={callState.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(callState.doctorName)
                  )}
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Appel en cours...</h2>
                <p className="text-slate-400">{callState.doctorName}</p>
                <div className="flex items-center justify-center gap-1 mt-4">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* CONNECTED */}
            {callState.status === 'connected' && (
              <>
                {/* Remote video placeholder (doctor side) */}
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-teal-600 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4 overflow-hidden">
                      {callState.doctorAvatarUrl ? (
                        <img src={callState.doctorAvatarUrl} alt={callState.doctorName} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(callState.doctorName)
                      )}
                    </div>
                    <p className="text-white font-medium">{callState.doctorName}</p>
                    <p className="text-slate-400 text-sm">{callState.doctorSpecialty}</p>
                  </div>
                </div>

                {/* Audio level bars (top-right) */}
                <div className="absolute top-4 right-4 flex items-end gap-0.5 h-8">
                  {[0.3, 0.5, 0.7, 0.5, 0.3].map((base, i) => {
                    const barHeight = isSpeaking
                      ? Math.max(4, Math.min(32, (audioLevel / 255) * 32 * base * 3))
                      : 4;
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-75 ${isSpeaking ? 'bg-teal-400' : 'bg-slate-600'}`}
                        style={{ height: `${barHeight}px` }}
                      />
                    );
                  })}
                </div>

                {/* Local video (self) */}
                <div className="absolute bottom-24 right-4 w-48 h-36 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-600 shadow-lg">
                  {isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-slate-500" />
                    </div>
                  ) : cameraStarted ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ENDED */}
            {callState.status === 'ended' && (
              <div className="text-center">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Consultation terminée</h2>
                <p className="text-slate-400 mb-2">Durée : {formatDuration(callState.duration)}</p>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => router.push('/appointments')}
                    className="px-5 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                  >
                    Mes rendez-vous
                  </button>
                  {appointmentId && (
                    <button
                      onClick={() => router.push(`/reviews?pending=${appointmentId}`)}
                      className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
                    >
                      Évaluer la consultation
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls bar */}
          {(callState.status === 'connected' || callState.status === 'ringing') && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {/* Mic with pulsing ring when speaking */}
              <div className="relative">
                {isSpeaking && !isMuted && (
                  <span className="absolute inset-0 rounded-full bg-teal-500/40 animate-ping" />
                )}
                <button
                  onClick={toggleMic}
                  className={`relative p-4 rounded-full transition-colors ${
                    isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>

              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>

              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-colors ${
                  isScreenSharing ? 'bg-teal-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <MonitorUp className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSpeakerOff(!isSpeakerOff)}
                className={`p-4 rounded-full transition-colors ${
                  isSpeakerOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {isSpeakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-full transition-colors ${
                  showChat ? 'bg-teal-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <MessageSquare className="w-6 h-6" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-4 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Chat Panel — connected to messages API */}
        {showChat && callState.status === 'connected' && (
          <div className="w-80 border-l border-slate-700 flex flex-col bg-slate-800">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-medium text-white">Chat</h3>
              {!apptInfo?.doctorUserId && (
                <p className="text-xs text-slate-500 mt-0.5">Messages enregistrés localement</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-slate-500 text-sm text-center mt-4">Aucun message</p>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-xs opacity-70">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Message..."
                  value={newChatMessage}
                  onChange={e => setNewChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newChatMessage.trim() || sendingChat}
                  className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeleconsultationLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
        <p className="text-slate-400">Préparation de la téléconsultation...</p>
      </div>
    </div>
  );
}

export default function TeleconsultationPage() {
  return (
    <Suspense fallback={<TeleconsultationLoading />}>
      <TeleconsultationPageContent />
    </Suspense>
  );
}
