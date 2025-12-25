import { Button, Form, Dropdown } from "react-bootstrap";

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
  if (selectedIds.length === 0) {
    return (
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Check
          type="checkbox"
          checked={allSelected}
          onChange={(e) => (e.target.checked ? onSelectAll() : onDeselectAll())}
          label={`Select all ${totalCount} projects`}
        />
      </div>
    );
  }

  return (
    <div
      className="d-flex justify-content-between align-items-center mb-3 p-3"
      style={{
        backgroundColor: "var(--color-bg-dark-alt)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <span style={{ color: "var(--color-text-primary)", fontWeight: "500" }}>
          {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""} selected
        </span>
        <Button variant="link" size="sm" onClick={onDeselectAll} style={{ color: "var(--color-text-secondary)" }}>
          Clear selection
        </Button>
      </div>
      <div className="d-flex gap-2">
        <Dropdown>
          <Dropdown.Toggle variant="outline-primary" size="sm" id="bulk-status-dropdown">
            Change Status
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => onBulkStatusChange("Draft")}>Draft</Dropdown.Item>
            <Dropdown.Item onClick={() => onBulkStatusChange("Published")}>Published</Dropdown.Item>
            <Dropdown.Item onClick={() => onBulkStatusChange("InProgress")}>In Progress</Dropdown.Item>
            <Dropdown.Item onClick={() => onBulkStatusChange("Completed")}>Completed</Dropdown.Item>
            <Dropdown.Item onClick={() => onBulkStatusChange("OnHold")}>On Hold</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm" id="bulk-featured-dropdown">
            Featured
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => onBulkFeaturedChange(true)}>Set Featured</Dropdown.Item>
            <Dropdown.Item onClick={() => onBulkFeaturedChange(false)}>Remove Featured</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Button variant="outline-danger" size="sm" onClick={onBulkDelete}>
          Delete Selected
        </Button>
      </div>
    </div>
  );
}

