import React from 'react';
import { Copy, Download } from 'lucide-react';

interface OutputCardsProps {
  transcription?: string;
  intent?: string;
  action?: string;
  output?: string;
}

export const OutputCards: React.FC<OutputCardsProps> = ({ transcription, intent, action, output }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Result Panel - Dominant */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#E6EDF3]">Output</h2>
          {output && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(output)}
                className="rounded-lg p-2 text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3] transition-colors"
                title="Copy"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => {
                  const element = document.createElement('a');
                  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
                  element.setAttribute('download', 'output.txt');
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="rounded-lg p-2 text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3] transition-colors"
                title="Download"
              >
                <Download size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-4 font-mono text-sm text-[#E6EDF3] h-64 overflow-auto">
          {output ? (
            <pre className="whitespace-pre-wrap break-words">{output}</pre>
          ) : (
            <p className="text-[#8B949E]">Results will appear here...</p>
          )}
        </div>
      </div>

      {/* Small Info Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Transcription Card */}
        <div className="rounded-lg border border-[#30363D] bg-[#161B22] p-3">
          <p className="text-xs font-semibold text-[#8B949E] mb-2">Transcription</p>
          <p className="text-xs text-[#E6EDF3] break-words line-clamp-3">
            {transcription || '—'}
          </p>
        </div>

        {/* Intent Card */}
        <div className="rounded-lg border border-[#30363D] bg-[#161B22] p-3">
          <p className="text-xs font-semibold text-[#8B949E] mb-2">Intent</p>
          {intent ? (
            <span className="inline-block rounded px-2 py-1 text-xs font-medium bg-[#2F81F7]/20 text-[#2F81F7]">
              {intent}
            </span>
          ) : (
            <p className="text-xs text-[#8B949E]">—</p>
          )}
        </div>

        {/* Action Card */}
        <div className="rounded-lg border border-[#30363D] bg-[#161B22] p-3">
          <p className="text-xs font-semibold text-[#8B949E] mb-2">Action</p>
          {action ? (
            <span className="inline-block rounded px-2 py-1 text-xs font-medium bg-[#2F81F7]/20 text-[#2F81F7]">
              {action}
            </span>
          ) : (
            <p className="text-xs text-[#8B949E]">—</p>
          )}
        </div>
      </div>
    </div>
  );
};
