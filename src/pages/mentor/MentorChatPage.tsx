import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { getSocket } from '../../services/socket';
import type { Conversation, User } from '../../types';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffJ = Math.floor(diffH / 24);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffJ < 7) return `${diffJ}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function MentorChatPage() {
  const [searchParams] = useSearchParams();
  const targetStudentId = searchParams.get('student');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<any[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    messages, setMessages, addMessage, addPendingMessage, confirmPendingMessage,
    typingUsers, setTyping,
    onlineUsers, setUserOnline,
  } = useChatStore();

  messagesRef.current = messages;

  const { data: convData } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data.conversations;
    },
    refetchInterval: 10000,
  });

  const conversations: Conversation[] = convData || [];

  const { data: adminData } = useQuery({
    queryKey: ['admin-user'],
    queryFn: async () => {
      const res = await api.get('/chat/admin-user');
      return res.data;
    },
  });

  const { data: studentsData } = useQuery({
    queryKey: ['mentor-chat-students'],
    queryFn: async () => {
      const res = await api.get('/mentor/chat/students');
      return res.data.students;
    },
  });

  const { data: msgData, isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-messages', selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv) return null;
      const res = await api.get(`/chat/conversations/${selectedConv.id}/messages`);
      return res.data;
    },
    enabled: !!selectedConv,
  });

  useEffect(() => {
    if (msgData?.messages) setMessages(msgData.messages);
  }, [msgData, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (targetStudentId && conversations.length > 0) {
      const student = conversations.find(c => c.otherUser?.id === parseInt(targetStudentId));
      if (student) setSelectedConv(student);
    }
  }, [targetStudentId, conversations]);

  const createConvMutation = useMutation({
    mutationFn: async (studentId: number) => api.post('/chat/conversations', { targetUserId: studentId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      setSelectedConv(res.data.conversation);
      getSocket().emit('join-conversation', res.data.conversation.id);
    },
  });

  const startConversationWithAdmin = async () => {
    if (!adminData?.admin) return;
    const existingConv = conversations.find(c => c.otherUser?.id === adminData.admin.id);
    if (existingConv) {
      setSelectedConv(existingConv);
      getSocket().emit('join-conversation', existingConv.id);
      getSocket().emit('mark-read', { conversationId: existingConv.id });
      return;
    }
    const res = await api.post('/chat/conversations', { targetUserId: adminData.admin.id });
    const conv = res.data.conversation;
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    setSelectedConv(conv);
    getSocket().emit('join-conversation', conv.id);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new-message', (msg: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (selectedConv && msg.conversationId === selectedConv.id) {
        const pendingIndex = messagesRef.current.findIndex(
          (m: any) => m.id < 0 && m.senderId === user?.id && m.content === msg.content
        );
        if (pendingIndex !== -1) {
          confirmPendingMessage(messagesRef.current[pendingIndex].id, msg);
        } else {
          addMessage(msg);
        }
        socket.emit('mark-read', { conversationId: selectedConv.id });
      }
    });

    socket.on('new-message-notification', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (selectedConv && data.conversationId === selectedConv.id) {
        const pendingIndex = messagesRef.current.findIndex(
          (m: any) => m.id < 0 && m.senderId === user?.id && m.content === data.message.content
        );
        if (pendingIndex !== -1) {
          confirmPendingMessage(messagesRef.current[pendingIndex].id, data.message);
        } else {
          addMessage(data.message);
        }
        socket.emit('mark-read', { conversationId: selectedConv.id });
      }
    });

    socket.on('messages-read', (data: { conversationId: number; readBy: number }) => {
      if (selectedConv && data.conversationId === selectedConv.id) {
        setMessages(
          messagesRef.current.map((m: any) =>
            m.senderId === user?.id && m.status !== 'READ' ? { ...m, status: 'READ' as const } : m
          )
        );
      }
    });

    socket.on('user-typing', (data: { userId: number }) => setTyping(data.userId, true));
    socket.on('user-stop-typing', (data: { userId: number }) => setTyping(data.userId, false));
    socket.on('user-online', (data: { userId: number; online: boolean }) => setUserOnline(data.userId, data.online));

    return () => {
      socket.off('new-message');
      socket.off('new-message-notification');
      socket.off('messages-read');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('user-online');
    };
  }, [selectedConv, queryClient, addMessage, addPendingMessage, confirmPendingMessage, setMessages, user, setTyping, setUserOnline]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedConv) return;
    socket.emit('join-conversation', selectedConv.id);
    socket.emit('mark-read', { conversationId: selectedConv.id });
    return () => { socket.emit('leave-conversation', selectedConv.id); };
  }, [selectedConv]);

  const sendMessage = () => {
    if (!selectedConv || !inputValue.trim()) return;
    const content = inputValue.trim();
    const tempId = -(Date.now());
    const pendingMsg: any = {
      id: tempId,
      conversationId: selectedConv.id,
      senderId: user?.id || 0,
      content,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id || 0, firstName: user?.firstName || '', lastName: user?.lastName || '', role: user?.role },
    };
    addPendingMessage(pendingMsg);
    getSocket().emit('send-message', { conversationId: selectedConv.id, content });
    getSocket().emit('stop-typing', { conversationId: selectedConv.id });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!selectedConv) return;
    getSocket().emit('typing', { conversationId: selectedConv.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getSocket().emit('stop-typing', { conversationId: selectedConv.id });
    }, 2000);
  };

  return (
    <MentorLayout title="Messages">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          {/* Conversations list */}
          <div className={`w-80 border-r border-gray-100 dark:border-dark-700 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
                <button
                  onClick={() => setShowNewConv(!showNewConv)}
                  className="w-9 h-9 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-xl">add_comment</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 dark:text-white dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {showNewConv ? (
                <div className="p-2">
                  <div className="flex items-center justify-between px-3 py-2 mb-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase">Nouvelle conversation</p>
                    <button onClick={() => { setShowNewConv(false); setStudentSearch(''); }} className="text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                  {(studentsData || [])
                    .filter((s: any) => {
                      if (!studentSearch.trim()) return true;
                      const q = studentSearch.toLowerCase();
                      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                    })
                    .map((student: any) => {
                      const existingConv = conversations.find(c => c.otherUser?.id === student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            if (existingConv) {
                              setSelectedConv(existingConv);
                              getSocket().emit('join-conversation', existingConv.id);
                              getSocket().emit('mark-read', { conversationId: existingConv.id });
                            } else {
                              createConvMutation.mutate(student.id);
                            }
                            setShowNewConv(false);
                            setStudentSearch('');
                          }}
                          disabled={createConvMutation.isPending}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 text-left disabled:opacity-50"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary-700">{student.firstName[0]}{student.lastName[0]}</span>
                            </div>
                            {onlineUsers.has(student.id) && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-800" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-400 dark:text-dark-400">{student.email}</p>
                          </div>
                          {existingConv ? (
                            <span className="material-symbols-outlined text-lg text-gray-300 dark:text-dark-500">chat</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg text-primary-400 dark:text-primary-500">add_comment</span>
                          )}
                        </button>
                      );
                    })}
                  {studentsData && studentsData.filter((s: any) => {
                    if (!studentSearch.trim()) return true;
                    const q = studentSearch.toLowerCase();
                    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                  }).length === 0 && (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-dark-500">person_search</span>
                      <p className="text-sm text-gray-400 dark:text-dark-400 mt-2">Aucun élève trouvé</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Admin - toujours en haut */}
                  {adminData?.admin && (() => {
                    const adminConv = conversations.find(c => c.otherUser?.role === 'ADMIN');
                    const isOnline = onlineUsers.has(adminData.admin.id);
                    if (adminConv) {
                      const isTyping = typingUsers.get(adminConv.otherUser?.id || 0);
                      return (
                        <button
                          onClick={() => { setSelectedConv(adminConv); getSocket().emit('join-conversation', adminConv.id); getSocket().emit('mark-read', { conversationId: adminConv.id }); }}
                          className={`w-full flex items-center gap-3 p-4 transition-all duration-200 text-left group ${
                            selectedConv?.id === adminConv.id ? 'bg-red-50/80 dark:bg-red-900/15' : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200 group-hover:scale-105">
                              <span className="material-symbols-outlined text-white text-xl">support_agent</span>
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800" />
                            )}
                            {adminConv.unreadCount > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-dark-800 px-1">
                                {adminConv.unreadCount > 9 ? '9+' : adminConv.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Administration</p>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">OFFICIEL</span>
                              </div>
                              {adminConv.lastMessage && (
                                <span className="text-[10px] text-gray-400 dark:text-dark-500 flex-shrink-0">
                                  {timeAgo(adminConv.lastMessage.createdAt || adminConv.updatedAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-dark-400 truncate mt-0.5">
                              {isTyping ? (
                                <span className="text-violet-500 font-medium flex items-center gap-1">
                                  <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </span>
                                  écrit...
                                </span>
                              ) : (
                                adminConv.lastMessage?.content || 'Contacter l\'administration'
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={startConversationWithAdmin}
                        className="w-full flex items-center gap-3 p-4 transition-all duration-200 text-left group bg-gradient-to-r from-red-500/5 to-rose-500/5 dark:from-red-500/10 dark:to-rose-500/10 hover:from-red-500/10 hover:to-rose-500/10 dark:hover:from-red-500/15 dark:hover:to-rose-500/15 border-b border-dashed border-red-200 dark:border-red-800/40"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200 group-hover:scale-105 flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-xl">support_agent</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Administration</p>
                          <p className="text-xs text-gray-500 dark:text-dark-400">Commencer une conversation</p>
                        </div>
                        <span className="material-symbols-outlined text-red-400 dark:text-red-500 text-lg">arrow_forward</span>
                      </button>
                    );
                  })()}

                  {/* Séparateur */}
                  {adminData?.admin && conversations.filter(c => c.otherUser?.role !== 'ADMIN').length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase">Élèves</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
                    </div>
                  )}

                  {/* Conversations élèves */}
                  {conversations.filter(c => c.otherUser?.role !== 'ADMIN').length > 0 ? (
                    conversations.filter(c => c.otherUser?.role !== 'ADMIN').map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv)}
                        className={`w-full flex items-center gap-3 p-4 transition-all duration-200 text-left ${
                          selectedConv?.id === conv.id
                            ? 'bg-violet-50 dark:bg-violet-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-sm font-bold text-white">
                              {conv.otherUser?.firstName?.[0]}{conv.otherUser?.lastName?.[0]}
                            </span>
                          </div>
                          {onlineUsers.has(conv.otherUser?.id || 0) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-400 dark:text-dark-400 truncate">{conv.lastMessage.content}</p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{conv.unreadCount}</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-dark-500">chat</span>
                      <p className="text-sm text-gray-400 dark:text-dark-400 mt-2">Aucune conversation</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages area */}
          {selectedConv ? (
            <div className={`flex-1 flex flex-col ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-dark-700">
                <button onClick={() => setSelectedConv(null)} className="md:hidden material-symbols-outlined text-gray-400">arrow_back</button>
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold text-white">
                      {selectedConv.otherUser?.firstName?.[0]}{selectedConv.otherUser?.lastName?.[0]}
                    </span>
                  </div>
                  {onlineUsers.has(selectedConv.otherUser?.id || 0) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedConv.otherUser?.firstName} {selectedConv.otherUser?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-dark-400">
                    {typingUsers.get(selectedConv.otherUser?.id || 0) ? (
                      <span className="text-primary-500">En train d'écrire...</span>
                    ) : onlineUsers.has(selectedConv.otherUser?.id || 0) ? (
                      <span className="text-emerald-500">En ligne</span>
                    ) : 'Hors ligne'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <LoadingSpinner className="py-8" />
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs lg:max-w-md">
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? 'bg-primary-500 text-white rounded-br-md'
                              : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-dark-600'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-white/60' : 'text-gray-400 dark:text-dark-400'}`}>
                              <span className="text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && (
                                <span className="ml-0.5">
                                  {msg.status === 'PENDING' ? (
                                    <span className="material-symbols-outlined text-[11px] animate-spin">progress_activity</span>
                                  ) : msg.status === 'SENT' ? (
                                    <span className="material-symbols-outlined text-[11px]">done</span>
                                  ) : msg.status === 'DELIVERED' ? (
                                    <span className="material-symbols-outlined text-[11px]">done_all</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-[11px] text-blue-200">done_all</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-dark-700">
                <div className="flex items-end gap-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={1}
                    placeholder="Écrire un message..."
                  />
                  <button onClick={sendMessage} disabled={!inputValue.trim()} className="w-11 h-11 bg-primary-500 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:scale-105">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">forum</span>
                <p className="text-gray-400 dark:text-dark-400 mt-3 font-medium">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MentorLayout>
  );
}
