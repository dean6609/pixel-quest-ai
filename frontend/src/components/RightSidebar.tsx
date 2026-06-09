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
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-80 lg:w-96 bg-card border-l border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex space-x-1 bg-secondary rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'search' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              Buscador
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              Historial
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'changes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              Cambios
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar ítems..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Todos los Tiers</option>
          {tiers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2">
            {filteredItems.length} resultados
          </div>
          {filteredItems.map((item, i) => (
            <div key={i} className="bg-secondary/50 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
                {item.tier && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {item.tier}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{item.item_type || 'Unknown'}</p>
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
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">Últimas actualizaciones detectadas en el Wiki oficial.</p>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground text-sm">
          No hay cambios recientes.
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((change, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground leading-none mb-1">
                  {change.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(change.timestamp).toLocaleDateString()}
                  </span>
                  {change.type && (
                    <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">
                      {change.type}
                    </span>
                  )}
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
    <div className="p-4 space-y-4 flex flex-col h-full">
      <button
        onClick={() => {
          createNewChat();
          onClose(); // Optional: close sidebar to start typing
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Nuevo Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-2 mt-4">
        {chats.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground text-sm">
            No tienes conversaciones previas.
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                // onClose(); // Uncomment to close sidebar when selecting a chat
              }}
              className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                chat.id === activeChatId
                  ? 'bg-secondary/80 border-primary/50'
                  : 'bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/30'
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {chat.title}
                </h4>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(chat.updatedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-background"
                title="Eliminar chat"
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
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Borrar Historial
        </button>
      )}
    </div>
  );
}
