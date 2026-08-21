import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import VoiceCall from './VoiceCall';

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

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const messagesRef = useRef<any[]>([]);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    conversations, setConversations,
    activeConversationId, setActiveConversationId,
    messages, setMessages, addMessage, addPendingMessage, confirmPendingMessage,
    updateConversationLastMessage, markConversationRead,
    callState, setCallState, resetCallState,
    typingUsers, setTyping,
    onlineUsers, setUserOnline,
  } = useChatStore();

  messagesRef.current = messages;

  const { data: convData } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: adminData } = useQuery({
    queryKey: ['admin-user'],
    queryFn: async () => {
      const res = await api.get('/chat/admin-user');
      return res.data;
    },
  });

  useEffect(() => {
    if (convData?.conversations) setConversations(convData.conversations);
  }, [convData, setConversations]);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      const res = await api.get(`/chat/conversations/${activeConversationId}/messages`);
      return res.data;
    },
    enabled: !!activeConversationId,
  });

  useEffect(() => {
    if (messagesQuery.data?.messages) setMessages(messagesQuery.data.messages);
  }, [messagesQuery.data, setMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('new-message', (msg: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      const convId = msg.conversationId;
      if (convId === activeConversationId) {
        const pendingIndex = messagesRef.current.findIndex(
          (m: any) => m.id < 0 && m.senderId === user?.id && m.content === msg.content
        );
        if (pendingIndex !== -1) {
          confirmPendingMessage(messagesRef.current[pendingIndex].id, msg);
        } else {
          addMessage(msg);
        }
        socket.emit('mark-read', { conversationId: activeConversationId });
      }
    });

    socket.on('new-message-notification', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (data.conversationId === activeConversationId) {
        const pendingIndex = messagesRef.current.findIndex(
          (m: any) => m.id < 0 && m.senderId === user?.id && m.content === data.message.content
        );
        if (pendingIndex !== -1) {
          confirmPendingMessage(messagesRef.current[pendingIndex].id, data.message);
        } else {
          addMessage(data.message);
        }
        socket.emit('mark-read', { conversationId: activeConversationId });
      }
    });

    socket.on('messages-read', (data: { conversationId: number; readBy: number }) => {
      if (data.conversationId === activeConversationId) {
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
    socket.on('incoming-call', (data: { callerId: number; callerName: string }) => {
      setCallState({ isActive: true, isIncoming: true, callerId: data.callerId, callerName: data.callerName });
      setIsOpen(true);
    });
    socket.on('call-accepted', () => setCallState({ isActive: true, isIncoming: false }));
    socket.on('call-rejected', () => resetCallState());
    socket.on('call-ended', () => resetCallState());

    return () => {
      socket.off('new-message');
      socket.off('new-message-notification');
      socket.off('messages-read');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('user-online');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [activeConversationId, queryClient, addMessage, addPendingMessage, confirmPendingMessage, setMessages, user, setTyping, setUserOnline, setCallState, resetCallState]);

  const socket = getSocket();

  const startConversationWithAdmin = async () => {
    if (!adminData?.admin) return;
    const res = await api.post('/chat/conversations', { targetUserId: adminData.admin.id });
    const conv = res.data.conversation;
    setConversations([conv, ...conversations.filter((c) => c.id !== conv.id)]);
    setActiveConversationId(conv.id);
    socket.emit('join-conversation', conv.id);
    socket.emit('mark-read', { conversationId: conv.id });
    markConversationRead(conv.id);
  };

  const selectConversation = (convId: number) => {
    if (activeConversationId) socket.emit('leave-conversation', activeConversationId);
    setActiveConversationId(convId);
    socket.emit('join-conversation', convId);
    socket.emit('mark-read', { conversationId: convId });
    markConversationRead(convId);
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !activeConversationId) return;
    const content = inputValue.trim();
    const tempId = -(Date.now());
    const pendingMsg: any = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: user?.id || 0,
      content,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id || 0, firstName: user?.firstName || '', lastName: user?.lastName || '', role: user?.role },
    };
    addPendingMessage(pendingMsg);
    socket.emit('send-message', { conversationId: activeConversationId, content });
    socket.emit('stop-typing', { conversationId: activeConversationId });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTyping = () => {
    if (!activeConversationId) return;
    socket.emit('typing', { conversationId: activeConversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('stop-typing', { conversationId: activeConversationId }), 2000);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const getRoleBadge = (role?: string) => {
    if (role === 'ADMIN') return { label: 'Admin', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' };
    if (role === 'MENTOR') return { label: 'Mentor', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' };
    return { label: 'Élève', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
  };

  const getAvatarColor = (role?: string) => {
    if (role === 'ADMIN') return 'from-red-400 to-rose-500';
    if (role === 'MENTOR') return 'from-violet-400 to-purple-500';
    return 'from-blue-400 to-indigo-500';
  };

  if (callState.isActive && callState.isIncoming) return <VoiceCall />;

  return (
    <>
      {isOpen && callState.isActive && !callState.isIncoming && <VoiceCall />}

      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <div className="w-[380px] h-[580px] bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-dark shadow-gray-300/50 border border-gray-200/80 dark:border-dark-600 flex flex-col overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeConversationId ? (
                  <>
                    <button onClick={() => setActiveConversationId(null)} className="hover:bg-white/20 rounded-xl p-1.5 transition-all duration-200">
                      <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(activeConv?.otherUser?.role)} rounded-xl flex items-center justify-center shadow-md`}>
                      <span className="text-sm font-bold">
                        {activeConv?.otherUser?.firstName?.[0]}{activeConv?.otherUser?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{activeConv?.otherUser?.firstName} {activeConv?.otherUser?.lastName}</p>
                      <div className="flex items-center gap-1.5">
                        {typingUsers.get(activeConv?.otherUser?.id || 0) ? (
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            écrit...
                          </span>
                        ) : (
                          <span className="text-xs text-white/60">
                            {onlineUsers.has(activeConv?.otherUser?.id || 0) ? 'En ligne' : getRoleBadge(activeConv?.otherUser?.role).label}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">chat</span>
                    <div>
                      <span className="font-bold text-sm">Messages</span>
                      <p className="text-[11px] text-white/60">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeConversationId && (
                  <button
                    onClick={() => {
                      setCallState({ isActive: true, isIncoming: false, targetUserId: activeConv?.otherUser?.id, targetUserName: `${activeConv?.otherUser?.firstName} ${activeConv?.otherUser?.lastName}` });
                    }}
                    className="hover:bg-white/20 rounded-xl p-2 transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-xl">call</span>
                  </button>
                )}
                <button onClick={() => { setIsOpen(false); setActiveConversationId(null); }} className="hover:bg-white/20 rounded-xl p-2 transition-all duration-200">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!activeConversationId ? (
                <div className="p-2 space-y-1">
                  {/* Admin - toujours en haut */}
                  {adminData?.admin && (() => {
                    const adminConv = conversations.find((c) => c.otherUser?.role === 'ADMIN');
                    const isOnline = onlineUsers.has(adminData.admin.id);
                    if (adminConv) {
                      const isTyping = typingUsers.get(adminConv.otherUser?.id || 0);
                      return (
                        <button
                          onClick={() => selectConversation(adminConv.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 text-left group"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200 group-hover:scale-105">
                              <span className="material-symbols-outlined text-white text-xl">support_agent</span>
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800 shadow-sm" />
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
                            <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">
                              {isTyping ? (
                                <span className="text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
                                  <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-red-500/5 to-rose-500/5 dark:from-red-500/10 dark:to-rose-500/10 hover:from-red-500/10 hover:to-rose-500/10 dark:hover:from-red-500/15 dark:hover:to-rose-500/15 transition-all duration-200 text-left group border border-dashed border-red-200 dark:border-red-800/40"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200 group-hover:scale-105">
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
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase">Autres conversations</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
                    </div>
                  )}

                  {/* Autres conversations */}
                  {conversations.filter(c => c.otherUser?.role !== 'ADMIN').length > 0 ? (
                    conversations.filter(c => c.otherUser?.role !== 'ADMIN').map((conv) => {
                      const badge = getRoleBadge(conv.otherUser?.role);
                      const isOnline = onlineUsers.has(conv.otherUser?.id || 0);
                      const isTyping = typingUsers.get(conv.otherUser?.id || 0);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 text-left group"
                        >
                          <div className="relative flex-shrink-0">
                            <div className={`w-11 h-11 bg-gradient-to-br ${getAvatarColor(conv.otherUser?.role)} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                              <span className="text-sm font-bold text-white">
                                {conv.otherUser?.firstName?.[0]}{conv.otherUser?.lastName?.[0]}
                              </span>
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800 shadow-sm" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                                </p>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.color}`}>{badge.label}</span>
                              </div>
                              {conv.unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-1">
                                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">
                              {isTyping ? (
                                <span className="text-blue-500 dark:text-blue-400 font-medium">En train d'écrire...</span>
                              ) : (
                                conv.lastMessage?.content || 'Aucun message'
                              )}
                            </p>
                          </div>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-gray-400 dark:text-dark-500 flex-shrink-0 ml-1">
                              {timeAgo(conv.lastMessage.createdAt || conv.updatedAt)}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-10 text-center">
                      <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-dark-600">forum</span>
                      <p className="text-sm text-gray-400 dark:text-dark-400 mt-3 font-medium">Aucune conversation</p>
                      <p className="text-xs text-gray-300 dark:text-dark-500 mt-1">Contactez votre mentor ou l'administration</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[80%]">
                            {!isMine && (
                              <p className="text-[10px] text-gray-400 dark:text-dark-500 mb-1 ml-1 font-medium">
                                {msg.sender?.firstName} {msg.sender?.lastName}
                              </p>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl ${
                              isMine
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md shadow-md shadow-blue-500/20'
                                : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-md'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1.5 ${isMine ? 'text-white/50' : 'text-gray-400 dark:text-dark-500'}`}>
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
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Écrire un message..."
                        className="flex-1 px-4 py-3 bg-white dark:bg-dark-800 dark:text-white border border-gray-200 dark:border-dark-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim()}
                        className="w-11 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-40 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-xl">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 dark:shadow-blue-500/30"
          >
            <span className="material-symbols-outlined text-2xl">chat</span>
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800 shadow-md min-w-[22px] min-h-[22px]">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
