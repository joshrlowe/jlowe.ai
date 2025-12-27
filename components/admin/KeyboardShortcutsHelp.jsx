export default function KeyboardShortcutsHelp({ show, onHide }) {
  if (!show) return null;

  const shortcuts = [
    { keys: "Ctrl/Cmd + K", description: "Focus search" },
    { keys: "Ctrl/Cmd + N", description: "Create new project" },
    { keys: "Ctrl/Cmd + S", description: "Save (in modal)" },
    { keys: "Ctrl/Cmd + A", description: "Select all" },
    { keys: "Ctrl/Cmd + D", description: "Deselect all" },
    { keys: "Escape", description: "Close modal" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onHide} />
      <div className="relative w-full max-w-md rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6">
        <h2 className="text-xl font-bold text-[var(--color-primary)] mb-4">
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-sm rounded bg-[var(--color-bg-darker)] text-[var(--color-text-primary)] font-mono">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onHide}
          className="mt-6 w-full px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
