/**
 * Tests for useFormValidation custom hook
 * 
 * Tests form validation state management and validation logic.
 */

import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '@/components/admin/useFormValidation';

describe('useFormValidation', () => {
  describe('initial state', () => {
    it('should initialize with empty errors and touched state', () => {
      const { result } = renderHook(() => useFormValidation({}));
      
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('validateField', () => {
    it('should validate required field', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      let isValid;
      act(() => {
        isValid = result.current.validateField('name', '');
      });
      
      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('Name is required');
    });

    it('should pass validation for valid required field', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      let isValid;
      act(() => {
        isValid = result.current.validateField('name', 'John');
      });
      
      expect(isValid).toBe(true);
      expect(result.current.errors.name).toBeNull();
    });

    it('should validate minLength', () => {
      const rules = {
        password: { minLength: 8, minLengthMessage: 'Password too short' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('password', 'short');
      });
      
      expect(result.current.errors.password).toBe('Password too short');
    });

    it('should use default minLength message', () => {
      const rules = {
        password: { minLength: 8 },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('password', 'short');
      });
      
      expect(result.current.errors.password).toContain('at least 8 characters');
    });

    it('should validate maxLength', () => {
      const rules = {
        name: { maxLength: 10, maxLengthMessage: 'Name too long' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', 'This is a very long name');
      });
      
      expect(result.current.errors.name).toBe('Name too long');
    });

    it('should use default maxLength message', () => {
      const rules = {
        name: { maxLength: 10 },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', 'This is a very long name');
      });
      
      expect(result.current.errors.name).toContain('less than 10 characters');
    });

    it('should validate pattern', () => {
      const rules = {
        email: { 
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
          patternMessage: 'Invalid email' 
        },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('email', 'not-an-email');
      });
      
      expect(result.current.errors.email).toBe('Invalid email');
    });

    it('should use default pattern message', () => {
      const rules = {
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('email', 'not-an-email');
      });
      
      expect(result.current.errors.email).toBe('Invalid format');
    });

    it('should validate with custom validate function', () => {
      const rules = {
        confirmPassword: {
          validate: (value, allValues) => 
            value !== allValues.password ? 'Passwords do not match' : null,
        },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('confirmPassword', 'different', { password: 'original' });
      });
      
      expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
    });

    it('should return null for field without rules', () => {
      const rules = {};
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      let isValid;
      act(() => {
        isValid = result.current.validateField('unknownField', 'value');
      });
      
      expect(isValid).toBe(true);
    });

    it('should treat whitespace-only string as empty for required', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', '   ');
      });
      
      expect(result.current.errors.name).toBe('Name is required');
    });
  });

  describe('validateAll', () => {
    it('should validate all fields at once', () => {
      const rules = {
        name: { required: 'Name is required' },
        email: { required: 'Email is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      let isValid;
      act(() => {
        isValid = result.current.validateAll({ name: '', email: '' });
      });
      
      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('Name is required');
      expect(result.current.errors.email).toBe('Email is required');
    });

    it('should return true when all fields are valid', () => {
      const rules = {
        name: { required: 'Name is required' },
        email: { required: 'Email is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      let isValid;
      act(() => {
        isValid = result.current.validateAll({ name: 'John', email: 'john@example.com' });
      });
      
      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('setFieldTouched', () => {
    it('should mark field as touched', () => {
      const { result } = renderHook(() => useFormValidation({}));
      
      act(() => {
        result.current.setFieldTouched('name');
      });
      
      expect(result.current.touched.name).toBe(true);
    });
  });

  describe('getFieldError', () => {
    it('should return null for untouched field with error', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', '');
      });
      
      expect(result.current.getFieldError('name')).toBeNull();
    });

    it('should return error for touched field', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', '');
        result.current.setFieldTouched('name');
      });
      
      expect(result.current.getFieldError('name')).toBe('Name is required');
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors and touched state', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', '');
        result.current.setFieldTouched('name');
      });
      
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.touched.name).toBe(true);
      
      act(() => {
        result.current.clearErrors();
      });
      
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe('isValid', () => {
    it('should be true when no errors', () => {
      const { result } = renderHook(() => useFormValidation({}));
      
      expect(result.current.isValid).toBe(true);
    });

    it('should be false when there are errors', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', '');
      });
      
      expect(result.current.isValid).toBe(false);
    });

    it('should be true when all errors are null', () => {
      const rules = {
        name: { required: 'Name is required' },
      };
      
      const { result } = renderHook(() => useFormValidation(rules));
      
      act(() => {
        result.current.validateField('name', 'Valid');
      });
      
      expect(result.current.isValid).toBe(true);
    });
  });
});



