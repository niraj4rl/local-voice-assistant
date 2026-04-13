import { useState } from 'react';

function FileUploader({ onAudioReady }) {
  const [isDragging, setIsDragging] = useState(false);

  function handleSelectedFile(file) {
    if (!file) {
      return;
    }
    
    const allowedMimes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a'];
    const allowedExts = /\.(wav|mp3|webm|ogg|flac|aac|m4a)$/i;
    
    if (!allowedMimes.includes(file.type) && !allowedExts.test(file.name)) {
      alert(`Unsupported file type: ${file.type || 'unknown'}. Please use WAV, MP3, WebM, OGG, FLAC, AAC, or M4A.`);
      return;
    }

    onAudioReady(file, file.name);
  }

  function onDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleSelectedFile(file);
  }

  return (
    <section className="glass-panel animate-rise" style={{ animationDelay: '140ms' }}>
      <h2 className="panel-title">Audio Upload</h2>
      <p className="panel-subtitle">Drag and drop a .wav/.mp3 file for offline transcription.</p>

      <label
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.webm,.ogg,.flac,.aac,.m4a"
          className="hidden"
          onChange={(event) => handleSelectedFile(event.target.files?.[0])}
        />
        <span>Drop audio here or click to browse</span>
      </label>
    </section>
  );
}

export default FileUploader;
