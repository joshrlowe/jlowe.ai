import { useState, useCallback } from "react";

export interface ValidationRule {
  required?: string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
  validate?: (value: unknown, allValues?: Record<string, unknown>) => string | null;
}

export type ValidationRules = Record<string, ValidationRule>;

export interface UseFormValidationResult {
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  validateField: (
    fieldName: string,
    value: unknown,
    allValues?: Record<string, unknown>
  ) => boolean;
  validateAll: (values: Record<string, unknown>) => boolean;
  setFieldTouched: (fieldName: string) => void;
  clearErrors: () => void;
  getFieldError: (fieldName: string) => string | null;
  isValid: boolean;
}

export function useFormValidation(rules: ValidationRules = {}): UseFormValidationResult {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (fieldName: string, value: unknown, allValues: Record<string, unknown> = {}): string | null => {
      const rule = rules[fieldName];
      if (!rule) return null;

      if (rule.required && (!value || (typeof value === "string" && !value.trim()))) {
        return rule.required;
      }

      if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
        return rule.minLengthMessage || `Must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
        return rule.maxLengthMessage || `Must be less than ${rule.maxLength} characters`;
      }

      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        return rule.patternMessage || "Invalid format";
      }

      if (rule.validate && typeof rule.validate === "function") {
        const customError = rule.validate(value, allValues);
        if (customError) return customError;
      }

      return null;
    },
    [rules]
  );

  const validateField = useCallback(
    (fieldName: string, value: unknown, allValues?: Record<string, unknown>) => {
      const error = validate(fieldName, value, allValues);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
      return !error;
    },
    [validate]
  );

  const validateAll = useCallback(
    (values: Record<string, unknown>) => {
      const newErrors: Record<string, string | null> = {};
      let isValid = true;

      Object.keys(rules).forEach((fieldName) => {
        const error = validate(fieldName, values[fieldName], values);
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules, validate]
  );

  const setFieldTouched = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (fieldName: string) => {
      return touched[fieldName] ? errors[fieldName] : null;
    },
    [errors, touched]
  );

  return {
    errors,
    touched,
    validateField,
    validateAll,
    setFieldTouched,
    clearErrors,
    getFieldError,
    isValid: Object.keys(errors).length === 0 || Object.values(errors).every((e) => !e),
  };
}
