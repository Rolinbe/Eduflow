import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import VoiceCall from '../student/VoiceCall';

export default function ChatPanel() {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
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
    queryKey: ['admin-chat-conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['admin-students-list'],
    queryFn: async () => {
      const res = await api.get('/chat/students');
      return res.data;
    },
    enabled: showNewChat,
  });

  useEffect(() => {
    if (convData?.conversations) setConversations(convData.conversations);
  }, [convData, setConversations]);

  const messagesQuery = useQuery({
    queryKey: ['admin-chat-messages', activeConversationId],
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
      queryClient.invalidateQueries({ queryKey: ['admin-chat-conversations'] });
      if (data.conversationId === activeConversationId) {
        addMessage(data.message);
        socket.emit('mark-read', { conversationId: activeConversationId });
      }
    });

    socket.on('message-sent', (data: any) => {
      addMessage(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-chat-conversations'] });
    });

    socket.on('user-typing', (data: { userId: number }) => setTyping(data.userId, true));
    socket.on('user-stop-typing', (data: { userId: number }) => setTyping(data.userId, false));
    socket.on('user-online', (data: { userId: number; online: boolean }) => setUserOnline(data.userId, data.online));

    socket.on('incoming-call', (data: { callerId: number; callerName: string }) => {
      setCallState({ isActive: true, isIncoming: true, callerId: data.callerId, callerName: data.callerName });
    });
    socket.on('call-accepted', () => setCallState({ isActive: true, isIncoming: false }));
    socket.on('call-rejected', () => resetCallState());
    socket.on('call-ended', () => resetCallState());

    return () => {
      socket.off('new-message-notification');
      socket.off('message-sent');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('user-online');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [activeConversationId, queryClient, addMessage, setTyping, setUserOnline, setCallState, resetCallState]);

  const startConversation = async (studentId: number) => {
    const res = await api.post('/chat/conversations', { targetUserId: studentId });
    const conv = res.data.conversation;
    const existing = conversations.find((c) => c.id === conv.id);
    if (!existing) {
      setConversations([conv, ...conversations]);
    }
    setActiveConversationId(conv.id);
    getSocket().emit('join-conversation', conv.id);
    getSocket().emit('mark-read', { conversationId: conv.id });
    markConversationRead(conv.id);
    setShowNewChat(false);
    queryClient.invalidateQueries({ queryKey: ['admin-chat-conversations'] });
  };

  const selectConversation = (convId: number) => {
    getSocket().emit('leave-conversation', activeConversationId!);
    setActiveConversationId(convId);
    getSocket().emit('join-conversation', convId);
    getSocket().emit('mark-read', { conversationId: convId });
    markConversationRead(convId);
    queryClient.invalidateQueries({ queryKey: ['admin-chat-conversations'] });
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !activeConversationId) return;
    getSocket().emit('send-message', { conversationId: activeConversationId, content: inputValue.trim() });
    getSocket().emit('stop-typing', { conversationId: activeConversationId });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTyping = () => {
    if (!activeConversationId) return;
    getSocket().emit('typing', { conversationId: activeConversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getSocket().emit('stop-typing', { conversationId: activeConversationId });
    }, 2000);
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const filteredStudents = studentsData?.students?.filter((s: any) =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (callState.isActive && callState.isIncoming) {
    return <VoiceCall />;
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-dark-800 rounded-xl shadow-card overflow-hidden border border-gray-100 dark:border-dark-600 transition-colors duration-300">
      {callState.isActive && !callState.isIncoming && <VoiceCall />}

      {/* Sidebar: conversations list */}
      <div className={`w-80 border-r border-gray-100 dark:border-dark-700 flex flex-col transition-colors duration-300 ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-dark-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="w-9 h-9 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-xl">add_comment</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 dark:text-white dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase">Nouvelle conversation</p>
                <button onClick={() => setShowNewChat(false)} className="text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              {filteredStudents.map((student: any) => {
                const existingConv = conversations.find((c) => c.otherUser?.id === student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => existingConv ? selectConversation(existingConv.id) : startConversation(student.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 text-left"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">{student.firstName[0]}{student.lastName[0]}</span>
                      </div>
                      {onlineUsers.has(student.id) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-800" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-400 dark:text-dark-400">{student.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 text-left border-b border-gray-50 dark:border-dark-700 ${
                  activeConversationId === conv.id ? 'bg-primary-50 dark:bg-primary-500/10 border-l-2 border-l-primary-500' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {conv.otherUser?.firstName?.[0]}{conv.otherUser?.lastName?.[0]}
                    </span>
                  </div>
                  {onlineUsers.has(conv.otherUser?.id || 0) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">
                    {conv.lastMessage?.content || 'Pas de message'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-dark-500">forum</span>
              <p className="text-sm text-gray-500 dark:text-dark-400 mt-2">Aucune conversation</p>
              <p className="text-xs text-gray-400 dark:text-dark-400 mt-1">Cliquez + pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${activeConversationId ? 'flex' : 'hidden lg:flex'}`}>
        {activeConversationId && activeConv ? (
          <>
            <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between bg-white dark:bg-dark-800 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="lg:hidden text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 transition-colors duration-200"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {activeConv.otherUser?.firstName?.[0]}{activeConv.otherUser?.lastName?.[0]}
                    </span>
                  </div>
                  {onlineUsers.has(activeConv.otherUser?.id || 0) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-800" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activeConv.otherUser?.firstName} {activeConv.otherUser?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {typingUsers.get(activeConv.otherUser?.id || 0) ? (
                      <span className="text-primary-500">En train d'écrire...</span>
                    ) : onlineUsers.has(activeConv.otherUser?.id || 0) ? (
                      <span className="text-green-500">En ligne</span>
                    ) : 'Hors ligne'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCallState({
                    isActive: true,
                    isIncoming: false,
                    targetUserId: activeConv.otherUser?.id,
                    targetUserName: `${activeConv.otherUser?.firstName} ${activeConv.otherUser?.lastName}`,
                  });
                }}
                className="w-9 h-9 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors duration-200"
                title="Appel vocal"
              >
                <span className="material-symbols-outlined">call</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-700">
                          {activeConv.otherUser?.firstName?.[0]}
                        </span>
                      </div>
                    )}
                    <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl ${
                      isMine
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-dark-600'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400 dark:text-dark-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {isMine && msg.status === 'READ' && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-dark-900 dark:text-white dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 transition-colors duration-200"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="w-11 h-11 bg-primary-500 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:scale-105"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">forum</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">Messagerie</h3>
              <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Sélectionnez une conversation ou commencez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
