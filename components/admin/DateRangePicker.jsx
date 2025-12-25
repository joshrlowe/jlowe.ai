import { Form } from "react-bootstrap";

export default function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, label = "Date Range" }) {
  return (
    <div className="d-flex gap-2 align-items-end">
      <Form.Group className="mb-0">
        <Form.Label className="small">{label}</Form.Label>
        <Form.Control
          type="date"
          value={startDate || ""}
          onChange={(e) => onStartDateChange(e.target.value || null)}
          size="sm"
        />
      </Form.Group>
      <span className="text-muted mb-2">to</span>
      <Form.Group className="mb-0">
        <Form.Control
          type="date"
          value={endDate || ""}
          onChange={(e) => onEndDateChange(e.target.value || null)}
          size="sm"
        />
      </Form.Group>
    </div>
  );
}

