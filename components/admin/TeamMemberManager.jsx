import { useState } from "react";
import { Button, Form, Badge } from "react-bootstrap";

export default function TeamMemberManager({ teamMembers = [], onChange }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    const newMember = { name: name.trim(), email: email.trim() || null };
    onChange([...teamMembers, newMember]);
    setName("");
    setEmail("");
  };

  const handleRemove = (index) => {
    onChange(teamMembers.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Form.Label className="fw-semibold mb-3">Team Members</Form.Label>
      <div className="d-flex gap-2 mb-3">
        <Form.Control
          type="text"
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Form.Control
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button variant="outline-primary" onClick={handleAdd} disabled={!name.trim()}>
          Add
        </Button>
      </div>
      {teamMembers.length > 0 && (
        <div className="d-flex flex-wrap gap-2">
          {teamMembers.map((member, i) => (
            <Badge key={i} bg="info" className="p-2 d-flex align-items-center gap-2" style={{ fontSize: "0.875rem" }}>
              <span>
                {member.name}
                {member.email && <small className="ms-1 opacity-75">({member.email})</small>}
              </span>
              <button
                type="button"
                className="btn-close btn-close-white"
                style={{ fontSize: "0.6rem" }}
                onClick={() => handleRemove(i)}
                aria-label="Remove team member"
              />
            </Badge>
          ))}
        </div>
      )}
      {teamMembers.length === 0 && (
        <p className="text-muted small mb-0">No team members added yet.</p>
      )}
    </div>
  );
}

