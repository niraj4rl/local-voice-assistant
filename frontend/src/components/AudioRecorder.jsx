import { useEffect, useRef, useState } from 'react';

function AudioRecorder({ onAudioReady, onLog }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioReady(audioBlob, `mic_${Date.now()}.webm`);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      onLog('Microphone recording started');
    } catch (error) {
      onLog(`Microphone access failed: ${error.message}`);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onLog('Microphone recording stopped');
    }
  }

  return (
    <section className="glass-panel animate-rise" style={{ animationDelay: '70ms' }}>
      <h2 className="panel-title">Live Microphone</h2>
      <p className="panel-subtitle">Capture a voice command and run the local AI pipeline.</p>

      <div className="relative mt-6 flex items-center justify-center">
        {isRecording && <span className="absolute inline-flex h-20 w-20 rounded-full bg-accent/60 animate-pulseRing" />}
        <button
          type="button"
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop' : 'Record'}
        </button>
      </div>
    </section>
  );
}

export default AudioRecorder;
