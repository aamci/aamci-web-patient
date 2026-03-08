'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Image,
  Paperclip,
  Smile,
  Clock,
  User,
  RefreshCw,
  X,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface Conversation {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConvoId = searchParams.get('conversation');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = user?.id || '';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const mapped: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          doctorId: conv.otherParticipant?.id || '',
          doctorName: conv.otherParticipant?.fullName || 'Médecin',
          doctorSpecialty: conv.otherParticipant?.doctorProfile?.specialty || '',
          doctorAvatar: conv.otherParticipant?.avatarUrl,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount || 0,
          isOnline: false,
          messages: [],
        }));
        setConversations(mapped);

        if (selectedConvoId) {
          const convo = mapped.find((c: Conversation) => c.id === selectedConvoId);
          if (convo) {
            setSelectedConversation(convo);
            setShowMobileList(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, selectedConvoId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [router, loadData]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectConversation = async (convo: Conversation) => {
    setSelectedConversation(convo);
    setShowMobileList(false);
    setLoadingMessages(true);
    router.push(`/messages?conversation=${convo.id}`, { scroll: false });

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load messages for this conversation
      const res = await fetch(`${apiBaseUrl}/messages/conversations/${convo.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = (data || []).map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          timestamp: m.createdAt,
          read: m.read,
          type: m.type?.toLowerCase() || 'text',
        }));

        const updated = { ...convo, messages: msgs, unreadCount: 0 };
        setSelectedConversation(updated);
        setConversations(prev => prev.map(c =>
          c.id === convo.id ? { ...c, unreadCount: 0 } : c
        ));
      }

      // Mark as read
      await fetch(`${apiBaseUrl}/messages/conversations/${convo.id}/read`, {
        method: 'POST',
        headers,
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedConversation.doctorId,
          content,
        }),
      });

      if (res.ok) {
        const sent = await res.json();
        const message: Message = {
          id: sent.id,
          senderId: currentUserId,
          content,  // Use original plaintext, not the API response (avoids encryption display bug)
          timestamp: sent.createdAt,
          read: false,
          type: 'text',
        };

        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id
            ? {
                ...c,
                messages: [...c.messages, message],
                lastMessage: content,
                lastMessageTime: message.timestamp,
              }
            : c
        ));

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message],
        } : null);
      } else {
        setNewMessage(content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const getInitials = (name: string) => {
    const parts = name.replace('Dr. ', '').split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredConversations = conversations.filter(c =>
    c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.doctorSpecialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-slate-400">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto h-[calc(100vh-64px)]">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-r border-slate-700 flex flex-col ${
            !showMobileList && selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-teal-500" />
                  Messages
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </h1>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Aucune conversation</p>
                </div>
              ) : (
                filteredConversations.map(convo => (
                  <button
                    key={convo.id}
                    onClick={() => selectConversation(convo)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-slate-800/50 transition-colors border-b border-slate-700/50 ${
                      selectedConversation?.id === convo.id ? 'bg-slate-800' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                        {getInitials(convo.doctorName)}
                      </div>
                      {convo.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white truncate">{convo.doctorName}</h3>
                        <span className="text-xs text-slate-500">
                          {convo.lastMessageTime && formatTime(convo.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{convo.doctorSpecialty}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-slate-400 truncate">{convo.lastMessage}</p>
                        {convo.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${
            showMobileList && !selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-700 flex items-center gap-4">
                  <button
                    onClick={() => {
                      setShowMobileList(true);
                      setSelectedConversation(null);
                      router.push('/messages', { scroll: false });
                    }}
                    className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                      {getInitials(selectedConversation.doctorName)}
                    </div>
                    {selectedConversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-medium text-white">{selectedConversation.doctorName}</h2>
                    <p className="text-xs text-slate-400">
                      {selectedConversation.isOnline ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/teleconsultation?doctor=${selectedConversation.doctorId}`)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
                      <p className="text-sm text-slate-400">Chargement des messages...</p>
                    </div>
                  ) : selectedConversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <MessageSquare className="w-10 h-10 text-slate-600 mb-3" />
                      <p className="text-sm text-slate-400">Aucun message pour le moment</p>
                      <p className="text-xs text-slate-500 mt-1">Envoyez le premier message</p>
                    </div>
                  ) : null}
                  {!loadingMessages && selectedConversation.messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUserId;
                    const showAvatar = !isMe && (
                      idx === 0 ||
                      selectedConversation.messages[idx - 1].senderId !== msg.senderId
                    );

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : ''}`}
                      >
                        {!isMe && (
                          <div className="w-8 h-8">
                            {showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white">
                                {getInitials(selectedConversation.doctorName)}
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'bg-teal-600 text-white rounded-br-md'
                              : 'bg-slate-700 text-white rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className="text-xs opacity-70">
                              {formatTime(msg.timestamp)}
                            </span>
                            {isMe && (
                              msg.read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-teal-300" />
                              ) : (
                                <Check className="w-3.5 h-3.5 opacity-70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                      <Image className="w-5 h-5" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Écrivez votre message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value.slice(0, 2000))}
                      onKeyPress={e => e.key === 'Enter' && sendMessage()}
                      maxLength={2000}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Empty state
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Vos messages</h2>
                  <p className="text-slate-400 max-w-sm">
                    Sélectionnez une conversation pour commencer à discuter avec votre médecin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessagesLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
        <p className="text-slate-400">Chargement des messages...</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesPageContent />
    </Suspense>
  );
}
