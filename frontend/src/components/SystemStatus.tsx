import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SystemStatusProps {
  sttStatus: string;
  isLoading: boolean;
  latency?: number;
  sttDebug?: any;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ sttStatus, isLoading, latency, sttDebug }) => {
  const [showDebug, setShowDebug] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return { text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' };
      case 'warming':
        return { text: 'text-[#8A8A8A]', dot: 'bg-[#8A8A8A]' };
      case 'offline':
        return { text: 'text-[#FF6B6B]', dot: 'bg-[#FF6B6B]' };
      default:
        return { text: 'text-[#8A8A8A]', dot: 'bg-[#8A8A8A]' };
    }
  };

  return (
    <div className="space-y-4">
      {/* STT Status - Premium Minimal */}
      <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-4">
        <p className="text-xs font-semibold text-[#8A8A8A] uppercase mb-3 tracking-wide">STT Status</p>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(sttStatus).dot}`}></div>
          <span className={`text-sm font-medium ${getStatusColor(sttStatus).text}`}>
            {sttStatus.charAt(0).toUpperCase() + sttStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Latency */}
      {latency !== undefined && (
        <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-4">
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase mb-2 tracking-wide">Latency</p>
          <div className="text-2xl font-mono font-bold text-[#3B82F6]">
            {latency}<span className="text-sm text-[#8A8A8A]">ms</span>
          </div>
        </div>
      )}

      {/* Debug Logs */}
      {sttDebug && (
        <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B]">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-[#111111]/50 transition-colors"
          >
            <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Debug</p>
            <ChevronDown
              size={14}
              className={`transition-transform text-[#8A8A8A] ${showDebug ? 'rotate-180' : ''}`}
            />
          </button>
          {showDebug && (
            <div className="border-t border-[#1F1F1F] overflow-auto bg-[#050505] p-4 font-mono text-xs text-[#8A8A8A] max-h-40">
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(sttDebug, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Processing State */}
      {isLoading && (
        <div className="rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] animate-pulse"></div>
            <p className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wide">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};
