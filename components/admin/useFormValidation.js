import { useState, useCallback } from "react";

export function useFormValidation(rules = {}) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback(
    (fieldName, value, allValues = {}) => {
      const rule = rules[fieldName];
      if (!rule) return null;

      // Required check
      if (
        rule.required &&
        (!value || (typeof value === "string" && !value.trim()))
      ) {
        return rule.required;
      }

      // Min length check
      if (rule.minLength && value && value.length < rule.minLength) {
        return (
          rule.minLengthMessage ||
          `Must be at least ${rule.minLength} characters`
        );
      }

      // Max length check
      if (rule.maxLength && value && value.length > rule.maxLength) {
        return (
          rule.maxLengthMessage ||
          `Must be less than ${rule.maxLength} characters`
        );
      }

      // Pattern check
      if (rule.pattern && value && !rule.pattern.test(value)) {
        return rule.patternMessage || "Invalid format";
      }

      // Custom validation
      if (rule.validate && typeof rule.validate === "function") {
        const customError = rule.validate(value, allValues);
        if (customError) return customError;
      }

      return null;
    },
    [rules],
  );

  const validateField = useCallback(
    (fieldName, value, allValues) => {
      const error = validate(fieldName, value, allValues);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
      return !error;
    },
    [validate],
  );

  const validateAll = useCallback(
    (values) => {
      const newErrors = {};
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
    [rules, validate],
  );

  const setFieldTouched = useCallback((fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (fieldName) => {
      return touched[fieldName] ? errors[fieldName] : null;
    },
    [errors, touched],
  );

  return {
    errors,
    touched,
    validateField,
    validateAll,
    setFieldTouched,
    clearErrors,
    getFieldError,
    isValid:
      Object.keys(errors).length === 0 ||
      Object.values(errors).every((e) => !e),
  };
}
