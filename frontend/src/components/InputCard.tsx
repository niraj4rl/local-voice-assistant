import React, { useState, useRef } from 'react';
import { Mic, Music, Send } from 'lucide-react';

interface InputCardProps {
  onSendText: (text: string) => void;
  onSendAudio: (file: Blob | File, filename: string) => void;
  isLoading: boolean;
  onLiveTranscript?: (text: string) => void;
}

export const InputCard: React.FC<InputCardProps> = ({
  onSendText,
  onSendAudio,
  isLoading,
  onLiveTranscript,
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setLiveTranscript('');

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onSendAudio(blob, `mic_${Date.now()}.webm`);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecordingTime(0);
        setLiveTranscript('');
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access failed:', error);
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSendText = () => {
    if (input.trim() && !isLoading) {
      onSendText(input);
      setInput('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-[#1F1F1F] bg-[#050505] p-3">
      {/* Live Transcription Display (while recording) */}
      {isRecording && (
        <div className="mb-3 rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] p-2">
          <p className="text-xs text-[#3B82F6] mb-1 font-semibold uppercase tracking-wide">$ Live Transcription</p>
          <p className="text-sm text-[#EDEDED] min-h-6 font-mono">{liveTranscript || '> Listening...'}</p>
          <p className="text-xs text-[#3B82F6] mt-3 font-mono">{formatTime(recordingTime)}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2">
        {/* Mic Button - Premium Design */}
        <div className="flex justify-center">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200 ${
              isRecording
                ? 'border-[#3B82F6] bg-[#3B82F6]/5 animate-pulse shadow-lg shadow-[#3B82F6]/20'
                : 'border-[#1F1F1F] bg-[#111111] hover:border-[#3B82F6] hover:shadow-md hover:shadow-[#3B82F6]/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <Mic size={18} className={`${isRecording ? 'text-[#3B82F6]' : 'text-[#8A8A8A]'}`} />
          </button>
        </div>

        {/* File Upload */}
        <label className="flex items-center justify-center gap-2 rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 py-2 cursor-pointer transition-all duration-150 hover:border-[#3B82F6] hover:bg-[#0B0B0B] hover:shadow-md hover:shadow-[#3B82F6]/10 group">
          <Music size={16} className="text-[#8A8A8A] group-hover:text-[#3B82F6] transition-colors" />
          <span className="text-xs text-[#8A8A8A] group-hover:text-[#3B82F6] transition-colors font-medium">Upload audio</span>
          <input
            ref={uploadInputRef}
            type="file"
            className="hidden"
            accept="audio/*,.wav,.mp3,.webm,.ogg,.flac,.aac,.m4a"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onSendAudio(file, file.name);
              }
              if (e.target) e.target.value = '';
            }}
            disabled={isLoading}
          />
        </label>

        {/* Text Input */}
        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText();
              }
            }}
            placeholder="Type a message... (Shift+Enter for new line)"
            disabled={isRecording || isLoading}
            className="w-full rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-4 py-2 text-xs text-[#EDEDED] placeholder-[#8A8A8A] focus:border-[#3B82F6] focus:outline-none resize-none transition-all duration-150 focus:shadow-md focus:shadow-[#3B82F6]/10 font-mono min-h-10"
            rows={2}
          />
          <button
            onClick={handleSendText}
            disabled={!input.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#111111] border border-[#1F1F1F] px-4 py-2 text-xs font-semibold text-[#3B82F6] transition-all duration-150 hover:bg-[#3B82F6]/5 hover:border-[#3B82F6] hover:shadow-md hover:shadow-[#3B82F6]/15 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Send size={14} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
