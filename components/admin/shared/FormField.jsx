/**
 * FormField - Reusable form field with label
 *
 * Refactoring: Extract Component
 * Consolidates repeated label + input patterns.
 */

import { adminStyles } from "./styles";

export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  rows,
  options,
  className = "",
  inputClassName = "",
  children,
}) {
  const inputClass = rows
    ? `${adminStyles.input} resize-none`
    : adminStyles.input;

  const renderInput = () => {
    // Custom children (for complex inputs)
    if (children) return children;

    // Select dropdown
    if (options) {
      return (
        <select
          value={value}
          onChange={onChange}
          className={`${inputClass} ${inputClassName}`}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value || opt.key} value={opt.value || opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Textarea
    if (rows) {
      return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={`${inputClass} ${inputClassName}`}
        />
      );
    }

    // Standard input
    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${adminStyles.input} ${inputClassName}`}
      />
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className={adminStyles.label}>
          {label}
          {required && " *"}
        </label>
      )}
      {renderInput()}
    </div>
  );
}
