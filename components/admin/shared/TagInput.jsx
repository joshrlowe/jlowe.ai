/**
 * TagInput - Reusable tag/chip input component
 *
 * Refactoring: Extract Component
 * Consolidates repeated tag input patterns from ProjectsSettingsSection.
 */

import { useState } from "react";
import { adminStyles } from "./styles";

export default function TagInput({
  label,
  tags = [],
  onAdd,
  onRemove,
  placeholder = "Add item",
  className = "",
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={className}>
      {label && <label className={adminStyles.label}>{label}</label>}

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 ${adminStyles.inputSmall}`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className={adminStyles.buttonOutline}
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span key={index} className={adminStyles.tag}>
              {tag}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="hover:text-red-400 ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
