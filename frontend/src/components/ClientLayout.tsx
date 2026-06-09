"use client";

import React, { useState } from 'react';
import ChatArea from './ChatArea';
import RightSidebar from './RightSidebar';
import { Menu, PanelRight } from 'lucide-react';
import { ChatProvider } from '../context/ChatContext';

export default function ClientLayout() {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <ChatProvider>
      {/* Top Mobile Bar */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-4 z-10 md:hidden">
        <button className="p-2 hover:bg-secondary rounded-full">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm">Pixel Quest AI</span>
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="p-2 hover:bg-secondary rounded-full"
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative pt-14 md:pt-0 transition-all duration-300">
        {/* Desktop Header Toggle */}
        <div className="absolute top-4 right-4 z-10 hidden md:block">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-2.5 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-full border border-border shadow-sm transition-colors"
            title="Herramientas del Wiki"
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </div>

        <ChatArea />
      </div>

      {/* Right Sidebar (Tools) */}
      <RightSidebar
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
      />
    </ChatProvider>
  );
}
