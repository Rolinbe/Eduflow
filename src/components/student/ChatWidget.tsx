import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import VoiceCall from './VoiceCall';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'call'>('chats');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    conversations, setConversations,
    activeConversationId, setActiveConversationId,
    messages, setMessages, addMessage,
    updateConversationLastMessage, markConversationRead,
    callState, setCallState, resetCallState,
    typingUsers, setTyping,
    onlineUsers, setUserOnline,
  } = useChatStore();

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

  // Socket events
  useEffect(() => {
    const socket = getSocket();

    socket.on('new-message-notification', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (data.conversationId === activeConversationId) {
        addMessage(data.message);
        socket.emit('mark-read', { conversationId: activeConversationId });
      }
    });

    socket.on('user-typing', (data: { userId: number }) => {
      setTyping(data.userId, true);
    });

    socket.on('user-stop-typing', (data: { userId: number }) => {
      setTyping(data.userId, false);
    });

    socket.on('user-online', (data: { userId: number; online: boolean }) => {
      setUserOnline(data.userId, data.online);
    });

    socket.on('incoming-call', (data: { callerId: number; callerName: string }) => {
      setCallState({ isActive: true, isIncoming: true, callerId: data.callerId, callerName: data.callerName });
      setActiveTab('call');
      setIsOpen(true);
    });

    socket.on('call-accepted', () => {
      setCallState({ isActive: true, isIncoming: false });
    });

    socket.on('call-rejected', () => {
      resetCallState();
    });

    socket.on('call-ended', () => {
      resetCallState();
    });

    return () => {
      socket.off('new-message-notification');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('user-online');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [activeConversationId, queryClient, addMessage, setTyping, setUserOnline, setCallState, resetCallState]);

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

  const socket = getSocket();

  const selectConversation = (convId: number) => {
    if (activeConversationId) {
      socket.emit('leave-conversation', activeConversationId);
    }
    setActiveConversationId(convId);
    socket.emit('join-conversation', convId);
    socket.emit('mark-read', { conversationId: convId });
    markConversationRead(convId);
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !activeConversationId) return;
    socket.emit('send-message', { conversationId: activeConversationId, content: inputValue.trim() });
    socket.emit('stop-typing', { conversationId: activeConversationId });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!activeConversationId) return;
    socket.emit('typing', { conversationId: activeConversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId: activeConversationId });
    }, 2000);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const hasConversation = conversations.some((c) => c.otherUser?.role === 'ADMIN');

  if (callState.isActive && callState.isIncoming) {
    return <VoiceCall />;
  }

  return (
    <>
      {isOpen && callState.isActive && !callState.isIncoming && <VoiceCall />}

      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <div className="w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="bg-primary-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeConversationId ? (
                  <>
                    <button onClick={() => setActiveConversationId(null)} className="hover:bg-white/20 rounded-full p-1">
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {activeConv?.otherUser?.firstName?.[0]}{activeConv?.otherUser?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{activeConv?.otherUser?.firstName} {activeConv?.otherUser?.lastName}</p>
                      <p className="text-xs text-white/70">
                        {typingUsers.get(activeConv?.otherUser?.id || 0) ? 'En train d\'écrire...' : 'Admin'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">chat</span>
                    <span className="font-semibold">Messages</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeConversationId && (
                  <button
                    onClick={() => {
                      setActiveTab('call');
                      setCallState({ isActive: true, isIncoming: false, targetUserId: activeConv?.otherUser?.id, targetUserName: `${activeConv?.otherUser?.firstName} ${activeConv?.otherUser?.lastName}` });
                    }}
                    className="hover:bg-white/20 rounded-full p-2"
                  >
                    <span className="material-symbols-outlined">call</span>
                  </button>
                )}
                <button onClick={() => { setIsOpen(false); setActiveConversationId(null); }} className="hover:bg-white/20 rounded-full p-2">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!activeConversationId ? (
                <div className="p-3 space-y-1">
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="relative">
                          <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">
                              {conv.otherUser?.firstName?.[0]}{conv.otherUser?.lastName?.[0]}
                            </span>
                          </div>
                          {onlineUsers.has(conv.otherUser?.id || 0) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.lastMessage?.content || 'Pas de message'}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300">forum</span>
                      <p className="text-sm text-gray-500 mt-2">Aucune conversation</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? 'bg-primary-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Écrire un message..."
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim()}
                        className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50"
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
            className="relative w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">chat</span>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
