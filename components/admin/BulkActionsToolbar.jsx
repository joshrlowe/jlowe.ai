export default function BulkActionsToolbar({
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusChange,
  onBulkFeaturedChange,
  allSelected,
  someSelected,
  totalCount,
}) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 mb-4 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30">
      <span className="text-sm text-[var(--color-text-primary)]">
        {selectedIds.length} of {totalCount} selected
      </span>

      <div className="flex gap-2">
        <button
          onClick={onSelectAll}
          disabled={allSelected}
          className="px-3 py-1 text-sm rounded bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
        >
          Select All
        </button>
        <button
          onClick={onDeselectAll}
          className="px-3 py-1 text-sm rounded bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Deselect All
        </button>
      </div>

      <div className="flex gap-2 ml-auto">
        <select
          onChange={(e) => e.target.value && onBulkStatusChange(e.target.value)}
          className="px-3 py-1 text-sm rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
          defaultValue=""
        >
          <option value="" disabled>
            Set Status
          </option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Completed">Completed</option>
        </select>

        <button
          onClick={() => onBulkFeaturedChange(true)}
          className="px-3 py-1 text-sm rounded border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
        >
          Feature
        </button>

        <button
          onClick={onBulkDelete}
          className="px-3 py-1 text-sm rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          Delete Selected
        </button>
      </div>
    </div>
  );
}
