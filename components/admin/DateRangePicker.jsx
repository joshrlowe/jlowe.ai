export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate || ""}
        onChange={(e) => onStartDateChange(e.target.value || null)}
        className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        placeholder="Start"
      />
      <span className="text-[var(--color-text-muted)]">to</span>
      <input
        type="date"
        value={endDate || ""}
        onChange={(e) => onEndDateChange(e.target.value || null)}
        className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        placeholder="End"
      />
    </div>
  );
}
