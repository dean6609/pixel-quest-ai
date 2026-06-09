"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Box, Shield, Activity, RefreshCw, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';

type RightSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Tab = 'search' | 'changes' | 'history';

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  return (
    <>
      {/* Backdrop for all screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 lg:w-96 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-2xl border-l border-white/10 z-50 transform transition-transform duration-[400ms] ease-[var(--ease-drawer)] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-white/5 bg-background/30">
          <h3 className="font-h3 text-h3 text-secondary">Tools</h3>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors duration-[150ms] btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-md gap-2 border-b border-white/5">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center gap-2 p-sm rounded-xl transition-[color,background-color] duration-[150ms] font-body-md btn-press ${
              activeTab === 'search' ? 'text-secondary font-bold bg-secondary-container/20' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 p-sm rounded-xl transition-[color,background-color] duration-[150ms] font-body-md btn-press ${
              activeTab === 'history' ? 'text-secondary font-bold bg-secondary-container/20' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`flex-1 flex items-center justify-center gap-2 p-sm rounded-xl transition-[color,background-color] duration-[150ms] font-body-md btn-press ${
              activeTab === 'changes' ? 'text-secondary font-bold bg-secondary-container/20' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Changes</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-md">
          {activeTab === 'search' && <SearchTab />}
          {activeTab === 'changes' && <ChangesTab />}
          {activeTab === 'history' && <HistoryTab onClose={onClose} />}
        </div>
      </div>
    </>
  );
}

// --- SUB-COMPONENTS ---

function SearchTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tiers, setTiers] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    fetchItems();
    fetchTiers();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items?limit=100');
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
      const res = await fetch('/api/tiers');
      const data = await res.json();
      setTiers(data || []);
    } catch (e) { }
  };

  const filteredItems = items.filter(item => {
    const matchesQuery = item.name?.toLowerCase().includes(query.toLowerCase()) ||
                         item.item_type?.toLowerCase().includes(query.toLowerCase());
    const matchesTier = selectedTier ? item.tier === selectedTier : true;
    return matchesQuery && matchesTier;
  });

  return (
    <div className="space-y-md">
      <div className="space-y-sm">
        <div className="bg-white/[0.02] p-1.5 rounded-2xl flex items-center gap-2 border border-white/10 transition-[border-color,box-shadow,background-color] duration-[250ms] ease-[var(--ease-out)] focus-within:ring-1 focus-within:ring-white/20">
          <Search className="w-4 h-4 ml-2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent border-none focus:ring-0 text-body-md text-on-surface placeholder:text-on-surface-variant/50 py-2 outline-none"
          />
        </div>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="w-full bg-white/[0.02] p-3 rounded-2xl text-body-md text-on-surface border border-white/10 transition-[border-color,box-shadow,background-color] duration-[250ms] ease-[var(--ease-out)] focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="" className="bg-surface-container">All Tiers</option>
          {tiers.map(t => <option key={t} value={t} className="bg-surface-container">{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-sm mt-md">
          <div className="text-[10px] font-label-caps text-on-surface-variant mb-xs uppercase">
            {filteredItems.length} results found
          </div>
          {filteredItems.map((item, i) => (
            <div key={i} className="doppelrand-shell transition-[background-color,border-color] duration-[150ms] hover:border-white/20 cursor-pointer group animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-2 duration-[250ms] ease-[var(--ease-out)] btn-press" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
              <div className="doppelrand-core p-4">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-body-md font-bold text-on-surface transition-colors duration-[150ms]">{item.name}</h4>
                  {item.tier && (
                    <span className="text-[10px] font-label-caps px-2 py-1 bg-white/5 text-on-surface-variant rounded-full border border-white/10">
                      {item.tier}
                    </span>
                  )}
                </div>
                <div className="text-xs text-on-surface-variant font-body-md truncate">
                  {item.item_type || 'Unknown'}
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
        const res = await fetch('/api/changes?limit=20');
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
    <div className="space-y-md">
      <p className="text-sm text-on-surface-variant">Latest updates detected from the official Realm Wiki.</p>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center p-8 text-on-surface-variant text-sm">
          No recent changes.
        </div>
      ) : (
        <div className="space-y-sm">
          {changes.map((change, i) => (
            <div key={i} className="flex gap-md doppelrand-shell transition-[background-color,border-color] duration-[150ms] hover:border-white/20 animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-2 duration-[250ms] ease-[var(--ease-out)] cursor-pointer group btn-press" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
              <div className="doppelrand-core p-4 flex gap-md w-full">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant transition-transform duration-[150ms] group-hover:scale-125 group-hover:bg-primary" />
                </div>
                <div className="w-full">
                  <h4 className="font-body-md text-on-surface leading-relaxed mb-1 transition-colors duration-[150ms]">
                    {change.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-body-md">
                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 font-label-caps uppercase">{change.version || 'Update'}</span>
                    <span>•</span>
                    <span>{new Date(change.timestamp).toLocaleDateString()}</span>
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
  const { chats, activeChatId, setActiveChatId, createNewChat, deleteChat, clearAllChats } = useChat();

  return (
    <div className="flex flex-col h-full space-y-md">
      <button
        onClick={() => {
          createNewChat();
          // onClose(); 
        }}
        className="group w-full flex justify-between items-center bg-white/[0.04] text-on-surface font-label-caps text-label-caps pl-5 pr-1.5 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-[background-color,border-color] duration-[150ms] shadow-[0_4px_20px_rgba(0,0,0,0.5)] btn-press"
      >
        <span className="font-bold text-primary">New Oracle Session</span>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-[transform,background-color] duration-[200ms] ease-[var(--ease-out)] group-hover:bg-white/10 group-hover:rotate-90 group-hover:scale-105">
          <Plus className="w-4 h-4 text-primary" />
        </div>
      </button>

      <div className="flex-1 overflow-y-auto space-y-sm mt-4">
        {chats.length === 0 ? (
          <div className="text-center p-8 text-on-surface-variant text-sm">
            The Oracle has no memories of you.
          </div>
        ) : (
          chats.map((chat, i) => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
              }}
              className={`group flex items-center justify-between p-3 rounded-[1.5rem] cursor-pointer transition-[border-color,background-color] duration-[150ms] bg-white/[0.02] animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-2 duration-[250ms] ease-[var(--ease-out)] btn-press border ${
                chat.id === activeChatId
                  ? 'border-white/30 bg-white/[0.05]'
                  : 'border-white/5 hover:border-white/20'
              }`}
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
            >
              <div className="flex-1 min-w-0 pr-2 pl-1">
                <h4 className={`font-body-md truncate transition-colors duration-[150ms] ${chat.id === activeChatId ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                  {chat.title}
                </h4>
                <div className="text-[10px] text-on-surface-variant mt-1 font-body-md">
                  {new Date(chat.updatedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="p-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-[opacity,color,background-color] duration-[150ms] rounded-full hover:bg-error/10 btn-press"
                title="Forget memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {chats.length > 0 && (
        <button
          onClick={clearAllChats}
          className="w-full mt-4 flex items-center justify-center gap-2 p-md rounded-xl glass-panel text-error border border-error/30 transition-[background-color,border-color] duration-[150ms] hover:bg-error/10 font-label-caps btn-press"
        >
          <Trash2 className="w-4 h-4" />
          Purge Memories
        </button>
      )}
    </div>
  );
}
