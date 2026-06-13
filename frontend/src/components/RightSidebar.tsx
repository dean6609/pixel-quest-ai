"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Activity,
  MessageSquare,
  X,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useChat } from "../context/ChatContext";

type RightSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Tab = "search" | "changes" | "history";

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const shouldReduceMotion = useReducedMotion();

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.76, 0, 0.24, 1] as const };

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(20, 19, 20, 0.8)",
              backdropFilter: "blur(0.5rem)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="fixed top-0 right-0 h-full w-full sm:w-80 lg:w-96 shrink-0 z-50 flex flex-col glass-panel border-l"
            style={{
              borderColor: "var(--color-border)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={transition}
            role="dialog"
            aria-modal="true"
            aria-label="Herramientas"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{
                borderColor: "var(--color-border-muted)",
                background: "rgba(20, 19, 20, 0.3)",
              }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--color-foreground)" }}
              >
                Tools
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full transition-colors duration-150 hover:bg-white/5"
                style={{ color: "var(--color-foreground-muted)" }}
                aria-label="Cerrar herramientas"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div
              className="flex p-4 gap-2 border-b"
              style={{ borderColor: "var(--color-border-muted)" }}
              role="tablist"
              aria-label="Pestañas de herramientas"
            >
              {(["search", "history", "changes"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-150 text-sm font-medium hover:bg-white/5"
                  style={{
                    background:
                      activeTab === tab
                        ? "rgba(255, 255, 255, 0.05)"
                        : "transparent",
                    color:
                      activeTab === tab
                        ? "var(--color-foreground)"
                        : "var(--color-foreground-muted)",
                  }}
                  aria-label={tab}
                >
                  {tab === "search" && <Search size={16} aria-hidden="true" />}
                  {tab === "history" && <MessageSquare size={16} aria-hidden="true" />}
                  {tab === "changes" && <Activity size={16} aria-hidden="true" />}
                  <span className="hidden sm:inline capitalize">{tab}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
              {activeTab === "search" && <SearchTab />}
              {activeTab === "changes" && <ChangesTab />}
              {activeTab === "history" && <HistoryTab onClose={onClose} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type Item = {
  name: string;
  item_type?: string;
  tier?: string;
  [key: string]: unknown;
};

function SearchTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState("");

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/items?limit=100", { signal });
        const data = await res.json();
        setItems(data.items || []);
      } catch (e) {
        if (!(e instanceof Error && e.name === "AbortError")) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchTiers = async () => {
      try {
        const res = await fetch("/api/tiers", { signal });
        const data = await res.json();
        setTiers(data || []);
      } catch (e) {
        if (!(e instanceof Error && e.name === "AbortError")) {
          console.error(e);
        }
      }
    };

    fetchItems();
    fetchTiers();

    return () => abortController.abort();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.item_type?.toLowerCase().includes(query.toLowerCase());
      const matchesTier = selectedTier ? item.tier === selectedTier : true;
      return matchesQuery && matchesTier;
    });
  }, [items, query, selectedTier]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="doppelrand-shell flex items-center gap-2 transition-all duration-250">
          <Search
            size={16}
            className="ml-2 shrink-0"
            style={{ color: "var(--color-foreground-muted)" }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent border-none focus:ring-0 text-base py-2 outline-none"
            style={{ color: "var(--color-foreground)" }}
            aria-label="Buscar items"
          />
        </div>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="w-full p-3 rounded-2xl text-base outline-none transition-all duration-250"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          }}
          aria-label="Filtrar por tier"
        >
          <option
            value=""
            style={{ background: "var(--color-background-muted)" }}
          >
            All Tiers
          </option>
          {tiers.map((t) => (
            <option
              key={t}
              value={t}
              style={{ background: "var(--color-background-muted)" }}
            >
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: "var(--color-brand)" }}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          <div
            className="text-xs mb-2 uppercase tracking-wider"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {filteredItems.length} results found
          </div>
          {filteredItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <div className="doppelrand-shell cursor-pointer group transition-all duration-150 hover:border-white/20">
                <div className="doppelrand-core p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4
                      className="font-bold text-base transition-colors duration-150"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {item.name}
                    </h4>
                    {item.tier && (
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-foreground-muted)",
                        }}
                      >
                        {item.tier}
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: "var(--color-foreground-muted)" }}
                  >
                    {item.item_type || "Unknown"}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

type WikiChange = {
  title: string;
  version?: string;
  timestamp: string;
  [key: string]: unknown;
};

function formatChangeDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
}

function ChangesTab() {
  const [changes, setChanges] = useState<WikiChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchChanges = async () => {
      try {
        const res = await fetch("/api/changes?limit=20", { signal });
        const data = await res.json();
        setChanges(data.changes || []);
      } catch (e) {
        if (!(e instanceof Error && e.name === "AbortError")) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();

    return () => abortController.abort();
  }, []);

  return (
    <div className="space-y-4">
      <p
        className="text-sm"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        Latest updates detected from the official Realm Wiki.
      </p>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: "var(--color-brand)" }}
            aria-hidden="true"
          />
        </div>
      ) : changes.length === 0 ? (
        <div
          className="text-center p-8 text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          No recent changes.
        </div>
      ) : (
        <div className="space-y-2">
          {changes.map((change, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <div className="doppelrand-shell cursor-pointer group transition-all duration-150 hover:border-white/20">
                <div className="doppelrand-core flex gap-4 w-full p-4">
                  <div className="mt-1">
                    <div
                      className="w-2 h-2 rounded-full transition-transform duration-150 group-hover:scale-125"
                      style={{ background: "var(--color-foreground-muted)" }}
                    />
                  </div>
                  <div className="w-full">
                    <h4
                      className="text-base leading-relaxed mb-1 transition-colors duration-150"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {change.title}
                    </h4>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--color-foreground-muted)" }}
                    >
                      <span
                        className="px-2 py-0.5 rounded text-xs uppercase tracking-wider"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {change.version || "Update"}
                      </span>
                      <span>•</span>
                      <span>{formatChangeDate(change.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ onClose }: { onClose: () => void }) {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    createNewChat,
    deleteChat,
    clearAllChats,
  } = useChat();

  const handleNewChat = () => {
    createNewChat();
    onClose();
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    onClose();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <button
        type="button"
        onClick={handleNewChat}
        className="group doppelrand-shell flex justify-between items-center pl-5 pr-2 py-2 transition-all duration-150 hover:border-white/20"
      >
        <span
          className="font-bold text-sm"
          style={{ color: "var(--color-brand)" }}
        >
          New Oracle Session
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:rotate-90 group-hover:scale-105"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
        >
          <Plus size={16} style={{ color: "var(--color-brand)" }} />
        </div>
      </button>

      <div className="flex-1 overflow-y-auto space-y-2 mt-4">
        {chats.length === 0 ? (
          <div
            className="text-center p-8 text-sm"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            The Oracle has no memories of you.
          </div>
        ) : (
          chats.map((chat, i) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <div
                onClick={() => handleSelectChat(chat.id)}
                className="group flex items-center justify-between p-3 cursor-pointer transition-all duration-150 hover:border-white/20"
                style={{
                  borderRadius: "1.5rem",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${
                    chat.id === activeChatId
                      ? "rgba(255, 255, 255, 0.3)"
                      : "var(--color-border-muted)"
                  }`,
                }}
              >
                <div className="flex-1 min-w-0 pr-2 pl-1">
                  <h4
                    className="truncate transition-colors duration-150 text-sm"
                    style={{
                      color:
                        chat.id === activeChatId
                          ? "var(--color-foreground)"
                          : "var(--color-foreground-muted)",
                      fontWeight: chat.id === activeChatId ? 600 : 400,
                    }}
                  >
                    {chat.title}
                  </h4>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--color-foreground-muted)" }}
                  >
                    {new Date(chat.updatedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-red-500/10 hover:text-red-500"
                  style={{ color: "var(--color-foreground-muted)" }}
                  aria-label={`Olvidar conversación ${chat.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {chats.length > 0 && (
        <button
          type="button"
          onClick={clearAllChats}
          className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-xl transition-all duration-150 text-sm hover:bg-red-500/10"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
          }}
        >
          <Trash2 size={16} />
          Purge Memories
        </button>
      )}
    </div>
  );
}
