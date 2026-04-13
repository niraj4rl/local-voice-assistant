import React, { useEffect, useRef } from 'react';
import { Copy, Trash2 } from 'lucide-react';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
  isThinking?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isThinking, onClear, showClearButton = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
      {/* Header with Clear Button */}
      {showClearButton && messages.length > 0 && (
        <div className="border-b border-[#1F1F1F] px-6 py-4 flex justify-end">
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 text-xs text-[#8A8A8A] hover:text-[#3B82F6] hover:border-[#3B82F6] border border-transparent rounded-lg transition-all duration-150"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 p-6"
      >
        {messages.length === 0 && !isThinking && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[#8A8A8A]">Start a conversation...</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`group max-w-xl rounded-lg px-5 py-4 ${
                message.type === 'user'
                  ? 'bg-[#111111] text-[#EDEDED] border border-[#3B82F6] border-l-2 border-opacity-50 rounded-br-none'
                  : 'bg-[#0B0B0B] border border-[#1F1F1F] text-[#EDEDED] rounded-bl-none'
              }`}
            >
              {/* Label */}
              <p className="text-xs font-semibold text-[#00FF9F] opacity-60 mb-2 uppercase tracking-wide">
                {message.type === 'user' ? '> You' : '$ Bozzo'}
              </p>

              {/* Content */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono">
                {message.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1F1F1F] border-opacity-50">
                <span className="text-xs text-[#8A8A8A]">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.type === 'ai' && (
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-150 ml-2 p-1.5 hover:text-[#3B82F6] text-[#8A8A8A]"
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[#0B0B0B] border border-[#1F1F1F] text-[#EDEDED] rounded-lg rounded-bl-none px-5 py-4">
              <p className="text-xs font-semibold text-[#3B82F6] opacity-60 mb-2 uppercase tracking-wide">$ Bozzo</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#EDEDED]">Processing</span>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
