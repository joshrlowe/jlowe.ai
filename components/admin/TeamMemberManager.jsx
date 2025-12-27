import { useState } from "react";

export default function TeamMemberManager({ teamMembers = [], onChange }) {
  const [newMember, setNewMember] = useState({ name: "", email: "" });

  const addMember = () => {
    if (newMember.name.trim()) {
      onChange([
        ...teamMembers,
        { name: newMember.name.trim(), email: newMember.email.trim() || null },
      ]);
      setNewMember({ name: "", email: "" });
    }
  };

  const removeMember = (index) => {
    onChange(teamMembers.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        Team Members
      </label>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newMember.name}
          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          placeholder="Name"
          className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <input
          type="email"
          value={newMember.email}
          onChange={(e) =>
            setNewMember({ ...newMember, email: e.target.value })
          }
          placeholder="Email (optional)"
          className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="button"
          onClick={addMember}
          disabled={!newMember.name.trim()}
          className="px-4 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      {teamMembers.length > 0 && (
        <div className="space-y-2">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-darker)]"
            >
              <div>
                <div className="text-[var(--color-text-primary)] font-medium">
                  {member.name}
                </div>
                {member.email && (
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {member.email}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
