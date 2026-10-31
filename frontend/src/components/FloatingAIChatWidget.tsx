import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminAIChatbox } from './AdminAIChatbox';
import { Bot, X, Sparkles } from 'lucide-react';

export const FloatingAIChatWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Show floating widget for admin / officer / coordinator roles
  if (!user || user.role === 'INSTITUTION_USER') {
    return null;
  }

  // Detect context application ID if on an application page
  const match = location.pathname.match(/\/admin\/applications\/(\d+)/);
  const contextAppId = match ? parseInt(match[1]) : undefined;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-[420px] sm:w-[460px] shadow-2xl rounded-sm overflow-hidden border border-[#D6C5AE] bg-[#FFFEFC] mb-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-end p-1.5 bg-[#263B50]">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-xs hover:bg-[#1D2E3F] text-[#D6C5AE] hover:text-white transition"
              title="Minimize chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <AdminAIChatbox
            contextAppId={contextAppId}
            contextAppCode={contextAppId ? `AICTE App #${contextAppId}` : undefined}
          />
        </div>
      ) : null}

      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-3 bg-[#8B3A3A] hover:bg-[#732F2F] text-white font-semibold text-xs rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer border border-[#FFFEFC]/20"
      >
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <span>{isOpen ? 'Close AI Assistant' : 'AI Pipeline Assistant'}</span>
        <span className="w-2 h-2 rounded-full bg-[#48745A] animate-pulse" title="Database Connected" />
      </button>
    </div>
  );
};

