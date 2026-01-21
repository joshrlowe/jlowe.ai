/**
 * Tests for jsonUtils utility
 * 
 * Tests JSON manipulation and MongoDB field cleanup functions.
 */

import { deepClone, cleanMongoFields } from '@/lib/utils/jsonUtils';

describe('jsonUtils', () => {
  describe('deepClone', () => {
    it('should create a deep copy of an object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should handle arrays', () => {
      const original = { items: [1, 2, { nested: 3 }] };
      const cloned = deepClone(original);
      
      expect(cloned.items).toEqual(original.items);
      expect(cloned.items).not.toBe(original.items);
      expect(cloned.items[2]).not.toBe(original.items[2]);
    });

    it('should return null for null input', () => {
      expect(deepClone(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(deepClone(undefined)).toBeNull();
    });

    it('should handle empty object', () => {
      expect(deepClone({})).toEqual({});
    });

    it('should handle nested objects', () => {
      const original = { 
        level1: { 
          level2: { 
            level3: { value: 'deep' } 
          } 
        } 
      };
      const cloned = deepClone(original);
      
      expect(cloned.level1.level2.level3.value).toBe('deep');
      
      // Modify original to verify independence
      original.level1.level2.level3.value = 'modified';
      expect(cloned.level1.level2.level3.value).toBe('deep');
    });

    it('should handle dates (converted to strings)', () => {
      const original = { date: new Date('2024-01-15') };
      const cloned = deepClone(original);
      
      // JSON serialization converts dates to ISO strings
      expect(typeof cloned.date).toBe('string');
    });

    it('should handle primitives in object', () => {
      const original = { 
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
      };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
    });
  });

  describe('cleanMongoFields', () => {
    it('should remove _id and __v from object', () => {
      const obj = { _id: 'abc123', __v: 0, name: 'Test' };
      const result = cleanMongoFields(obj);
      
      expect(result).toEqual({ name: 'Test' });
      expect(result._id).toBeUndefined();
      expect(result.__v).toBeUndefined();
    });

    it('should remove _id and __v from nested objects', () => {
      const obj = {
        _id: 'parent-id',
        name: 'Parent',
        child: {
          _id: 'child-id',
          __v: 1,
          name: 'Child',
        },
      };
      const result = cleanMongoFields(obj);
      
      expect(result.name).toBe('Parent');
      expect(result.child.name).toBe('Child');
      expect(result._id).toBeUndefined();
      expect(result.child._id).toBeUndefined();
      expect(result.child.__v).toBeUndefined();
    });

    it('should handle arrays with MongoDB fields', () => {
      const obj = {
        items: [
          { _id: 'item1', name: 'First' },
          { _id: 'item2', __v: 0, name: 'Second' },
        ],
      };
      const result = cleanMongoFields(obj);
      
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ name: 'First' });
      expect(result.items[1]).toEqual({ name: 'Second' });
    });

    it('should return null for null input', () => {
      expect(cleanMongoFields(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(cleanMongoFields(undefined)).toBeNull();
    });

    it('should handle empty object', () => {
      expect(cleanMongoFields({})).toEqual({});
    });

    it('should handle object with only _id and __v', () => {
      const obj = { _id: 'test', __v: 0 };
      expect(cleanMongoFields(obj)).toEqual({});
    });

    it('should handle deeply nested arrays and objects', () => {
      const obj = {
        _id: 'root',
        data: {
          _id: 'data',
          items: [
            {
              _id: 'item',
              subItems: [
                { _id: 'sub', value: 'test' }
              ]
            }
          ]
        }
      };
      const result = cleanMongoFields(obj);
      
      expect(result.data.items[0].subItems[0]).toEqual({ value: 'test' });
    });

    it('should preserve primitive values in arrays', () => {
      const obj = {
        _id: 'test',
        values: [1, 'string', true, null],
      };
      const result = cleanMongoFields(obj);
      
      expect(result.values).toEqual([1, 'string', true, null]);
    });
  });
});




