import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getSttStatus, processAudio, processText, warmupStt } from './api/client';
import { Sidebar } from './components/Sidebar';
import { InputCard } from './components/InputCard';
import { ChatPanel } from './components/ChatPanel';
import { SystemStatus } from './components/SystemStatus';
import { BozzoAILanding } from './components/BozzoAILanding';

function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sttStatus, setSttStatus] = useState('checking');
  const [latency, setLatency] = useState(0);
  const [showLanding, setShowLanding] = useState(true);

  // Initialize with first session
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  const createNewSession = () => {
    const sessionId = Date.now().toString();
    const newSession = {
      id: sessionId,
      title: `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(sessionId);
    setActiveNav('dashboard');
    setShowLanding(false);
  };

  const deleteSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const switchSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setActiveNav('dashboard');
  };

  const getCurrentSession = () => {
    return sessions.find((s) => s.id === currentSessionId);
  };

  const updateCurrentSessionMessages = (messages) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId ? { ...s, messages, title: generateSessionTitle(messages) } : s
      )
    );
  };

  const generateSessionTitle = (messages) => {
    const firstUserMsg = messages.find((m) => m.type === 'user');
    if (firstUserMsg) {
      const preview = firstUserMsg.content.substring(0, 30);
      return preview.length < firstUserMsg.content.length ? preview + '...' : preview;
    }
    return `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  async function handleAudioInput(fileBlob, filename = 'upload.webm') {
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const data = await processAudio(fileBlob, filename);
      setLatency(Date.now() - startTime);

      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: data.transcription || '[Audio processed]',
        timestamp: new Date(),
      };

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.output || 'No response',
        timestamp: new Date(),
      };

      const newMessages = [...currentSession.messages, userMessage, aiMessage];
      updateCurrentSessionMessages(newMessages);
    } catch (error) {
      const errorMsg = {
        id: Date.now().toString(),
        type: 'ai',
        content: error.message || 'Error processing audio',
        timestamp: new Date(),
      };
      const newMessages = [...currentSession.messages, errorMsg];
      updateCurrentSessionMessages(newMessages);
    } finally {
      setLoading(false);
    }
  }

  async function submitText(text) {
    if (!text.trim()) {
      return;
    }

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    let newMessages = [...currentSession.messages, userMessage];
    updateCurrentSessionMessages(newMessages);

    setLoading(true);
    const startTime = Date.now();

    try {
      const data = await processText(text);
      setLatency(Date.now() - startTime);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.output || 'No response',
        timestamp: new Date(),
      };

      newMessages = [...newMessages, aiMessage];
      updateCurrentSessionMessages(newMessages);
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: error.message || 'Error processing request',
        timestamp: new Date(),
      };
      newMessages = [...newMessages, errorMsg];
      updateCurrentSessionMessages(newMessages);
    } finally {
      setLoading(false);
    }
  }

  const clearChat = () => {
    if (window.confirm('Clear all messages in this chat?')) {
      updateCurrentSessionMessages([]);
    }
  };

  useEffect(() => {
    let intervalId;
    let warmupRequested = false;

    async function probeStt() {
      try {
        const status = await getSttStatus();

        if (status.initialized) {
          setSttStatus('ready');
          return;
        }

        if (status.initializing) {
          setSttStatus('warming');
          return;
        }

        if (!warmupRequested) {
          warmupRequested = true;
          setSttStatus('warming');
          await warmupStt();
          return;
        }

        setSttStatus('warming');
      } catch (error) {
        setSttStatus('offline');
      }
    }

    probeStt();
    intervalId = setInterval(probeStt, 4000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (showLanding) {
    return <BozzoAILanding onGetStarted={createNewSession} />;
  }

  return (
    <div className="flex h-screen bg-[#050505]">
      {/* Sidebar */}
      <Sidebar 
        activeItem={activeNav} 
        onNavigation={setActiveNav}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={switchSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Content */}
      <div className="ml-56 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#1F1F1F] bg-[#050505] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLanding(true)}
              className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors duration-200 text-[#8A8A8A] hover:text-[#3B82F6]"
              title="Back to Landing Page"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-[#EDEDED] uppercase tracking-wide">
              {activeNav === 'dashboard' && 'Chat'}
              {activeNav === 'history' && 'History'}
            </h1>
          </div>
        </div>

        {/* Content Area - Conversation Layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeNav === 'dashboard' && getCurrentSession() && (
            <>
              {/* Chat Panel - Takes most space */}
              <ChatPanel 
                messages={getCurrentSession().messages} 
                isThinking={loading} 
                onClear={clearChat} 
                showClearButton={true} 
              />
              
              {/* Input Panel - Fixed at bottom */}
              <InputCard 
                onSendText={submitText} 
                onSendAudio={handleAudioInput} 
                isLoading={loading} 
              />
            </>
          )}

          {activeNav === 'history' && (
            <div className="flex-1 overflow-y-auto p-8">
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-[#8A8A8A]">No chat history yet. Start a new chat!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-3xl">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`border rounded-lg p-5 cursor-pointer transition-all duration-150 group ${
                        currentSessionId === session.id
                          ? 'border-[#3B82F6] bg-[#3B82F6]/5 shadow-lg shadow-[#3B82F6]/10'
                          : 'border-[#1F1F1F] bg-[#0B0B0B] hover:border-[#3B82F6] hover:bg-[#111111]'
                      }`}
                      onClick={() => switchSession(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#EDEDED] mb-2 group-hover:text-[#3B82F6] transition-colors">{session.title}</h3>
                          <p className="text-xs text-[#8A8A8A]">
                            {session.messages.length} messages
                          </p>
                          <p className="text-xs text-[#8A8A8A] mt-2">
                            {session.createdAt.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this chat?')) {
                              deleteSession(session.id);
                            }
                          }}
                          className="ml-4 px-3 py-1.5 text-xs rounded font-medium text-[#8A8A8A] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 border border-transparent hover:border-[#FF6B6B]/30 transition-all duration-150"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - System Status */}
      {activeNav === 'dashboard' && (
        <div className="w-72 border-l border-[#1F1F1F] bg-[#050505] p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-[#8A8A8A] uppercase mb-6 tracking-wide">System Status</h2>
          <SystemStatus sttStatus={sttStatus} isLoading={loading} latency={latency} sttDebug={null} />
        </div>
      )}
    </div>
  );
}

export default App;
