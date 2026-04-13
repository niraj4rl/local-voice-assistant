const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

export async function processAudio(fileBlob, filename = 'recording.webm') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000);
  const formData = new FormData();
  formData.append('file', fileBlob, filename);

  let response;
  try {
    response = await fetch(`${API_BASE}/process-audio`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Audio processing timed out. First run may be downloading/loading Whisper model.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await safeError(response);
    throw new Error(detail || 'Failed to process audio');
  }

  return response.json();
}

export async function processText(text) {
  const formData = new FormData();
  formData.append('text', text);

  const response = await fetch(`${API_BASE}/process-text`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const detail = await safeError(response);
    throw new Error(detail || 'Failed to process text');
  }

  return response.json();
}

export async function warmupStt() {
  const response = await fetch(`${API_BASE}/warmup-stt`, { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to start STT warmup');
  }
  return response.json();
}

export async function getSttStatus() {
  const response = await fetch(`${API_BASE}/stt-status`);
  if (!response.ok) {
    throw new Error('Failed to read STT status');
  }
  return response.json();
}

async function safeError(response) {
  try {
    const payload = await response.json();
    return payload.detail || payload.message;
  } catch {
    return null;
  }
}
