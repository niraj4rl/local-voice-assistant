function ResultDashboard({ result, loading }) {
  const sttDebug = result.stt_debug;

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
          <h3 className="label">STT Interpretation</h3>
          <div className="value-box space-y-2 text-xs">
            <p>
              <span className="text-slate-400">Backend:</span> {sttDebug?.backend || 'n/a'}
            </p>
            <p>
              <span className="text-slate-400">Language:</span> {sttDebug?.language || 'unknown'}
              {typeof sttDebug?.language_probability === 'number' && sttDebug.language_probability > 0
                ? ` (${sttDebug.language_probability.toFixed(2)})`
                : ''}
            </p>
            <p>
              <span className="text-slate-400">Raw Transcript:</span> {sttDebug?.raw_text || 'none'}
            </p>
            <p className="text-slate-400">Segments:</p>
            <div className="max-h-28 overflow-auto rounded border border-line/70 bg-ink/40 p-2 font-mono text-[11px]">
              {sttDebug?.segments?.length
                ? sttDebug.segments.map((segment, index) => (
                    <div key={`${segment.start}-${segment.end}-${index}`}>
                      [{segment.start.toFixed(2)}s-{segment.end.toFixed(2)}s] {segment.text || '(silence)'}
                    </div>
                  ))
                : 'No segments detected'}
            </div>
          </div>
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
