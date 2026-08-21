import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../services/socket';
import type { Conversation, ChatMessage, User } from '../../types';

export default function MentorChatPage() {
  const [searchParams] = useSearchParams();
  const targetStudentId = searchParams.get('student');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: convData } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data.conversations;
    },
    refetchInterval: 10000,
  });

  const conversations: Conversation[] = convData || [];

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
    refetchInterval: 5000,
  });

  const messages: ChatMessage[] = msgData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select conversation from query param
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
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConv || !message.trim()) return;
      return api.post(`/chat/conversations/${selectedConv.id}/messages`, { content: message.trim() });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MentorLayout title="Messages">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          {/* Conversations list */}
          <div className={`w-80 border-r border-gray-100 dark:border-dark-700 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
              {showNewConv ? (
                <>
                  <button onClick={() => { setShowNewConv(false); setStudentSearch(''); }} className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Retour
                  </button>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Nouvelle conversation</h3>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-gray-900 dark:text-white">Conversations</h3>
                  <button onClick={() => setShowNewConv(true)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200" title="Nouvelle conversation">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {showNewConv ? (
                <>
                  <div className="p-3">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-500 text-lg">search</span>
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
                        placeholder="Rechercher un élève..."
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5 px-2">
                    {(studentsData || [])
                      .filter((s: any) => {
                        if (!studentSearch.trim()) return true;
                        const q = studentSearch.toLowerCase();
                        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                      })
                      .map((student: any) => (
                        <button
                          key={student.id}
                          onClick={() => {
                            createConvMutation.mutate(student.id);
                            setShowNewConv(false);
                            setStudentSearch('');
                          }}
                          disabled={createConvMutation.isPending}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-200 text-left disabled:opacity-50"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-400 dark:text-dark-400 truncate">{student.email}</p>
                          </div>
                          <span className="material-symbols-outlined text-lg text-gray-300 dark:text-dark-500">chat</span>
                        </button>
                      ))}
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
                </>
              ) : (
                <>
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv)}
                        className={`w-full flex items-center gap-3 p-4 transition-all duration-200 text-left ${
                          selectedConv?.id === conv.id
                            ? 'bg-violet-50 dark:bg-violet-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {conv.otherUser?.firstName?.[0]}{conv.otherUser?.lastName?.[0]}
                          </span>
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
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-white">
                    {selectedConv.otherUser?.firstName?.[0]}{selectedConv.otherUser?.lastName?.[0]}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedConv.otherUser?.firstName} {selectedConv.otherUser?.lastName}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <LoadingSpinner className="py-8" />
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400 dark:text-dark-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    rows={1}
                    placeholder="Écrire un message..."
                  />
                  <button onClick={handleSend} disabled={!message.trim()} className="w-11 h-11 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-violet-700 transition-all duration-200 disabled:opacity-50">
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
