function OutputPreview({ result }) {
  return (
    <section className="glass-panel animate-rise" style={{ animationDelay: '170ms' }}>
      <h2 className="panel-title">Output Preview</h2>

      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-lg border border-line/70 bg-ink/45 p-3">
          <p className="label">Detected Intent</p>
          <p className="font-mono text-accent">{result.intent || 'general_chat'}</p>
        </div>

        <div className="rounded-lg border border-line/70 bg-ink/45 p-3">
          <p className="label">Execution Status</p>
          <p className="text-slate-200">{result.action || 'Idle'}</p>
        </div>

        <div className="rounded-lg border border-line/70 bg-ink/45 p-3">
          <p className="label">File Status</p>
          <p className="text-slate-200">
            {result.output && /\/output\//.test(result.output)
              ? result.output
              : 'Generated files are stored in /output when file actions are triggered.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export default OutputPreview;
