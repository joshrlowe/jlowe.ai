import type { ChangeEvent, ReactNode } from "react";
import { adminStyles } from "./styles";

interface FormFieldOption {
  value?: string | number;
  key?: string | number;
  label: string;
}

interface FormFieldProps {
  label?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: FormFieldOption[];
  className?: string;
  inputClassName?: string;
  children?: ReactNode;
}

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
}: FormFieldProps) {
  const inputClass = rows ? `${adminStyles.input} resize-none` : adminStyles.input;

  const renderInput = () => {
    if (children) return children;

    if (options) {
      return (
        <select
          value={value}
          onChange={onChange}
          className={`${inputClass} ${inputClassName}`}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value ?? opt.key} value={opt.value ?? opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

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
