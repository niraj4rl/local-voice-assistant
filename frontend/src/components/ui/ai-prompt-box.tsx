import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ArrowUp, Music, Square, StopCircle, Mic } from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const PromptInputContext = React.createContext<{
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}>({
  isLoading: false,
  value: '',
  setValue: () => {},
  onSubmit: undefined,
  disabled: false,
});

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error('usePromptInput must be used within PromptInputContext');
  return context;
}

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, isLoading = false, value, onValueChange, onSubmit, children, disabled = false }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '');
    const setValue = onValueChange ?? setInternalValue;

    return (
      <TooltipPrimitive.Provider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              'rounded-3xl border border-[#444444] bg-[#1F2023] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300',
              isLoading && 'border-red-500/70',
              className
            )}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipPrimitive.Provider>
    );
  }
);
PromptInput.displayName = 'PromptInput';

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-[#333333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        'flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

const PromptInputTextarea: React.FC<React.ComponentProps<typeof Textarea>> = ({ className, onKeyDown, ...props }) => {
  const { value, setValue, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn('text-base max-h-[240px]', className)}
      disabled={disabled}
      {...props}
    />
  );
};

interface VoiceRecorderProps {
  isRecording: boolean;
  onAudioReady: (blob: Blob, filename: string) => void;
  onStop: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ isRecording, onAudioReady, onStop }) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  React.useEffect(() => {
    let mounted = true;

    async function begin() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onAudioReady(blob, `mic_${Date.now()}.webm`);
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        };

        recorder.start();
        timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
      } catch (error) {
        console.error('Microphone access failed:', error);
        onStop();
      }
    }

    if (isRecording) {
      setTime(0);
      begin();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }

    return () => {
      mounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isRecording, onAudioReady, onStop]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center w-full transition-all duration-300 py-3', isRecording ? 'opacity-100' : 'opacity-0 h-0')}>
      <div className='flex items-center gap-2 mb-3'>
        <div className='h-2 w-2 rounded-full bg-red-500 animate-pulse' />
        <span className='font-mono text-sm text-white/80'>{formatTime(time)}</span>
      </div>
      <div className='w-full h-10 flex items-center justify-center gap-0.5 px-4'>
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className='w-0.5 rounded-full bg-white/50 animate-pulse'
            style={{
              height: `${Math.max(15, Math.random() * 100)}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface PromptInputBoxProps {
  onSendText: (message: string) => void;
  onSendAudio: (file: Blob | File, filename: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
  ({ onSendText, onSendAudio, isLoading = false, placeholder = 'Type your message...', className }, ref) => {
    const [input, setInput] = React.useState('');
    const [isRecording, setIsRecording] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);

    const hasContent = input.trim().length > 0;

    const handleSubmit = () => {
      if (!hasContent) return;
      onSendText(input);
      setInput('');
    };

    return (
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        className={cn(
          'w-full bg-[#1F2023] border-[#444444] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300 ease-in-out',
          isRecording && 'border-red-500/70',
          className
        )}
        disabled={isLoading}
        ref={ref}
      >
        <div className={cn('transition-all duration-300', isRecording ? 'h-0 overflow-hidden opacity-0' : 'opacity-100')}>
          <PromptInputTextarea placeholder={placeholder} className='text-base' />
        </div>

        {isRecording && (
          <VoiceRecorder
            isRecording={isRecording}
            onAudioReady={(blob, filename) => {
              onSendAudio(blob, filename);
              setIsRecording(false);
            }}
            onStop={() => setIsRecording(false)}
          />
        )}

        <div className='flex items-center justify-between gap-2 p-0 pt-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className='flex h-8 w-8 text-[#9CA3AF] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-600/30 hover:text-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={isRecording || isLoading}
              >
                <Music className='h-5 w-5 transition-colors' />
                <input
                  ref={uploadInputRef}
                  type='file'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onSendAudio(file, file.name);
                    }
                    if (e.target) e.target.value = '';
                  }}
                  accept='audio/*,.wav,.mp3,.webm,.ogg,.flac,.aac,.m4a'
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side='top'>Attach audio file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isRecording) setIsRecording(false);
                  else setIsRecording(true);
                }}
                className={cn(
                  'inline-flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
                  isRecording
                    ? 'bg-red-500/20 hover:bg-red-600/30 text-red-500 hover:text-red-400 border border-red-500'
                    : 'bg-transparent hover:bg-gray-600/30 text-[#9CA3AF] hover:text-[#D1D5DB]'
                )}
                disabled={isLoading}
              >
                {isRecording ? (
                  <StopCircle className='h-5 w-5 text-red-500' />
                ) : (
                  <Mic className='h-5 w-5' />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side='top'>
              {isRecording ? 'Stop recording' : 'Start recording'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
                  hasContent
                    ? 'bg-white hover:bg-white/80 text-[#1F2023]'
                    : 'bg-transparent hover:bg-gray-600/30 text-[#9CA3AF] hover:text-[#D1D5DB]'
                )}
                onClick={() => {
                  if (hasContent) handleSubmit();
                }}
                disabled={isLoading || !hasContent}
              >
                {isLoading ? (
                  <Square className='h-4 w-4 fill-[#1F2023] animate-pulse' />
                ) : (
                  <ArrowUp className='h-4 w-4 text-[#1F2023]' />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side='top'>
              {isLoading ? 'Generating...' : hasContent ? 'Send message' : 'Type to send'}
            </TooltipContent>
          </Tooltip>
        </div>
      </PromptInput>
    );
  }
);

PromptInputBox.displayName = 'PromptInputBox';
