import { create } from 'zustand';
import type { User } from '../types';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  sender?: { id: number; firstName: string; lastName: string; role?: string };
}

export interface Conversation {
  id: number;
  otherUser: User;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface CallState {
  isActive: boolean;
  isIncoming: boolean;
  callerId?: number;
  callerName?: string;
  targetUserId?: number;
  targetUserName?: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: ChatMessage[];
  typingUsers: Map<number, boolean>;
  callState: CallState;
  isChatOpen: boolean;
  onlineUsers: Set<number>;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: number | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateConversationLastMessage: (conversationId: number, message: ChatMessage) => void;
  markConversationRead: (conversationId: number) => void;
  setTyping: (userId: number, isTyping: boolean) => void;
  setCallState: (state: Partial<CallState>) => void;
  resetCallState: () => void;
  setChatOpen: (open: boolean) => void;
  setUserOnline: (userId: number, online: boolean) => void;
}

const defaultCallState: CallState = {
  isActive: false,
  isIncoming: false,
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  typingUsers: new Map(),
  callState: defaultCallState,
  isChatOpen: false,
  onlineUsers: new Set(),
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  updateConversationLastMessage: (conversationId, message) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: message, updatedAt: message.createdAt }
        : c
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  })),
  markConversationRead: (conversationId) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ),
  })),
  setTyping: (userId, isTyping) => set((state) => {
    const newMap = new Map(state.typingUsers);
    if (isTyping) {
      newMap.set(userId, true);
    } else {
      newMap.delete(userId);
    }
    return { typingUsers: newMap };
  }),
  setCallState: (newState) => set((state) => ({
    callState: { ...state.callState, ...newState },
  })),
  resetCallState: () => set({ callState: defaultCallState }),
  setChatOpen: (open) => set({ isChatOpen: open }),
  setUserOnline: (userId, online) => set((state) => {
    const newSet = new Set(state.onlineUsers);
    if (online) {
      newSet.add(userId);
    } else {
      newSet.delete(userId);
    }
    return { onlineUsers: newSet };
  }),
}));
