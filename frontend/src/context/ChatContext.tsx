"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

type ChatContextType = {
  chats: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | undefined;
  createNewChat: () => string;
  setActiveChatId: (id: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  deleteChat: (id: string) => void;
  clearAllChats: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_CHATS = "pq_ai_chats";
const STORAGE_ACTIVE = "pq_ai_active_chat_id";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedChats = localStorage.getItem(STORAGE_CHATS);
      const storedActiveId = localStorage.getItem(STORAGE_ACTIVE);
      if (storedChats) {
        setChats(JSON.parse(storedChats));
      }
      if (storedActiveId) {
        setActiveChatId(storedActiveId);
      }
    } catch (error) {
      console.error("Failed to load chats from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_CHATS, JSON.stringify(chats));
      if (activeChatId) {
        localStorage.setItem(STORAGE_ACTIVE, activeChatId);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE);
      }
    } catch (error) {
      console.error("Failed to save chats to localStorage", error);
    }
  }, [chats, activeChatId, isLoaded]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      title: "Nueva Conversación",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat.id;
  };

  const addMessage = (chatId: string, message: Message) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.id === chatId);
      if (chatIndex === -1) return prevChats;

      const updatedChats = [...prevChats];
      const chat = { ...updatedChats[chatIndex] };

      if (chat.messages.length === 0 && message.role === "user") {
        chat.title =
          message.content.length > 30
            ? message.content.substring(0, 30) + "..."
            : message.content;
      }

      chat.messages = [...chat.messages, message];
      chat.updatedAt = Date.now();

      updatedChats[chatIndex] = chat;
      return updatedChats.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const clearAllChats = () => {
    setChats([]);
    setActiveChatId(null);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        createNewChat,
        setActiveChatId,
        addMessage,
        deleteChat,
        clearAllChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
