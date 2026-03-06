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
  Settings,
  Maximize2,
  Minimize2,
  MonitorUp,
  Users,
  Clock,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Camera,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended';
  duration: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
}

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['\"]|['\"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3000';
  try { new URL(b); return b; } catch { return 'http://localhost:3000'; }
}

function TeleconsultationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointment');
  const doctorId = searchParams.get('doctor');
  const apiBase = useMemo(() => getApiBase(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    duration: 0,
    doctorName: 'Médecin',
    doctorSpecialty: '',
  });

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch appointment data if appointmentId provided
        if (appointmentId) {
          const res = await fetch(`${apiBase}/appointments/${appointmentId}`, { headers, cache: 'no-store' });
          if (res.ok) {
            const appt = await res.json();
            const doctor = appt.doctor ?? appt.slot?.doctor;
            setCallState(prev => ({
              ...prev,
              doctorName: doctor?.fullName ? `Dr. ${doctor.fullName}` : 'Médecin',
              doctorSpecialty: appt.kind?.name ?? doctor?.specialty ?? '',
            }));
          }
        } else if (doctorId) {
          // Fetch doctor profile directly
          const res = await fetch(`${apiBase}/doctor-profiles/${doctorId}`, { headers, cache: 'no-store' });
          if (res.ok) {
            const profile = await res.json();
            setCallState(prev => ({
              ...prev,
              doctorName: profile.user?.fullName ? `Dr. ${profile.user.fullName}` : 'Médecin',
              doctorSpecialty: profile.specialty ?? '',
            }));
          }
        }

        // Notify API that video session started
        if (appointmentId) {
          await fetch(`${apiBase}/appointments/${appointmentId}/start-video`, {
            method: 'POST',
            headers,
          }).catch(() => null);
        }
      } catch {
        // Non-critical — continue with defaults
      } finally {
        setLoading(false);
        setTimeout(() => startCall(), 500);
      }
    };

    load();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, doctorId, apiBase]);

  const startCall = () => {
    setCallState(prev => ({ ...prev, status: 'connecting' }));

    // Simulate connection
    setTimeout(() => {
      setCallState(prev => ({ ...prev, status: 'ringing' }));

      // Simulate doctor answering
      setTimeout(() => {
        setCallState(prev => ({ ...prev, status: 'connected' }));

        // Start timer
        timerRef.current = setInterval(() => {
          setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      }, 3000);
    }, 2000);
  };

  const endCall = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallState(prev => ({ ...prev, status: 'ended' }));

    // Notify API that video session ended
    if (appointmentId) {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${apiBase}/appointments/${appointmentId}/end-video`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
      }
    }
  }, [appointmentId, apiBase]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const sendChatMessage = () => {
    if (!newChatMessage.trim()) return;

    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewChatMessage('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    const parts = name.replace('Dr. ', '').split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-900 flex flex-col"
    >
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">{formatDuration(callState.duration)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative bg-slate-950">
          {/* Remote Video (Doctor) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {callState.status === 'idle' && (
              <div className="text-center">
                <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Prêt pour la consultation</h2>
                <p className="text-slate-400 mb-6">Vérifiez votre caméra et microphone avant de commencer</p>
                <button
                  onClick={startCall}
                  className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Phone className="w-5 h-5" />
                  Démarrer l'appel
                </button>
              </div>
            )}

            {callState.status === 'connecting' && (
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Connexion en cours...</h2>
                <p className="text-slate-400">Veuillez patienter</p>
              </div>
            )}

            {callState.status === 'ringing' && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 animate-pulse">
                  {getInitials(callState.doctorName)}
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

            {callState.status === 'connected' && (
              <>
                {/* Simulated doctor video - would be real video stream */}
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-teal-600 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
                      {getInitials(callState.doctorName)}
                    </div>
                    <p className="text-white font-medium">{callState.doctorName}</p>
                    <p className="text-slate-400 text-sm">{callState.doctorSpecialty}</p>
                  </div>
                </div>

                {/* Local Video (Self) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-600 shadow-lg">
                  {isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-slate-500" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                </div>
              </>
            )}

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
                  <button
                    onClick={() => router.push(`/reviews?pending=${appointmentId}`)}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
                  >
                    Évaluer la consultation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {(callState.status === 'connected' || callState.status === 'ringing') && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
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

        {/* Chat Panel */}
        {showChat && callState.status === 'connected' && (
          <div className="w-80 border-l border-slate-700 flex flex-col bg-slate-800">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-medium text-white">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-xs opacity-70">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Message..."
                  value={newChatMessage}
                  onChange={e => setNewChatMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newChatMessage.trim()}
                  className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-5 h-5" />
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
