"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext";

type RightSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Tab = "search" | "changes" | "history";

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{
            background: "rgba(20, 19, 20, 0.8)",
            backdropFilter: "blur(0.5rem)",
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-80 lg:w-96 shrink-0 z-50 transform transition-transform duration-[400ms] flex flex-col"
        style={{
          background: "rgba(26, 26, 26, 0.95)",
          backdropFilter: "blur(2rem)",
          WebkitBackdropFilter: "blur(2rem)",
          borderLeft: "1px solid var(--color-border)",
          transitionTimingFunction: "var(--ease-power4-in-out)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
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
            onClick={onClose}
            className="p-2 rounded-full transition-colors duration-150"
            style={{ color: "var(--color-foreground-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-foreground-muted)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex p-4 gap-2 border-b"
          style={{ borderColor: "var(--color-border-muted)" }}
        >
          {(["search", "history", "changes"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-150 text-sm font-medium"
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
            >
              {tab === "search" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              {tab === "history" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              )}
              {tab === "changes" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              )}
              <span className="hidden sm:inline capitalize">{tab}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "search" && <SearchTab />}
          {activeTab === "changes" && <ChangesTab />}
          {activeTab === "history" && <HistoryTab onClose={onClose} />}
        </div>
      </div>
    </>
  );
}

// --- SUB-COMPONENTS ---

function SearchTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState("");

  useEffect(() => {
    fetchItems();
    fetchTiers();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/items?limit=100");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await fetch("/api/tiers");
      const data = await res.json();
      setTiers(data || []);
    } catch (e) {}
  };

  const filteredItems = items.filter((item) => {
    const matchesQuery =
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.item_type?.toLowerCase().includes(query.toLowerCase());
    const matchesTier = selectedTier ? item.tier === selectedTier : true;
    return matchesQuery && matchesTier;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 rounded-2xl transition-all duration-250"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            padding: "6px",
            border: "1px solid var(--color-border)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="ml-2"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent border-none focus:ring-0 text-base py-2 outline-none"
            style={{ color: "var(--color-foreground)" }}
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
        >
          <option value="" style={{ background: "var(--color-background-muted)" }}>
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
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-spin"
            style={{ color: "var(--color-brand)" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
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
            <div
              key={i}
              className="cursor-pointer group transition-all duration-150"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "6px",
                borderRadius: "2rem",
                border: "1px solid var(--color-border)",
                animationDelay: `${i * 30}ms`,
                animationFillMode: "both",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <div
                style={{
                  background: "var(--color-background-muted)",
                  borderRadius: "calc(2rem - 6px)",
                  padding: "1rem",
                }}
              >
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
          ))}
        </div>
      )}
    </div>
  );
}

function ChangesTab() {
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChanges = async () => {
      try {
        const res = await fetch("/api/changes?limit=20");
        const data = await res.json();
        setChanges(data.changes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchChanges();
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
        Latest updates detected from the official Realm Wiki.
      </p>

      {loading ? (
        <div className="flex justify-center p-8">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-spin"
            style={{ color: "var(--color-brand)" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
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
            <div
              key={i}
              className="flex gap-4 cursor-pointer group transition-all duration-150"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "6px",
                borderRadius: "2rem",
                border: "1px solid var(--color-border)",
                animationDelay: `${i * 30}ms`,
                animationFillMode: "both",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <div
                style={{
                  background: "var(--color-background-muted)",
                  borderRadius: "calc(2rem - 6px)",
                  padding: "1rem",
                }}
                className="flex gap-4 w-full"
              >
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
                    <span>
                      {new Date(change.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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

  return (
    <div className="flex flex-col h-full space-y-4">
      <button
        onClick={() => {
          createNewChat();
        }}
        className="group w-full flex justify-between items-center pl-5 pr-2 py-2 rounded-full transition-all duration-150"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        }}
      >
        <span className="font-bold text-sm" style={{ color: "var(--color-brand)" }}>
          New Oracle Session
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:rotate-90 group-hover:scale-105"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--color-brand)" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
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
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
              }}
              className="group flex items-center justify-between p-3 cursor-pointer transition-all duration-150"
              style={{
                borderRadius: "1.5rem",
                background: "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${
                  chat.id === activeChatId
                    ? "rgba(255, 255, 255, 0.3)"
                    : "var(--color-border-muted)"
                }`,
                animationDelay: `${i * 30}ms`,
                animationFillMode: "both",
              }}
              onMouseEnter={(e) => {
                if (chat.id !== activeChatId) {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (chat.id !== activeChatId) {
                  e.currentTarget.style.borderColor = "var(--color-border-muted)";
                }
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
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150"
                style={{ color: "var(--color-foreground-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-foreground-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
                title="Forget memory"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {chats.length > 0 && (
        <button
          onClick={clearAllChats}
          className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-xl transition-all duration-150 text-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Purge Memories
        </button>
      )}
    </div>
  );
}
