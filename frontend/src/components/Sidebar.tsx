import React from 'react';
import { MessageSquare, History, Plus, Bot, Trash2 } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
}

interface SidebarProps {
  activeItem: string;
  onNavigation: (item: string) => void;
  sessions?: Session[];
  currentSessionId?: string | null;
  onNewChat?: () => void;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  onNavigation, 
  sessions = [],
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession 
}) => {
  return (
    <div className="fixed left-0 top-0 h-screen w-56 border-r border-[#1F1F1F] bg-[#050505] flex flex-col">
      {/* Logo Section */}
      <div className="border-b border-[#1F1F1F] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={20} className="text-[#3B82F6]" />
          <h1 className="text-lg font-bold text-[#EDEDED] uppercase tracking-wider">Bozzo</h1>
        </div>
        <p className="text-xs text-[#8A8A8A] uppercase tracking-widest pl-7">AI Agent</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 border-b border-[#1F1F1F] p-5">
        <button
          onClick={() => onNavigation('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
            activeItem === 'dashboard'
              ? 'border-l-2 border-[#3B82F6] bg-[#0B0B0B] text-[#3B82F6]'
              : 'text-[#8A8A8A] hover:text-[#EDEDED]'
          }`}
          title="Go to dashboard"
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          onClick={() => onNavigation('history')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
            activeItem === 'history'
              ? 'border-l-2 border-[#3B82F6] bg-[#0B0B0B] text-[#3B82F6]'
              : 'text-[#8A8A8A] hover:text-[#EDEDED]'
          }`}
          title="View history"
        >
          <History size={16} />
          History
        </button>
      </div>

      {/* New Chat Button */}
      {onNewChat && (
        <div className="p-5 border-b border-[#1F1F1F]">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-[#3B82F6] bg-[#050505] px-4 py-3 font-semibold text-[#3B82F6] uppercase tracking-wider transition-all duration-150 hover:bg-[#3B82F6]/5 hover:shadow-lg hover:shadow-[#3B82F6]/20 active:scale-95"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <p className="text-xs text-[#8A8A8A] uppercase tracking-widest font-semibold px-3 mb-4">Sessions</p>
        {sessions.length === 0 ? (
          <p className="text-xs text-[#8A8A8A] px-3">No sessions yet</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                currentSessionId === session.id
                  ? 'border-l-2 border-[#3B82F6] bg-[#0B0B0B]'
                  : 'hover:bg-[#0B0B0B]'
              }`}
              onClick={() => onSelectSession?.(session.id)}
              title={session.title}
            >
              <MessageSquare size={14} className="flex-shrink-0 text-[#8A8A8A]" />
              <span className="flex-1 truncate text-xs font-medium text-[#EDEDED]">
                {session.title}
              </span>
              <Trash2
                size={14}
                className="flex-shrink-0 text-[#8A8A8A] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#FF6B6B]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession?.(session.id);
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1F1F1F] p-5 text-center">
        <p className="text-xs text-[#8A8A8A] uppercase tracking-widest">v 1.0.0</p>
      </div>
    </div>
  );
};
