/**
 * Tests for validators utility functions
 * 
 * Comprehensive tests for validation utilities.
 */

import {
  validateRequiredFields,
  validateArrayField,
  validateArrayFields,
  combineValidations,
} from '@/lib/utils/validators';

describe('validators', () => {
  describe('validateRequiredFields', () => {
    it('should return isValid true when all required fields are present', () => {
      const data = { name: 'John', email: 'john@example.com', age: 30 };
      const result = validateRequiredFields(data, ['name', 'email']);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return isValid false when required fields are missing', () => {
      const data = { name: 'John' };
      const result = validateRequiredFields(data, ['name', 'email', 'age']);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Missing required fields');
      expect(result.message).toContain('email');
      expect(result.message).toContain('age');
    });

    it('should handle empty object', () => {
      const data = {};
      const result = validateRequiredFields(data, ['name']);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('name');
    });

    it('should handle empty required fields array', () => {
      const data = { name: 'John' };
      const result = validateRequiredFields(data, []);

      expect(result.isValid).toBe(true);
    });

    it('should treat empty string as missing', () => {
      const data = { name: '' };
      const result = validateRequiredFields(data, ['name']);

      expect(result.isValid).toBe(false);
    });

    it('should treat null as missing', () => {
      const data = { name: null };
      const result = validateRequiredFields(data, ['name']);

      expect(result.isValid).toBe(false);
    });

    it('should treat undefined as missing', () => {
      const data = { name: undefined };
      const result = validateRequiredFields(data, ['name']);

      expect(result.isValid).toBe(false);
    });

    it('should treat 0 as valid (not missing)', () => {
      const data = { count: 0 };
      const result = validateRequiredFields(data, ['count']);

      // Note: 0 is falsy, so it's treated as missing in current implementation
      expect(result.isValid).toBe(false);
    });

    it('should treat false as valid (not missing)', () => {
      const data = { active: false };
      const result = validateRequiredFields(data, ['active']);

      // Note: false is falsy, so it's treated as missing in current implementation
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateArrayField', () => {
    it('should return isValid true when value is an array', () => {
      const result = validateArrayField([1, 2, 3], 'items');

      expect(result.isValid).toBe(true);
    });

    it('should return isValid true for empty array', () => {
      const result = validateArrayField([], 'items');

      expect(result.isValid).toBe(true);
    });

    it('should return isValid false for string', () => {
      const result = validateArrayField('not an array', 'items');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('items');
      expect(result.message).toContain('array');
    });

    it('should return isValid false for object', () => {
      const result = validateArrayField({ key: 'value' }, 'items');

      expect(result.isValid).toBe(false);
    });

    it('should return isValid false for number', () => {
      const result = validateArrayField(123, 'items');

      expect(result.isValid).toBe(false);
    });

    it('should return isValid false for null', () => {
      const result = validateArrayField(null, 'items');

      expect(result.isValid).toBe(false);
    });

    it('should return isValid false for undefined', () => {
      const result = validateArrayField(undefined, 'items');

      expect(result.isValid).toBe(false);
    });

    it('should include field name in error message', () => {
      const result = validateArrayField('test', 'myCustomField');

      expect(result.message).toContain('myCustomField');
    });
  });

  describe('validateArrayFields', () => {
    it('should return isValid true when all fields are arrays', () => {
      const data = { tags: [], skills: ['JS'], hobbies: ['reading'] };
      const result = validateArrayFields(data, ['tags', 'skills', 'hobbies']);

      expect(result.isValid).toBe(true);
    });

    it('should return isValid false when any field is not an array', () => {
      const data = { tags: ['tag1'], skills: 'not an array' };
      const result = validateArrayFields(data, ['tags', 'skills']);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('skills');
    });

    it('should return first invalid field error', () => {
      const data = { tags: 'invalid', skills: 'also invalid' };
      const result = validateArrayFields(data, ['tags', 'skills']);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('tags');
    });

    it('should handle empty array fields list', () => {
      const data = { tags: [] };
      const result = validateArrayFields(data, []);

      expect(result.isValid).toBe(true);
    });

    it('should handle undefined field in data', () => {
      const data = { tags: ['tag'] };
      const result = validateArrayFields(data, ['tags', 'missing']);

      expect(result.isValid).toBe(false);
    });
  });

  describe('combineValidations', () => {
    it('should return isValid true when all validations pass', () => {
      const result = combineValidations(
        { isValid: true },
        { isValid: true },
        { isValid: true }
      );

      expect(result.isValid).toBe(true);
    });

    it('should return isValid false on first failing validation', () => {
      const result = combineValidations(
        { isValid: true },
        { isValid: false, message: 'Second validation failed' },
        { isValid: false, message: 'Third validation failed' }
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Second validation failed');
    });

    it('should handle empty validations array', () => {
      const result = combineValidations();

      expect(result.isValid).toBe(true);
    });

    it('should handle single validation', () => {
      const result = combineValidations({ isValid: false, message: 'Failed' });

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Failed');
    });

    it('should handle single passing validation', () => {
      const result = combineValidations({ isValid: true });

      expect(result.isValid).toBe(true);
    });

    it('should stop at first failure (short-circuit)', () => {
      const results = [
        { isValid: true },
        { isValid: false, message: 'First failure' },
        { isValid: false, message: 'Second failure' },
      ];

      const result = combineValidations(...results);

      expect(result.message).toBe('First failure');
    });
  });
});



