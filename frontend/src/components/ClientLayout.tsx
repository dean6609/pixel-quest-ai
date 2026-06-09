"use client";

import React, { useState } from 'react';
import ChatArea from './ChatArea';
import RightSidebar from './RightSidebar';
import { ChatProvider } from '../context/ChatContext';

export default function ClientLayout() {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="flex flex-col h-screen overflow-hidden w-full relative">
        {/* TopAppBar Fluid Island */}
        <header className="absolute top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-max z-50 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h1 className="font-h2 text-xl md:text-2xl font-extrabold text-on-surface tracking-tight">AI Oracle</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Nav links removed for cleaner UI */}
              <button 
                className="material-symbols-outlined text-on-surface hover:text-primary p-2 rounded-full hover:bg-white/5 transition-colors duration-150 ease-out btn-press"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              >
                menu
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex w-full overflow-hidden relative z-10 pt-24">
          {/* Character Stats removed for cleaner UI */}

          {/* Central Chat Area component */}
          <ChatArea />

          {/* Right Sidebar (Tools) */}
          <RightSidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
          />
        </main>
      </div>
    </ChatProvider>
  );
}
