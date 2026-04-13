function ActivityLog({ logs }) {
  return (
    <section className="glass-panel animate-rise" style={{ animationDelay: '240ms' }}>
      <h2 className="panel-title">Pipeline Activity</h2>
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        {logs.length === 0 ? (
          <li className="opacity-70">No activity yet.</li>
        ) : (
          logs.map((log, index) => (
            <li key={`${log}-${index}`} className="rounded-lg border border-line/70 bg-ink/35 p-3">
              <span className="font-mono text-xs text-accent">[{index + 1}]</span> {log}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export default ActivityLog;
