/**
 * Tests for lib/utils/jsonUtils.js
 *
 * Tests JSON utility functions for handling MongoDB fields and parsing
 */

import { deepClone, cleanMongoFields, parseJsonField } from '../../../lib/utils/jsonUtils.js';

describe('jsonUtils', () => {
  describe('deepClone', () => {
    it('should clone a simple object', () => {
      const original = { name: 'Test', value: 123 };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested objects', () => {
      const original = {
        name: 'Test',
        nested: {
          level1: {
            level2: 'value',
          },
        },
      };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.level1).not.toBe(original.nested.level1);
    });

    it('should clone arrays', () => {
      const original = { items: [1, 2, { nested: 'value' }] };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.items).not.toBe(original.items);
    });

    it('should return null for null input', () => {
      expect(deepClone(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(deepClone(undefined)).toBeNull();
    });

    it('should handle Date objects (converted to string)', () => {
      const date = new Date('2024-01-15');
      const original = { createdAt: date };
      const cloned = deepClone(original);

      expect(cloned.createdAt).toBe(date.toISOString());
    });
  });

  describe('cleanMongoFields', () => {
    it('should remove _id field', () => {
      const obj = { _id: 'abc123', name: 'Test' };
      const cleaned = cleanMongoFields(obj);

      expect(cleaned._id).toBeUndefined();
      expect(cleaned.name).toBe('Test');
    });

    it('should remove __v field', () => {
      const obj = { __v: 0, name: 'Test' };
      const cleaned = cleanMongoFields(obj);

      expect(cleaned.__v).toBeUndefined();
      expect(cleaned.name).toBe('Test');
    });

    it('should remove both _id and __v', () => {
      const obj = { _id: 'abc123', __v: 5, name: 'Test', value: 100 };
      const cleaned = cleanMongoFields(obj);

      expect(cleaned).toEqual({ name: 'Test', value: 100 });
    });

    it('should clean nested objects', () => {
      const obj = {
        _id: 'parent-id',
        name: 'Parent',
        child: {
          _id: 'child-id',
          __v: 2,
          name: 'Child',
        },
      };
      const cleaned = cleanMongoFields(obj);

      expect(cleaned._id).toBeUndefined();
      expect(cleaned.child._id).toBeUndefined();
      expect(cleaned.child.__v).toBeUndefined();
      expect(cleaned.child.name).toBe('Child');
    });

    it('should clean arrays of objects', () => {
      const obj = {
        items: [
          { _id: 'item-1', name: 'Item 1' },
          { _id: 'item-2', name: 'Item 2' },
        ],
      };
      const cleaned = cleanMongoFields(obj);

      expect(cleaned.items[0]._id).toBeUndefined();
      expect(cleaned.items[0].name).toBe('Item 1');
      expect(cleaned.items[1]._id).toBeUndefined();
      expect(cleaned.items[1].name).toBe('Item 2');
    });

    it('should return null for null input', () => {
      expect(cleanMongoFields(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(cleanMongoFields(undefined)).toBeNull();
    });

    it('should handle deeply nested structures', () => {
      const obj = {
        _id: '1',
        level1: {
          _id: '2',
          level2: {
            _id: '3',
            __v: 1,
            data: 'value',
          },
        },
      };
      const cleaned = cleanMongoFields(obj);

      expect(cleaned._id).toBeUndefined();
      expect(cleaned.level1._id).toBeUndefined();
      expect(cleaned.level1.level2._id).toBeUndefined();
      expect(cleaned.level1.level2.__v).toBeUndefined();
      expect(cleaned.level1.level2.data).toBe('value');
    });
  });

  describe('parseJsonField', () => {
    describe('String input', () => {
      it('should parse valid JSON string', () => {
        const result = parseJsonField('["a", "b", "c"]');
        expect(result).toEqual(['a', 'b', 'c']);
      });

      it('should parse JSON object string', () => {
        const result = parseJsonField('{"key": "value"}');
        expect(result).toEqual({ key: 'value' });
      });

      it('should return default for invalid JSON string', () => {
        const result = parseJsonField('not valid json');
        expect(result).toEqual([]);
      });

      it('should return custom default for invalid JSON', () => {
        const result = parseJsonField('not valid json', { default: true });
        expect(result).toEqual({ default: true });
      });
    });

    describe('Array input', () => {
      it('should return array as-is', () => {
        const arr = [1, 2, 3];
        const result = parseJsonField(arr);
        expect(result).toBe(arr);
      });

      it('should handle empty array', () => {
        const result = parseJsonField([]);
        expect(result).toEqual([]);
      });
    });

    describe('Object input', () => {
      it('should return object as-is', () => {
        const obj = { key: 'value' };
        const result = parseJsonField(obj);
        expect(result).toBe(obj);
      });

      it('should handle empty object', () => {
        const obj = {};
        const result = parseJsonField(obj);
        expect(result).toBe(obj);
      });
    });

    describe('Empty/null input', () => {
      it('should return default for null', () => {
        expect(parseJsonField(null)).toEqual([]);
      });

      it('should return default for undefined', () => {
        expect(parseJsonField(undefined)).toEqual([]);
      });

      it('should return default for empty string', () => {
        expect(parseJsonField('')).toEqual([]);
      });

      it('should return custom default for null', () => {
        expect(parseJsonField(null, 'custom')).toBe('custom');
      });
    });

    describe('Edge cases', () => {
      it('should handle number input', () => {
        const result = parseJsonField(123);
        expect(result).toEqual([]); // returns default for non-string/array/object
      });

      it('should handle boolean input', () => {
        const result = parseJsonField(true);
        expect(result).toEqual([]);
      });

      it('should handle nested JSON string', () => {
        const result = parseJsonField('{"nested": {"deep": [1, 2, 3]}}');
        expect(result).toEqual({ nested: { deep: [1, 2, 3] } });
      });
    });
  });
});

