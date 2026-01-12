/**
 * Tests for projectStatusMapper utility
 * 
 * Tests the mapping of MongoDB project status values to Prisma enum values.
 */

import { mapProjectStatus } from '@/lib/utils/projectStatusMapper';

describe('projectStatusMapper', () => {
  describe('mapProjectStatus', () => {
    // Test all valid status mappings
    describe('valid status mappings', () => {
      const validMappings = [
        { input: 'Planned', expected: 'Planned' },
        { input: 'In Progress', expected: 'InProgress' },
        { input: 'In Development', expected: 'InDevelopment' },
        { input: 'In Testing', expected: 'InTesting' },
        { input: 'Completed', expected: 'Completed' },
        { input: 'In Production', expected: 'InProduction' },
        { input: 'Maintenance', expected: 'Maintenance' },
        { input: 'On Hold', expected: 'OnHold' },
        { input: 'Deprecated', expected: 'Deprecated' },
        { input: 'Sunsetted', expected: 'Sunsetted' },
      ];

      validMappings.forEach(({ input, expected }) => {
        it(`should map "${input}" to "${expected}"`, () => {
          expect(mapProjectStatus(input)).toBe(expected);
        });
      });
    });

    // Test edge cases
    describe('edge cases', () => {
      it('should return null for null input', () => {
        expect(mapProjectStatus(null)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(mapProjectStatus(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(mapProjectStatus('')).toBeNull();
      });

      it('should return null for unknown status', () => {
        expect(mapProjectStatus('Unknown Status')).toBeNull();
      });

      it('should return null for lowercase status (case-sensitive)', () => {
        expect(mapProjectStatus('planned')).toBeNull();
        expect(mapProjectStatus('in progress')).toBeNull();
      });
    });
  });
});
