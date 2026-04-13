function ResultDashboard({ result, loading }) {
  return (
    <section className="glass-panel h-full animate-rise" style={{ animationDelay: '120ms' }}>
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Result Dashboard</h2>
        <span className={`intent-badge ${result.intent || 'general_chat'}`}>
          {(result.intent || 'general_chat').replace('_', ' ')}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <article>
          <h3 className="label">Transcription</h3>
          <p className="value-box min-h-[96px]">{result.transcription || (loading ? 'Transcribing audio...' : 'Awaiting input')}</p>
        </article>

        <article>
          <h3 className="label">Action Taken</h3>
          <p className="value-box">{result.action || (loading ? 'Running tools...' : 'No action yet')}</p>
        </article>

        <article>
          <h3 className="label">Final Output</h3>
          <pre className="value-box max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs">{result.output || (loading ? 'Generating output...' : 'No output yet')}</pre>
        </article>
      </div>
    </section>
  );
}

export default ResultDashboard;
