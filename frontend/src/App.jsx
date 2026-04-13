import { useEffect, useMemo, useState } from 'react';
import { getSttStatus, processAudio, processText, warmupStt } from './api/client';
import ActivityLog from './components/ActivityLog';
import AudioRecorder from './components/AudioRecorder';
import FileUploader from './components/FileUploader';
import OutputPreview from './components/OutputPreview';
import ResultDashboard from './components/ResultDashboard';

const initialResult = {
  transcription: '',
  intent: '',
  action: '',
  output: ''
};

function App() {
  const [result, setResult] = useState(initialResult);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [sttStatus, setSttStatus] = useState('checking');

  function appendLog(message) {
    setLogs((current) => [...current, `${new Date().toLocaleTimeString()} - ${message}`]);
  }

  async function handleAudioInput(fileBlob, filename) {
    setLoading(true);
    appendLog('Sending audio to backend');
    appendLog('If this is the first voice run, STT model warmup may take a while.');

    try {
      const data = await processAudio(fileBlob, filename);
      setResult(data);
      setLogs((current) => [...current, ...data.logs.map((item) => `${new Date().toLocaleTimeString()} - ${item}`)]);
    } catch (error) {
      appendLog(`Processing failed: ${error.message}`);
      setResult({ ...initialResult, output: error.message, action: 'failed', intent: 'general_chat' });
    } finally {
      setLoading(false);
    }
  }

  async function submitText(event) {
    event.preventDefault();
    if (!textInput.trim()) {
      return;
    }

    setLoading(true);
    appendLog('Submitting text command');

    try {
      const data = await processText(textInput);
      setResult(data);
      setLogs((current) => [...current, ...data.logs.map((item) => `${new Date().toLocaleTimeString()} - ${item}`)]);
      setTextInput('');
    } catch (error) {
      appendLog(`Text request failed: ${error.message}`);
      setResult({ ...initialResult, output: error.message, action: 'failed', intent: 'general_chat' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let intervalId;

    async function initStt() {
      try {
        const status = await getSttStatus();
        if (status.initialized) {
          setSttStatus('ready');
          appendLog('STT engine ready');
          return;
        }

        setSttStatus('warming');
        appendLog('Starting STT warmup in background');
        await warmupStt();

        intervalId = setInterval(async () => {
          try {
            const nextStatus = await getSttStatus();
            if (nextStatus.initialized) {
              setSttStatus('ready');
              appendLog('STT warmup completed');
              clearInterval(intervalId);
            } else if (nextStatus.error) {
              setSttStatus('error');
              appendLog(`STT warmup error: ${nextStatus.error}`);
              clearInterval(intervalId);
            }
          } catch {
            setSttStatus('error');
            clearInterval(intervalId);
          }
        }, 3000);
      } catch {
        setSttStatus('error');
        appendLog('Could not initialize STT status.');
      }
    }

    initStt();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const statusText = useMemo(() => {
    if (loading) {
      return 'Pipeline running...';
    }
    if (result.action) {
      return `Last action: ${result.action}`;
    }
    return 'Ready for a voice command';
  }, [loading, result.action]);

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="bg-overlay" />

      <header className="mx-auto max-w-[1400px] px-4 pt-8 md:px-8">
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Local AI System</p>
        <h1 className="font-heading text-3xl font-semibold md:text-5xl">Voice-Controlled Local AI Agent</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Audio Input to STT, Intent Detection, Tool Execution, and UI insight with strict output-only sandboxing.
        </p>
        <p className="mt-2 text-sm text-mint">{statusText}</p>
        <p className="mt-1 text-xs text-slate-400">
          STT status: {sttStatus === 'ready' ? 'ready' : sttStatus === 'warming' ? 'warming up model' : sttStatus}
        </p>
      </header>

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-6 md:px-8 xl:grid-cols-[320px,1fr,340px]">
        <aside className="space-y-4">
          <AudioRecorder onAudioReady={handleAudioInput} onLog={appendLog} />
          <FileUploader onAudioReady={handleAudioInput} onLog={appendLog} />

          <section className="glass-panel animate-rise" style={{ animationDelay: '210ms' }}>
            <h2 className="panel-title">Text Command (Fallback)</h2>
            <form onSubmit={submitText} className="mt-4 space-y-3">
              <textarea
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                placeholder="Example: Create a Python file with retry logic"
                className="w-full rounded-lg border border-line bg-ink/40 p-3 text-sm outline-none ring-accent/40 transition focus:ring"
                rows={4}
              />
              <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-white transition hover:brightness-110">
                Run Command
              </button>
            </form>
          </section>
        </aside>

        <section>
          <ResultDashboard result={result} loading={loading} />
        </section>

        <aside className="space-y-4">
          <OutputPreview result={result} />
          <ActivityLog logs={logs} />
        </aside>
      </main>
    </div>
  );
}

export default App;
